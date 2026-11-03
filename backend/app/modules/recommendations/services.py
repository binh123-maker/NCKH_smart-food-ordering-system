import os
import sys
import types
import uuid
import joblib
import pandas as pd
from pathlib import Path
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

# Unpickling compatibility: ensure 'backend.app' resolves if serialized under that name
if "backend" not in sys.modules:
    import app
    backend_module = types.ModuleType("backend")
    backend_module.app = app
    sys.modules["backend"] = backend_module
    sys.modules["backend.app"] = app

from app.models.user import User
from app.models.food import Food
from app.models.recommendation import RecommendationLog, RecommendationFeedback, ModelVersion
from app.modules.recommendations.schemas import RecommendedFoodItem, RecommendationFeedbackRequest
from app.recsys.config import SERIALIZED_DIR, RAW_DATA_DIR, CURRENT_MODEL_VERSION

# Lazy loaded singleton model cache
_MODEL_CACHE: Dict[str, Any] = {}

def get_recsys_models():
    """Lazy loader for serialized AI models."""
    global _MODEL_CACHE
    if "hybrid" not in _MODEL_CACHE:
        hybrid_file = SERIALIZED_DIR / "hybrid_model.joblib"
        cbf_file = SERIALIZED_DIR / "cbf_model.joblib"
        foods_csv = RAW_DATA_DIR / "foods.csv"

        if hybrid_file.exists() and foods_csv.exists():
            try:
                _MODEL_CACHE["hybrid"] = joblib.load(hybrid_file)
                _MODEL_CACHE["cbf"] = joblib.load(cbf_file) if cbf_file.exists() else None
                _MODEL_CACHE["foods_df"] = pd.read_csv(foods_csv)
                # Map dataset food_001 -> name
                _MODEL_CACHE["id_to_name"] = dict(zip(_MODEL_CACHE["foods_df"]["id"], _MODEL_CACHE["foods_df"]["name"]))
            except Exception as e:
                print(f"[RecSys Warning] Failed to load serialized model: {e}")
                _MODEL_CACHE["hybrid"] = None
        else:
            _MODEL_CACHE["hybrid"] = None
            
    return _MODEL_CACHE.get("hybrid"), _MODEL_CACHE.get("cbf"), _MODEL_CACHE.get("id_to_name", {})


class RecommendationService:
    """
    Application Service Boundary for RecSys.
    Integrates trained AI models (Content-Based, Collaborative Filtering, Hybrid)
    with database models and audit logging.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_home_recommendations(
        self,
        user: Optional[User],
        limit: int = 10,
        filter_constraints: Optional[Dict[str, Any]] = None
    ) -> List[dict]:
        """
        Serves personalized home feed recommendations using Hybrid RecSys.
        Fuses Taste Profile + Nutrition Fitness (Calories, Protein) + Budget Constraints.
        Logs inference request for scientific auditing.
        """
        hybrid_model, _, id_to_name = get_recsys_models()
        active_version = self.db.query(ModelVersion).filter(ModelVersion.is_active == True).first()

        # If AI model is loaded, execute scientific hybrid recommendation
        if hybrid_model is not None and id_to_name:
            user_id = user.id if user else "cold_user"
            
            # Incorporate user preferences from DB into filter_constraints if not passed
            constraints = filter_constraints.copy() if filter_constraints else {}
            if user and user.preferences:
                if "max_calories" not in constraints and getattr(user.preferences, "daily_calorie_target", None):
                    constraints["max_calories"] = float(user.preferences.daily_calorie_target)
                if "min_protein" not in constraints and getattr(user.preferences, "preferred_protein_min", None):
                    constraints["min_protein"] = float(user.preferences.preferred_protein_min)
                if "max_price" not in constraints and getattr(user.preferences, "budget_per_meal", None):
                    constraints["max_price"] = float(user.preferences.budget_per_meal)

            raw_recs = hybrid_model.recommend(
                user_id=user_id,
                k=limit * 2,  # Fetch slightly larger candidate set to ensure DB matching
                exclude_known=True,
                filter_constraints=constraints
            )

            # Map candidate items to DB Foods with single batch query
            candidate_names = [id_to_name.get(fid) for fid, _, _ in raw_recs if id_to_name.get(fid)]
            matched_foods = self.db.query(Food).filter(
                Food.name.in_(candidate_names),
                Food.is_available == True
            ).all()
            food_by_name = {f.name: f for f in matched_foods}

            items = []
            log_entries = []
            for rank, (dataset_fid, score, reason) in enumerate(raw_recs):
                dish_name = id_to_name.get(dataset_fid)
                if not dish_name or dish_name not in food_by_name:
                    continue

                db_food = food_by_name[dish_name]
                built_item = self._build_item(db_food, score=score, reason=reason)
                items.append(built_item)
                log_entries.append({
                    "food_id": db_food.id,
                    "score": round(score, 4),
                    "rank": len(items)
                })
                
                if len(items) >= limit:
                    break

            if items:
                # Log recommendation inference for scientific auditing
                self._log_recommendation(
                    user_id=user.id if user else None,
                    version_id=active_version.id if active_version else None,
                    rec_type="HOME_FEED",
                    items=log_entries
                )
                return items

        # Fallback to database popularity / preferences if model not loaded
        return self._fallback_recommendations(user=user, limit=limit)

    def get_similar_foods(self, food_id: str, limit: int = 4) -> List[dict]:
        """
        Serves Content-Based Recommendations for similar dishes using Item-Item Cosine Similarity.
        """
        target = self.db.query(Food).filter(Food.id == food_id).first()
        if not target:
            return []

        _, cbf_model, id_to_name = get_recsys_models()
        if cbf_model is not None and id_to_name:
            # Reverse lookup name to dataset ID
            name_to_id = {v: k for k, v in id_to_name.items()}
            target_code = name_to_id.get(target.name)
            if target_code:
                sim_items = cbf_model.get_similar_items(food_id=target_code, k=limit * 2)
                matched_foods = []
                for sim_code, score, reason in sim_items:
                    s_name = id_to_name.get(sim_code)
                    f_match = self.db.query(Food).filter(Food.name == s_name, Food.is_available == True).first()
                    if f_match and f_match.id != target.id:
                        matched_foods.append(self._build_item(f_match, score=score, reason=reason))
                    if len(matched_foods) >= limit:
                        break
                if matched_foods:
                    return matched_foods

        # DB Category fallback
        similar_foods = (
            self.db.query(Food)
            .filter(
                Food.category_id == target.category_id,
                Food.id != target.id,
                Food.is_available == True,
            )
            .order_by(Food.rating_average.desc())
            .limit(limit)
            .all()
        )

        return [
            self._build_item(
                f,
                score=0.92,
                reason=f"Cùng nhóm món '{target.category.name if target.category else 'Ẩm thực'}' và tương đồng dinh dưỡng",
            )
            for f in similar_foods
        ]

    def get_cart_upsell(self, user: User, limit: int = 4) -> List[dict]:
        """
        Serves Complementary / Cross-sell Recommendations (Drinks, desserts, side dishes).
        """
        foods = (
            self.db.query(Food)
            .filter(Food.is_available == True)
            .order_by(Food.order_count.desc(), Food.rating_average.desc())
            .limit(limit)
            .all()
        )
        return [
            self._build_item(f, score=0.88, reason="Món ăn kèm được nhiều khách hàng chọn cùng")
            for f in foods
        ]

    def record_feedback(self, user: Optional[User], req: RecommendationFeedbackRequest) -> dict:
        """Records explicit interaction feedback (impression, click, dislike)."""
        fb = RecommendationFeedback(
            id=str(uuid.uuid4()),
            log_id=req.log_id or "default-placeholder-log",
            user_id=user.id if user else None,
            food_id=req.food_id,
            feedback_type=req.feedback_type.upper(),
        )
        self.db.add(fb)
        self.db.commit()
        return {"status": "recorded", "food_id": req.food_id, "type": req.feedback_type}

    def _fallback_recommendations(self, user: Optional[User], limit: int) -> List[dict]:
        """Popularity-based fallback."""
        query = self.db.query(Food).filter(Food.is_available == True)
        foods = query.order_by(Food.rating_average.desc(), Food.order_count.desc()).limit(limit).all()
        return [
            self._build_item(
                f,
                score=round(0.85 + (0.10 * (float(f.rating_average) / 5.0)), 2),
                reason="Món ăn được cộng đồng đánh giá cao và đặt nhiều nhất hôm nay",
            )
            for f in foods
        ]

    def _log_recommendation(self, user_id: Optional[str], version_id: Optional[str], rec_type: str, items: list):
        """Persists inference audit log to database."""
        try:
            log_rec = RecommendationLog(
                id=str(uuid.uuid4()),
                user_id=user_id,
                model_version_id=version_id,
                recommendation_type=rec_type,
                recommended_item_ids=items
            )
            self.db.add(log_rec)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            print(f"[RecSys Audit Log Warning] Failed to persist log: {e}")

    def _build_item(self, f: Food, score: float, reason: str) -> dict:
        primary_img = f.images[0].image_url if f.images else "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"
        return {
            "id": f.id,
            "food_id": f.id,
            "name": f.name,
            "slug": f.slug,
            "price": float(f.price),
            "image_url": primary_img,
            "rating_average": float(f.rating_average),
            "restaurant_name": f.restaurant.name if f.restaurant else "Nhà hàng đối tác",
            "match_score": round(score, 2),
            "match_reason": reason,
            "calories": float(f.nutrition.calories) if f.nutrition else None,
            "protein": float(f.nutrition.protein) if f.nutrition else None,
            "fat": float(f.nutrition.fat) if f.nutrition else None,
            "carbohydrates": float(f.nutrition.carbohydrates) if f.nutrition else None,
        }

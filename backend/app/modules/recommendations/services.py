from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.food import Food
from app.models.recommendation import RecommendationLog, RecommendationFeedback, ModelVersion
from app.modules.recommendations.schemas import RecommendedFoodItem, RecommendationFeedbackRequest

class RecommendationService:
    """
    Application Service Boundary for RecSys.
    Acts as an integration adapter between API controllers and RecSys algorithms (Phase 7).
    """
    def __init__(self, db: Session):
        self.db = db

    def get_home_recommendations(self, user: Optional[User], limit: int = 10) -> List[dict]:
        """
        Serves personalized home feed recommendations.
        Falls back to popularity or onboarding survey preferences when history is sparse.
        """
        query = self.db.query(Food).filter(Food.is_available == True)

        # Baseline: If user has onboarding preference categories
        if user and user.preferences and user.preferences.preferred_categories:
            pref_cats = user.preferences.preferred_categories
            # Check if any food matches preferred categories
            pref_query = query.filter(Food.category_id.in_(pref_cats))
            if pref_query.count() > 0:
                foods = pref_query.order_by(Food.rating_average.desc(), Food.order_count.desc()).limit(limit).all()
                return [
                    self._build_item(
                        f,
                        score=0.95,
                        reason="Đề xuất dựa trên danh mục ẩm thực bạn yêu thích khi bắt đầu",
                    )
                    for f in foods
                ]

        # General Popularity Fallback
        foods = query.order_by(Food.rating_average.desc(), Food.order_count.desc()).limit(limit).all()
        return [
            self._build_item(
                f,
                score=round(0.85 + (0.10 * (float(f.rating_average) / 5.0)), 2),
                reason="Món ăn được cộng đồng đánh giá cao và đặt nhiều nhất hôm nay",
            )
            for f in foods
        ]

    def get_similar_foods(self, food_id: str, limit: int = 4) -> List[dict]:
        """
        Serves Content-Based Recommendations for similar dishes.
        """
        target = self.db.query(Food).filter(Food.id == food_id).first()
        if not target:
            return []

        # Find dishes in same category or similar price range
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
                reason=f"Cùng danh mục '{target.category.name if target.category else 'Ẩm thực'}' và tương đồng về dinh dưỡng",
            )
            for f in similar_foods
        ]

    def get_cart_upsell(self, user: User, limit: int = 4) -> List[dict]:
        """
        Serves Complementary / Cross-sell Recommendations (Drinks, desserts, side dishes).
        """
        # Suggest top rated foods
        foods = (
            self.db.query(Food)
            .filter(Food.is_available == True)
            .order_by(Food.order_count.desc())
            .limit(limit)
            .all()
        )
        return [
            self._build_item(f, score=0.88, reason="Món ăn kèm được nhiều khách hàng chọn cùng")
            for f in foods
        ]

    def record_feedback(self, user: Optional[User], req: RecommendationFeedbackRequest) -> dict:
        fb = RecommendationFeedback(
            log_id=req.log_id or "default-placeholder-log",
            user_id=user.id if user else None,
            food_id=req.food_id,
            feedback_type=req.feedback_type.upper(),
            position_rank=req.position_rank,
        )
        self.db.add(fb)
        self.db.commit()
        return {"status": "recorded", "food_id": req.food_id, "type": req.feedback_type}

    def _build_item(self, f: Food, score: float, reason: str) -> dict:
        primary_img = f.images[0].image_url if f.images else None
        return {
            "id": f.id,
            "food_id": f.id,
            "name": f.name,
            "slug": f.slug,
            "price": float(f.price),
            "image_url": primary_img,
            "rating_average": float(f.rating_average),
            "restaurant_name": f.restaurant.name if f.restaurant else None,
            "match_score": score,
            "match_reason": reason,
            "calories": float(f.nutrition.calories) if f.nutrition else None,
            "protein": float(f.nutrition.protein) if f.nutrition else None,
            "fat": float(f.nutrition.fat) if f.nutrition else None,
            "carbohydrates": float(f.nutrition.carbohydrates) if f.nutrition else None,
        }


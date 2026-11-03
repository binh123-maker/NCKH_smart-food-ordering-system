import numpy as np
import pandas as pd
from typing import Optional, List, Tuple, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity

from app.recsys.models.base import BaseRecommender
from app.recsys.models.content_based import ContentBasedRecommender
from app.recsys.models.collaborative import CollaborativeFilteringRecommender
from app.recsys.config import (
    HYBRID_CBF_WEIGHT,
    HYBRID_CF_WEIGHT,
    COLD_START_INTERACTION_THRESHOLD,
    NUTRITION_PENALTY_FACTOR,
    BUDGET_PENALTY_FACTOR,
)

class HybridRecommender(BaseRecommender):
    """
    Scientific Hybrid Recommendation Model.
    Architecture:
    1. Weighted Hybrid: Fuses Content-Based and Collaborative Filtering scores.
    2. Switching Cold-Start Strategy: Automatically handles new users via onboarding survey vectorization
       and new items via content attributes.
    3. Multi-objective Re-ranking: Optimizes for User Taste + Nutrition Fitness (Calorie/Protein) + Budget.
    """
    def __init__(
        self,
        name: str = "Hybrid RecSys (CBF + CF + Nutrition Re-ranking)",
        cbf_weight: float = HYBRID_CBF_WEIGHT,
        cf_weight: float = HYBRID_CF_WEIGHT,
        cold_threshold: int = COLD_START_INTERACTION_THRESHOLD
    ):
        super().__init__(name=name)
        self.cbf_weight = cbf_weight
        self.cf_weight = cf_weight
        self.cold_threshold = cold_threshold
        self.cbf = ContentBasedRecommender()
        self.cf = CollaborativeFilteringRecommender()
        self.foods_df = None
        self.users_df = None
        self.user_interaction_counts = {}
        self.user_metadata = {}

    def fit(
        self,
        train_df: pd.DataFrame,
        foods_df: pd.DataFrame,
        users_df: Optional[pd.DataFrame] = None,
        **kwargs
    ) -> "HybridRecommender":
        self.foods_df = foods_df.copy().reset_index(drop=True)
        self.users_df = users_df.copy().reset_index(drop=True) if users_df is not None else None

        # Fit sub-models on identical training data
        self.cbf.fit(train_df, self.foods_df)
        self.cf.fit(train_df, self.foods_df)

        # Track user historical interactions count for cold-start detection
        self.user_interaction_counts = train_df.groupby("user_id").size().to_dict()

        # Cache user profile metadata if available (for cold start survey & dietary goals)
        if self.users_df is not None:
            for _, row in self.users_df.iterrows():
                u_id = row["id"]
                self.user_metadata[u_id] = {
                    "preferred_categories": str(row.get("preferred_categories", "")).split(",") if pd.notna(row.get("preferred_categories")) else [],
                    "calorie_target": float(row["calorie_target"]) if pd.notna(row.get("calorie_target")) else None,
                    "protein_target": float(row["protein_target"]) if pd.notna(row.get("protein_target")) else None,
                    "budget_max": float(row["budget_max"]) if pd.notna(row.get("budget_max")) else None,
                    "dietary_preferences": str(row.get("dietary_preferences", "")).split(",") if pd.notna(row.get("dietary_preferences")) else [],
                }

        self.is_fitted = True
        return self

    def predict_score(self, user_id: str, food_id: str) -> float:
        if not self.is_fitted:
            return 0.0

        n_inter = self.user_interaction_counts.get(user_id, 0)
        
        # Cold start user: delegate predominantly to content-based matching
        if n_inter < self.cold_threshold:
            return self.cbf.predict_score(user_id, food_id)

        s_cbf = self.cbf.predict_score(user_id, food_id)
        s_cf = self.cf.predict_score(user_id, food_id)
        
        return float(self.cbf_weight * s_cbf + self.cf_weight * s_cf)

    def recommend(
        self,
        user_id: str,
        k: int = 10,
        exclude_known: bool = True,
        filter_constraints: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[str, float, str]]:
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before generating recommendations.")

        known_items = self.cbf.user_train_history.get(user_id, set()) if exclude_known else set()
        n_inter = self.user_interaction_counts.get(user_id, 0)
        user_meta = self.user_metadata.get(user_id, {})

        # Active constraints priority: Explicit filter_constraints > User persistent preferences
        cal_target = filter_constraints.get("max_calories") if filter_constraints else None
        if cal_target is None:
            cal_target = user_meta.get("calorie_target")

        pro_target = filter_constraints.get("min_protein") if filter_constraints else None
        if pro_target is None:
            pro_target = user_meta.get("protein_target")

        budget_limit = filter_constraints.get("max_price") if filter_constraints else None
        if budget_limit is None:
            budget_limit = user_meta.get("budget_max")

        # ----------------- COLD START PATH (< threshold interactions) -----------------
        if n_inter < self.cold_threshold:
            return self._recommend_cold_start(
                user_id=user_id,
                user_meta=user_meta,
                known_items=known_items,
                cal_target=cal_target,
                pro_target=pro_target,
                budget_limit=budget_limit,
                k=k
            )

        # ----------------- WARM HYBRID PATH -----------------
        # Step 1: Compute CBF scores
        u_vec = self.cbf.user_profiles.get(user_id)
        if u_vec is not None:
            sims_cbf = cosine_similarity(u_vec, self.cbf.pipeline.feature_matrix)[0]
            scores_cbf = (sims_cbf + 1.0) / 2.0
        else:
            scores_cbf = np.full(len(self.foods_df), 0.5)

        # Step 2: Compute CF scores
        if user_id in self.cf.user_to_idx:
            u_idx = self.cf.user_to_idx[user_id]
            raw_cf = self.cf.pred_matrix[u_idx]
            scores_cf = np.clip((raw_cf - 1.0) / 4.0, 0.0, 1.0)
        else:
            scores_cf = np.full(len(self.foods_df), 0.5)

        # Step 3: Combine scores & Apply Nutrition/Budget Constraint Re-ranking
        candidates = []
        for idx in range(len(self.foods_df)):
            f_id = self.cbf.idx_to_food_id[idx]
            if f_id in known_items:
                continue

            food = self.foods_df.iloc[idx]
            
            # Check Vegetarian hard requirement
            user_dietary = user_meta.get("dietary_preferences", [])
            is_veggie_user = any("vegetarian" in tag or "vegan" in tag for tag in user_dietary)
            food_tags = str(food.get("dietary_tags", ""))
            if is_veggie_user and not ("vegetarian" in food_tags or "vegan" in food_tags):
                continue

            # Base weighted score
            s_cbf_val = float(scores_cbf[idx])
            s_cf_val = float(scores_cf[idx])
            base_score = (self.cbf_weight * s_cbf_val) + (self.cf_weight * s_cf_val)

            # Nutrition and Budget Fitness Multipliers
            fitness_multiplier = 1.0
            reasons = []

            # Calorie alignment
            if cal_target is not None:
                cal_diff = abs(food["calories"] - cal_target)
                if cal_diff <= 120:
                    fitness_multiplier *= 1.15
                    reasons.append(f"Calo tối ưu ({int(food['calories'])} kcal)")
                elif food["calories"] > cal_target * 1.35:
                    fitness_multiplier *= (1.0 - NUTRITION_PENALTY_FACTOR)

            # Protein bonus
            if pro_target is not None:
                if food["protein"] >= pro_target:
                    fitness_multiplier *= 1.18
                    reasons.append(f"Đạt mục tiêu đạm ({int(food['protein'])}g protein)")
                elif food["protein"] < pro_target * 0.5:
                    fitness_multiplier *= 0.90

            # Budget alignment
            if budget_limit is not None:
                if food["price"] <= budget_limit:
                    reasons.append(f"Giá hợp lý ({int(food['price']):,}đ)")
                else:
                    fitness_multiplier *= (1.0 - BUDGET_PENALTY_FACTOR)

            final_score = min(0.99, max(0.10, base_score * fitness_multiplier))

            # Build comprehensive explanation
            if not reasons:
                reasons.append("Phù hợp cao với sở thích ẩm thực cá nhân và cộng đồng")
            
            match_reason = f"Đề xuất Hybrid ({int(final_score * 100)}%): " + " • ".join(reasons)
            candidates.append((f_id, round(float(final_score), 4), match_reason))

        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:k]

    def _recommend_cold_start(
        self,
        user_id: str,
        user_meta: dict,
        known_items: set,
        cal_target: Optional[float],
        pro_target: Optional[float],
        budget_limit: Optional[float],
        k: int
    ) -> List[Tuple[str, float, str]]:
        """
        Cold-Start Handling: Uses user onboarding preferences and category popularity.
        """
        preferred_cats = user_meta.get("preferred_categories", [])
        pref_tags = user_meta.get("dietary_preferences", [])

        # Build cold-start query vector from survey
        query_vec = self.cbf.pipeline.transform_query_features(
            category=preferred_cats[0] if preferred_cats else "COM",
            calories=cal_target,
            protein=pro_target,
            price=budget_limit,
            preferred_tags=pref_tags
        )
        sims = cosine_similarity(query_vec, self.cbf.pipeline.feature_matrix)[0]

        candidates = []
        for idx in range(len(self.foods_df)):
            f_id = self.cbf.idx_to_food_id[idx]
            if f_id in known_items:
                continue

            food = self.foods_df.iloc[idx]

            # Check Vegetarian hard requirement for cold-start user
            is_veggie_user = any("vegetarian" in tag or "vegan" in tag for tag in pref_tags)
            food_tags = str(food.get("dietary_tags", ""))
            if is_veggie_user and not ("vegetarian" in food_tags or "vegan" in food_tags):
                continue

            sim = float(sims[idx])
            norm_sim = (sim + 1.0) / 2.0

            # Popularity prior
            pop_score = float(food["rating_average"]) / 5.0
            
            # Combine Survey match with popularity
            score = 0.65 * norm_sim + 0.35 * pop_score

            reasons = ["Khởi đầu hoàn hảo dựa trên khảo sát sở thích của bạn"]
            if food["category_id"] in preferred_cats:
                reasons.append(f"Thuộc nhóm món '{food['category_id']}' bạn quan tâm")
            if pro_target and food["protein"] >= pro_target:
                reasons.append(f"Giàu protein ({int(food['protein'])}g)")

            match_reason = " • ".join(reasons)
            candidates.append((f_id, round(float(min(0.98, score)), 4), match_reason))

        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:k]


import numpy as np
import pandas as pd
from typing import Optional, List, Tuple, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.recsys.models.base import BaseRecommender
from backend.app.recsys.pipelines.preprocessing import FoodFeaturePipeline

class ContentBasedRecommender(BaseRecommender):
    """
    Content-Based Filtering Model.
    Builds multidimensional food feature vectors (ingredients, nutrition macros, price, category, tags)
    and user profile vectors based on interaction history.
    Scores items using Cosine Similarity:
        Score(u, i) = CosineSim(UserProfile_u, FoodVector_i)
    """
    def __init__(self, name: str = "Content-Based Filtering"):
        super().__init__(name=name)
        self.pipeline = FoodFeaturePipeline()
        self.foods_df = None
        self.food_id_to_idx = {}
        self.idx_to_food_id = {}
        self.user_profiles = {}
        self.user_train_history = {}

    def fit(self, train_df: pd.DataFrame, foods_df: pd.DataFrame, **kwargs) -> "ContentBasedRecommender":
        self.foods_df = foods_df.copy().reset_index(drop=True)
        self.pipeline.fit_transform(self.foods_df)
        
        self.food_id_to_idx = {fid: idx for idx, fid in enumerate(self.foods_df["id"])}
        self.idx_to_food_id = {idx: fid for idx, fid in enumerate(self.foods_df["id"])}

        # Build User Historical Interactions Map
        self.user_train_history = {}
        for u_id, group in train_df.groupby("user_id"):
            self.user_train_history[u_id] = set(group["food_id"].tolist())

        # Construct User Profile Vectors
        self.user_profiles = {}
        score_col = "composite_score" if "composite_score" in train_df.columns else "rating"
        
        for u_id, group in train_df.groupby("user_id"):
            food_indices = []
            weights = []
            for _, row in group.iterrows():
                f_id = row["food_id"]
                if f_id in self.food_id_to_idx:
                    idx = self.food_id_to_idx[f_id]
                    score = float(row[score_col])
                    food_indices.append(idx)
                    weights.append(max(0.1, score))

            if food_indices:
                weights = np.array(weights).reshape(-1, 1)
                item_vectors = self.pipeline.feature_matrix[food_indices]
                # Weighted centroid of historical items
                user_vec = np.sum(item_vectors * weights, axis=0) / np.sum(weights)
                self.user_profiles[u_id] = user_vec.reshape(1, -1)

        self.is_fitted = True
        return self

    def predict_score(self, user_id: str, food_id: str) -> float:
        if not self.is_fitted or food_id not in self.food_id_to_idx:
            return 0.0
            
        food_idx = self.food_id_to_idx[food_id]
        food_vec = self.pipeline.feature_matrix[food_idx].reshape(1, -1)

        if user_id in self.user_profiles:
            u_vec = self.user_profiles[user_id]
            sim = cosine_similarity(u_vec, food_vec)[0, 0]
            # Rescale cosine [-1, 1] -> [0, 1]
            return float(max(0.0, (sim + 1.0) / 2.0))
        return 0.5  # Neutral default for unseen user

    def recommend(
        self,
        user_id: str,
        k: int = 10,
        exclude_known: bool = True,
        filter_constraints: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[str, float, str]]:
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before generating recommendations.")

        known_items = self.user_train_history.get(user_id, set()) if exclude_known else set()

        if user_id in self.user_profiles:
            u_vec = self.user_profiles[user_id]
            sims = cosine_similarity(u_vec, self.pipeline.feature_matrix)[0]
        else:
            # Fallback for completely cold user without interactions
            sims = np.zeros(len(self.foods_df))

        # Rank all candidate items
        scores = []
        for idx, sim in enumerate(sims):
            f_id = self.idx_to_food_id[idx]
            if f_id in known_items:
                continue

            row = self.foods_df.iloc[idx]
            # Constraint filtering (if provided)
            if filter_constraints:
                if "max_price" in filter_constraints and row["price"] > filter_constraints["max_price"]:
                    continue
                if "max_calories" in filter_constraints and row["calories"] > filter_constraints["max_calories"]:
                    continue
                if "min_protein" in filter_constraints and row["protein"] < filter_constraints["min_protein"]:
                    continue

            norm_score = max(0.0, min(1.0, (sim + 1.0) / 2.0))
            reason = f"Phù hợp {int(norm_score * 100)}% với đặc trưng khẩu vị & dinh dưỡng bạn thường chọn"
            scores.append((f_id, float(norm_score), reason))

        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:k]

    def get_similar_items(self, food_id: str, k: int = 4) -> List[Tuple[str, float, str]]:
        """Item-Item Content-Based similarity."""
        if food_id not in self.food_id_to_idx:
            return []
        target_idx = self.food_id_to_idx[food_id]
        sims = self.pipeline.cosine_sim_matrix[target_idx]
        
        results = []
        for idx, sim in enumerate(sims):
            if idx == target_idx:
                continue
            f_id = self.idx_to_food_id[idx]
            norm_sim = max(0.0, min(1.0, (sim + 1.0) / 2.0))
            results.append((f_id, float(norm_sim), f"Tương đồng dinh dưỡng & nguyên liệu ({int(norm_sim * 100)}%)"))
            
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:k]


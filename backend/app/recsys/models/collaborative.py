import numpy as np
import pandas as pd
from typing import Optional, List, Tuple, Dict, Any
from sklearn.decomposition import TruncatedSVD

from app.recsys.models.base import BaseRecommender
from app.recsys.pipelines.preprocessing import InteractionMatrixBuilder
from app.recsys.config import CF_SVD_COMPONENTS, CF_SVD_RANDOM_STATE

class CollaborativeFilteringRecommender(BaseRecommender):
    """
    Collaborative Filtering using Matrix Factorization (TruncatedSVD).
    Learns latent factor representations for users (U) and items (V^T) from historical interactions:
        R_approx = U * Sigma * V^T
    Captures latent community preferences and collaborative consumption patterns.
    """
    def __init__(
        self,
        name: str = "Collaborative Filtering (SVD)",
        n_components: int = CF_SVD_COMPONENTS,
        random_state: int = CF_SVD_RANDOM_STATE
    ):
        super().__init__(name=name)
        self.n_components = n_components
        self.random_state = random_state
        self.matrix_builder = InteractionMatrixBuilder()
        self.svd = None
        self.pred_matrix = None
        self.user_to_idx = {}
        self.idx_to_user = {}
        self.item_to_idx = {}
        self.idx_to_item = {}
        self.foods_df = None
        self.user_train_history = {}
        self.global_mean = 3.0

    def fit(self, train_df: pd.DataFrame, foods_df: pd.DataFrame, **kwargs) -> "CollaborativeFilteringRecommender":
        self.foods_df = foods_df.copy().reset_index(drop=True)
        all_food_ids = self.foods_df["id"].tolist()
        all_user_ids = sorted(train_df["user_id"].unique())

        score_col = "composite_score" if "composite_score" in train_df.columns else "rating"
        R, self.user_to_idx, self.item_to_idx = self.matrix_builder.build_matrix(
            interactions_df=train_df,
            user_list=all_user_ids,
            item_list=all_food_ids,
            value_col=score_col
        )
        self.idx_to_user = {i: u for u, i in self.user_to_idx.items()}
        self.idx_to_item = {i: m for m, i in self.item_to_idx.items()}

        # Build history
        self.user_train_history = {}
        for u_id, group in train_df.groupby("user_id"):
            self.user_train_history[u_id] = set(group["food_id"].tolist())

        # Global non-zero mean
        non_zeros = R[R > 0]
        self.global_mean = float(np.mean(non_zeros)) if len(non_zeros) > 0 else 3.0

        # Matrix Factorization via TruncatedSVD
        # Adjust n_components if matrix dimension is small
        n_factors = min(self.n_components, R.shape[0] - 1, R.shape[1] - 1)
        if n_factors < 2:
            n_factors = 2
            
        self.svd = TruncatedSVD(n_components=n_factors, random_state=self.random_state)
        user_latent = self.svd.fit_transform(R)
        self.pred_matrix = np.dot(user_latent, self.svd.components_)

        self.is_fitted = True
        return self

    def predict_score(self, user_id: str, food_id: str) -> float:
        if not self.is_fitted:
            return 0.0
            
        if user_id in self.user_to_idx and food_id in self.item_to_idx:
            u_idx = self.user_to_idx[user_id]
            m_idx = self.item_to_idx[food_id]
            raw_score = self.pred_matrix[u_idx, m_idx]
            # Normalize from rating scale [1.0, 5.0] to [0.0, 1.0]
            norm_score = max(0.0, min(1.0, (raw_score - 1.0) / 4.0))
            return float(norm_score)
            
        return 0.5  # Neutral default for cold-start user/item

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

        if user_id in self.user_to_idx:
            u_idx = self.user_to_idx[user_id]
            pred_scores = self.pred_matrix[u_idx]
        else:
            # Cold-start fallback: Item popular average ratings
            pred_scores = np.mean(self.pred_matrix, axis=0)

        candidates = []
        for m_idx, raw_score in enumerate(pred_scores):
            f_id = self.idx_to_item[m_idx]
            if f_id in known_items:
                continue

            food_row = self.foods_df[self.foods_df["id"] == f_id]
            if not food_row.empty:
                row = food_row.iloc[0]
                if filter_constraints:
                    if "max_price" in filter_constraints and row["price"] > filter_constraints["max_price"]:
                        continue
                    if "max_calories" in filter_constraints and row["calories"] > filter_constraints["max_calories"]:
                        continue
                    if "min_protein" in filter_constraints and row["protein"] < filter_constraints["min_protein"]:
                        continue

            norm_score = max(0.0, min(1.0, (raw_score - 1.0) / 4.0))
            reason = f"Được những người dùng có cùng sở thích ẩm thực với bạn yêu thích ({int(norm_score * 100)}%)"
            candidates.append((f_id, float(norm_score), reason))

        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:k]


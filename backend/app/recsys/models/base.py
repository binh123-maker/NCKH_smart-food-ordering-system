from abc import ABC, abstractmethod
from typing import Optional, List, Tuple, Dict, Any
import pandas as pd

class BaseRecommender(ABC):
    """
    Abstract Recommender System interface for all models in the comparative research.
    Ensures identical APIs for evaluation and backend serving.
    """
    def __init__(self, name: str):
        self.name = name
        self.is_fitted = False

    @abstractmethod
    def fit(self, train_df: pd.DataFrame, foods_df: pd.DataFrame, **kwargs) -> "BaseRecommender":
        """Fit model weights and latent matrices on training split."""
        pass

    @abstractmethod
    def predict_score(self, user_id: str, food_id: str) -> float:
        """Predict preference / interaction score for (user, item) pair."""
        pass

    @abstractmethod
    def recommend(
        self,
        user_id: str,
        k: int = 10,
        exclude_known: bool = True,
        filter_constraints: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[str, float, str]]:
        """
        Generate Top-K recommendations.
        Returns list of tuples: (food_id, match_score, match_reason)
        """
        pass


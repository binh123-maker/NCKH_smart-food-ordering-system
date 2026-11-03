import json
import numpy as np
import pandas as pd
from typing import Dict, List, Any
from pathlib import Path

from app.recsys.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    f1_score_at_k,
    ndcg_at_k,
    average_precision_at_k,
    catalog_coverage
)
from app.recsys.models.base import BaseRecommender
from app.recsys.config import EVAL_K_LIST, RELEVANCE_THRESHOLD, EVALUATION_DIR

class PopularityBaselineRecommender(BaseRecommender):
    """
    Standard Popularity Baseline in Recommender Systems literature.
    Recommends globally highest-rated and most ordered dishes to every user.
    """
    def __init__(self):
        super().__init__(name="Popularity Baseline")
        self.popular_items = []
        self.user_history = {}

    def fit(self, train_df: pd.DataFrame, foods_df: pd.DataFrame, **kwargs) -> "PopularityBaselineRecommender":
        # Group by item and compute popularity score
        item_stats = train_df.groupby("food_id").agg({
            "composite_score": "mean",
            "rating": "count"
        }).reset_index()
        item_stats.rename(columns={"rating": "interaction_count"}, inplace=True)

        merged = pd.merge(foods_df, item_stats, left_on="id", right_on="food_id", how="left").fillna(0)
        # Score = Average Rating * log(1 + Interaction Count)
        merged["pop_score"] = merged["rating_average"] * np.log1p(merged["interaction_count"])
        merged.sort_values(by="pop_score", ascending=False, inplace=True)
        self.popular_items = merged["id"].tolist()

        for u_id, group in train_df.groupby("user_id"):
            self.user_history[u_id] = set(group["food_id"].tolist())

        self.is_fitted = True
        return self

    def predict_score(self, user_id: str, food_id: str) -> float:
        return 0.5

    def recommend(self, user_id: str, k: int = 10, exclude_known: bool = True, **kwargs):
        known = self.user_history.get(user_id, set()) if exclude_known else set()
        results = []
        for fid in self.popular_items:
            if fid not in known:
                results.append((fid, 0.75, "Món ăn phổ biến được nhiều người chọn nhất"))
            if len(results) >= k:
                break
        return results


class RecSysBenchmark:
    """
    Evaluation Benchmark Harness.
    Executes rigorous comparative evaluation of multiple recommender models on the exact same test split.
    """
    def __init__(
        self,
        test_df: pd.DataFrame,
        total_catalog_size: int,
        k_values: List[int] = EVAL_K_LIST,
        relevance_threshold: float = RELEVANCE_THRESHOLD
    ):
        self.test_df = test_df
        self.total_catalog_size = total_catalog_size
        self.k_values = k_values
        self.relevance_threshold = relevance_threshold
        
        # Ground truth relevant items per user in test set
        self.user_ground_truth: Dict[str, set] = {}
        score_col = "composite_score" if "composite_score" in test_df.columns else "rating"
        
        for u_id, group in test_df.groupby("user_id"):
            relevant = set(group[group[score_col] >= self.relevance_threshold]["food_id"].tolist())
            if relevant:
                self.user_ground_truth[u_id] = relevant

    def evaluate_model(self, model: BaseRecommender) -> Dict[str, float]:
        """
        Evaluates a single model across all test users and computes averaged metrics.
        """
        user_recommendations_all = []
        metrics_accum = {
            f"Precision@{k}": [] for k in self.k_values
        }
        for k in self.k_values:
            metrics_accum[f"Recall@{k}"] = []
            metrics_accum[f"F1@{k}"] = []
            metrics_accum[f"NDCG@{k}"] = []
            metrics_accum[f"MAP@{k}"] = []

        max_k = max(self.k_values)

        for u_id, relevant_items in self.user_ground_truth.items():
            # Generate recommendations
            recs = model.recommend(user_id=u_id, k=max_k, exclude_known=True)
            rec_ids = [item[0] for item in recs]
            user_recommendations_all.append(rec_ids)

            for k in self.k_values:
                p = precision_at_k(rec_ids, relevant_items, k=k)
                r = recall_at_k(rec_ids, relevant_items, k=k)
                f1 = f1_score_at_k(p, r)
                ndcg = ndcg_at_k(rec_ids, relevant_items, k=k)
                map_val = average_precision_at_k(rec_ids, relevant_items, k=k)

                metrics_accum[f"Precision@{k}"].append(p)
                metrics_accum[f"Recall@{k}"].append(r)
                metrics_accum[f"F1@{k}"].append(f1)
                metrics_accum[f"NDCG@{k}"].append(ndcg)
                metrics_accum[f"MAP@{k}"].append(map_val)

        # Average over test users
        results = {
            "Model": model.name,
            "Evaluated_Users": len(self.user_ground_truth)
        }
        for metric_name, values in metrics_accum.items():
            results[metric_name] = round(float(np.mean(values)), 4)

        # Coverage at K=10
        results["Coverage@10"] = round(
            float(catalog_coverage(user_recommendations_all, self.total_catalog_size, k=10)),
            4
        )
        return results

    def compare_models(self, models: List[BaseRecommender]) -> pd.DataFrame:
        """
        Runs full benchmark on list of models and returns consolidated comparative DataFrame.
        """
        records = []
        for model in models:
            res = self.evaluate_model(model)
            records.append(res)
            
        df_results = pd.DataFrame(records)
        return df_results


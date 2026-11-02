import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from backend.app.recsys.pipelines.preprocessing import FoodFeaturePipeline
from backend.app.recsys.models.content_based import ContentBasedRecommender
from backend.app.recsys.models.collaborative import CollaborativeFilteringRecommender
from backend.app.recsys.models.hybrid import HybridRecommender
from backend.app.recsys.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    ndcg_at_k,
    average_precision_at_k,
    catalog_coverage
)
from backend.app.recsys.config import RAW_DATA_DIR, PROCESSED_DATA_DIR

@pytest.fixture(scope="module")
def sample_data():
    foods_df = pd.read_csv(RAW_DATA_DIR / "foods.csv")
    train_df = pd.read_csv(PROCESSED_DATA_DIR / "train_interactions.csv")
    test_df = pd.read_csv(PROCESSED_DATA_DIR / "test_interactions.csv")
    return foods_df, train_df, test_df

def test_feature_pipeline(sample_data):
    foods_df, _, _ = sample_data
    pipeline = FoodFeaturePipeline()
    feat_matrix = pipeline.fit_transform(foods_df)
    
    assert feat_matrix.shape[0] == len(foods_df)
    assert feat_matrix.shape[1] > 20
    assert pipeline.cosine_sim_matrix.shape == (len(foods_df), len(foods_df))
    # Self similarity must be 1.0
    for i in range(min(5, len(foods_df))):
        assert abs(pipeline.cosine_sim_matrix[i, i] - 1.0) < 1e-4

def test_content_based_recommender(sample_data):
    foods_df, train_df, _ = sample_data
    model = ContentBasedRecommender()
    model.fit(train_df, foods_df)
    
    assert model.is_fitted
    recs = model.recommend(user_id="user_001", k=5, exclude_known=True)
    assert len(recs) == 5
    for fid, score, reason in recs:
        assert isinstance(fid, str)
        assert 0.0 <= score <= 1.0
        assert len(reason) > 0

    similar = model.get_similar_items(foods_df.iloc[0]["id"], k=3)
    assert len(similar) == 3

def test_collaborative_svd_recommender(sample_data):
    foods_df, train_df, _ = sample_data
    model = CollaborativeFilteringRecommender(n_components=10)
    model.fit(train_df, foods_df)
    
    assert model.is_fitted
    recs = model.recommend(user_id="user_001", k=5, exclude_known=True)
    assert len(recs) == 5
    for fid, score, reason in recs:
        assert isinstance(fid, str)
        assert 0.0 <= score <= 1.0

def test_hybrid_recommender_and_constraints(sample_data):
    foods_df, train_df, _ = sample_data
    model = HybridRecommender(cbf_weight=0.55, cf_weight=0.45)
    model.fit(train_df, foods_df)
    
    assert model.is_fitted
    # Test with nutrition constraint
    recs = model.recommend(
        user_id="user_001",
        k=5,
        filter_constraints={"max_calories": 500, "min_protein": 25}
    )
    assert len(recs) > 0
    for fid, score, reason in recs:
        assert "Hybrid" in reason

def test_hybrid_cold_start_vegetarian(sample_data):
    foods_df, train_df, _ = sample_data
    model = HybridRecommender(cold_threshold=3)
    model.fit(train_df, foods_df)
    
    # Cold user with 0 interactions and vegetarian tag
    model.user_metadata["brand_new_vegan"] = {
        "preferred_categories": ["HEALTHY_SALAD", "COM"],
        "calorie_target": 400,
        "protein_target": 20,
        "dietary_preferences": ["vegetarian", "vegan"],
    }
    recs = model.recommend(user_id="brand_new_vegan", k=5)
    assert len(recs) > 0
    for fid, score, reason in recs:
        row = foods_df[foods_df["id"] == fid].iloc[0]
        tags = str(row["dietary_tags"])
        assert "vegetarian" in tags or "vegan" in tags

def test_evaluation_metrics_math():
    recommended = ["food_1", "food_2", "food_3", "food_4", "food_5"]
    relevant = {"food_2", "food_4", "food_9"}
    
    p5 = precision_at_k(recommended, relevant, k=5)
    assert p5 == 2.0 / 5.0 # 0.4
    
    r5 = recall_at_k(recommended, relevant, k=5)
    assert r5 == 2.0 / 3.0 # 0.6667
    
    ndcg5 = ndcg_at_k(recommended, relevant, k=5)
    assert 0.0 < ndcg5 <= 1.0
    
    ap5 = average_precision_at_k(recommended, relevant, k=5)
    assert 0.0 < ap5 <= 1.0
    
    cov = catalog_coverage([recommended], total_items=10, k=5)
    assert cov == 0.5

def test_recommendation_api_endpoints():
    client = TestClient(app)
    
    # Home feed
    res = client.get("/api/v1/recommendations/home-feed?limit=6")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "items" in data
    assert len(data["items"]) > 0
    first_item = data["items"][0]
    assert "match_score" in first_item
    assert "match_reason" in first_item
    assert "calories" in first_item
    assert "protein" in first_item

    # Food detail similar foods
    food_id = first_item["id"]
    sim_res = client.get(f"/api/v1/recommendations/similar/{food_id}?limit=3")
    assert sim_res.status_code == 200
    sim_data = sim_res.json()["data"]
    assert "items" in sim_data


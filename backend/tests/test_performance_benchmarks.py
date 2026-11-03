import time
import pytest
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_health_check_latency(client):
    # Warmup
    client.get("/health")
    latencies = []
    for _ in range(20):
        t0 = time.perf_counter()
        res = client.get("/health")
        latencies.append((time.perf_counter() - t0) * 1000.0) # ms
        assert res.status_code == 200

    mean_lat = np.mean(latencies)
    p95_lat = np.percentile(latencies, 95)
    print(f"\n[Performance] /health Latency: Mean={mean_lat:.2f}ms, P95={p95_lat:.2f}ms")
    assert mean_lat < 40.0, f"Health check is too slow: {mean_lat:.2f}ms"

def test_food_listing_and_filtering_latency(client):
    # Warmup
    client.get("/api/v1/foods?min_price=20000&max_price=80000&sort_by=price_asc&limit=15")
    latencies = []
    # Test complex multi-criteria filter
    for _ in range(25):
        t0 = time.perf_counter()
        res = client.get("/api/v1/foods?min_price=20000&max_price=80000&sort_by=price_asc&limit=15")
        latencies.append((time.perf_counter() - t0) * 1000.0)
        assert res.status_code == 200

    mean_lat = np.mean(latencies)
    p95_lat = np.percentile(latencies, 95)
    print(f"[Performance] /foods Filtering Latency: Mean={mean_lat:.2f}ms, P95={p95_lat:.2f}ms")
    assert p95_lat < 150.0, f"Food filtering P95 exceeded 150ms: {p95_lat:.2f}ms"

def test_recommendation_home_feed_latency(client):
    # Warm-up request to load serialized model into memory
    client.get("/api/v1/recommendations/home-feed?limit=2")

    latencies = []
    # Test 30 consecutive calls simulating high concurrent user traffic
    for _ in range(30):
        t0 = time.perf_counter()
        res = client.get("/api/v1/recommendations/home-feed?limit=10")
        latencies.append((time.perf_counter() - t0) * 1000.0)
        assert res.status_code == 200

    mean_lat = np.mean(latencies)
    p95_lat = np.percentile(latencies, 95)
    p99_lat = np.percentile(latencies, 99)
    print(f"[Performance] /recommendations/home-feed Steady-state Latency: Mean={mean_lat:.2f}ms, P95={p95_lat:.2f}ms, P99={p99_lat:.2f}ms")
    assert mean_lat < 80.0, f"Recommendation latency mean exceeded 80ms: {mean_lat:.2f}ms"

def test_similar_food_content_based_latency(client):
    # Fetch a sample food
    food_res = client.get("/api/v1/foods?limit=1")
    foods = food_res.json()["data"]
    assert len(foods) > 0
    food_id = foods[0]["id"]

    latencies = []
    for _ in range(20):
        t0 = time.perf_counter()
        res = client.get(f"/api/v1/recommendations/similar/{food_id}?limit=4")
        latencies.append((time.perf_counter() - t0) * 1000.0)
        assert res.status_code == 200

    mean_lat = np.mean(latencies)
    p95_lat = np.percentile(latencies, 95)
    print(f"[Performance] /recommendations/similar Latency: Mean={mean_lat:.2f}ms, P95={p95_lat:.2f}ms")
    assert mean_lat < 40.0, f"Similar food latency exceeded 40ms: {mean_lat:.2f}ms"

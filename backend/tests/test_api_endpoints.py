import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.category import Category
from app.models.food import Food, FoodNutrition

# Setup isolated in-memory SQLite DB for API tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_auth_and_user_flow(client):
    # 1. Register customer
    register_payload = {
        "email": "customer1@example.com",
        "password": "Password123@",
        "full_name": "Trần Thị B",
        "phone": "0912345678",
    }
    res = client.post("/api/v1/auth/register", json=register_payload)
    assert res.status_code == 201
    data = res.json()["data"]
    token = data["access_token"]
    assert data["email"] == "customer1@example.com"
    assert token is not None

    # 2. Get profile with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    res_me = client.get("/api/v1/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["data"]["full_name"] == "Trần Thị B"

    # 3. Add address
    addr_payload = {
        "recipient_name": "Trần Thị B",
        "recipient_phone": "0912345678",
        "address_line": "456 Lê Duẩn",
        "district": "Quận 1",
        "city": "TP. Hồ Chí Minh",
        "is_default": True,
    }
    res_addr = client.post("/api/v1/users/addresses", json=addr_payload, headers=headers)
    assert res_addr.status_code == 201
    assert res_addr.json()["data"]["address_line"] == "456 Lê Duẩn"

    # 4. Update preferences (Onboarding Survey)
    pref_payload = {
        "preferred_categories": ["healthy", "rice"],
        "budget_per_meal": 60000,
        "daily_calorie_target": 1800,
        "is_onboarded": True,
    }
    res_pref = client.put("/api/v1/users/preferences", json=pref_payload, headers=headers)
    assert res_pref.status_code == 200
    assert res_pref.json()["data"]["is_onboarded"] is True

def test_food_cart_and_order_flow(client):
    # Register Admin to create restaurant & food
    admin_reg = {
        "email": "admin@example.com",
        "password": "AdminPassword123@",
        "full_name": "Admin Root",
        "role": "ADMIN",
    }
    res_admin = client.post("/api/v1/auth/register", json=admin_reg)
    admin_token = res_admin.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Create Restaurant
    rest_payload = {
        "name": "Bếp Xanh Healthy",
        "address": "12 Điện Biên Phủ, Bình Thạnh",
        "phone": "0933221100",
    }
    res_rest = client.post("/api/v1/restaurants", json=rest_payload, headers=admin_headers)
    assert res_rest.status_code == 201
    rest_id = res_rest.json()["data"]["id"]

    # Create Category
    cat_payload = {"name": "Eat Clean", "sort_order": 1}
    res_cat = client.post("/api/v1/categories", json=cat_payload, headers=admin_headers)
    cat_id = res_cat.json()["data"]["id"]

    # Create Food with Nutrition Macro
    food_payload = {
        "restaurant_id": rest_id,
        "category_id": cat_id,
        "name": "Salad ức gà sốt cam",
        "price": 65000,
        "is_available": True,
        "ingredients": ["Ức gà", "Xà lách", "Sốt cam"],
        "nutrition": {
            "calories": 420.0,
            "protein": 36.0,
            "fat": 8.0,
            "carbohydrates": 45.0,
        },
    }
    res_food = client.post("/api/v1/foods", json=food_payload, headers=admin_headers)
    assert res_food.status_code == 201
    food_id = res_food.json()["data"]["id"]

    # Register Customer
    cust_reg = {
        "email": "buyer@example.com",
        "password": "BuyerPassword123@",
        "full_name": "Lê Văn C",
    }
    res_cust = client.post("/api/v1/auth/register", json=cust_reg)
    cust_token = res_cust.json()["data"]["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Add address for customer
    addr_res = client.post(
        "/api/v1/users/addresses",
        json={"recipient_name": "Lê C", "recipient_phone": "0988776655", "address_line": "100 Pasteur", "city": "TP.HCM"},
        headers=cust_headers,
    )
    address_id = addr_res.json()["data"]["id"]

    # Add Food to Cart
    res_cart = client.post(
        "/api/v1/cart/items",
        json={"food_id": food_id, "quantity": 2, "notes": "Ít sốt"},
        headers=cust_headers,
    )
    assert res_cart.status_code == 201
    cart_data = res_cart.json()["data"]
    assert cart_data["total_items"] == 2
    assert cart_data["subtotal"] == 130000.0

    # Checkout / Create Order
    order_payload = {
        "address_id": address_id,
        "payment_method": "COD",
        "delivery_notes": "Giao giờ hành chính",
    }
    res_order = client.post("/api/v1/orders", json=order_payload, headers=cust_headers)
    assert res_order.status_code == 201
    order_data = res_order.json()["data"]
    order_id = order_data["id"]
    assert order_data["status"] == "PENDING"
    assert order_data["subtotal"] == 130000.0
    assert order_data["total_amount"] == 145000.0  # 130k + 15k fee

    # Verify Cart is now empty
    empty_cart = client.get("/api/v1/cart", headers=cust_headers).json()["data"]
    assert empty_cart["total_items"] == 0

    # Admin updates order status to CONFIRMED -> PREPARING -> DELIVERING -> COMPLETED
    client.put(f"/api/v1/orders/{order_id}/status", json={"status": "CONFIRMED"}, headers=admin_headers)
    client.put(f"/api/v1/orders/{order_id}/status", json={"status": "PREPARING"}, headers=admin_headers)
    client.put(f"/api/v1/orders/{order_id}/status", json={"status": "DELIVERING"}, headers=admin_headers)
    completed_res = client.put(f"/api/v1/orders/{order_id}/status", json={"status": "COMPLETED"}, headers=admin_headers)
    assert completed_res.json()["data"]["status"] == "COMPLETED"
    assert completed_res.json()["data"]["payment_status"] == "PAID"

    # Customer reviews food
    review_res = client.post(
        "/api/v1/reviews",
        json={"food_id": food_id, "order_id": order_id, "rating": 5, "comment": "Món ăn rất tươi ngon, đúng chuẩn healthy!"},
        headers=cust_headers,
    )
    assert review_res.status_code == 201
    assert review_res.json()["data"]["rating"] == 5

    # Toggle favorite
    fav_res = client.post(f"/api/v1/favorites/toggle/{food_id}", headers=cust_headers)
    assert fav_res.json()["data"]["is_favorite"] is True

    # Test Recommendations
    rec_res = client.get("/api/v1/recommendations/home-feed", headers=cust_headers)
    assert rec_res.status_code == 200
    assert len(rec_res.json()["data"]["items"]) >= 1

    rec_sim = client.get(f"/api/v1/recommendations/similar/{food_id}")
    assert rec_sim.status_code == 200

    # Admin Dashboard KPIs
    dashboard_res = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert dashboard_res.status_code == 200
    assert dashboard_res.json()["data"]["total_orders"] == 1
    assert dashboard_res.json()["data"]["total_revenue"] == 145000.0


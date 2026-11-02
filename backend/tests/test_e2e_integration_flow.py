import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base
from app.scripts.seed_data import seed_database

@pytest.fixture(autouse=True)
def clean_and_seed_test_db():
    app.dependency_overrides.clear()
    seed_database()
    yield
    app.dependency_overrides.clear()

client = TestClient(app)

def test_complete_e2e_integration_flow():
    """
    End-to-End Testing cho toàn bộ luồng tích hợp:
    1. Đăng ký (Register)
    2. Đăng nhập (Login)
    3. Xác thực Auth/Me
    4. Cài đặt sở thích dinh dưỡng (User Preferences)
    5. Thêm địa chỉ giao hàng (User Addresses)
    6. Tìm kiếm món ăn (Search Foods)
    7. Xem chi tiết món ăn (Food Detail)
    8. Thêm vào giỏ hàng (Cart Management)
    9. Đặt hàng (Create Order / Checkout)
    10. Xem lịch sử đơn hàng (Order History)
    11. Xem chi tiết đơn hàng (Order Details)
    12. Đăng nhập Admin và chuyển đổi trạng thái đơn hàng (PENDING -> CONFIRMED -> PREPARING -> DELIVERING -> COMPLETED)
    13. Gửi đánh giá món ăn sau khi nhận hàng thành công (Create Review)
    14. Kiểm tra phân quyền: Khách hàng truy cập Admin endpoint (403 Forbidden)
    15. Kiểm tra truy cập không hợp lệ: Token sai/hết hạn (401 Unauthorized)
    16. Admin xem KPI Dashboard và RecSys metrics (200 OK)
    """
    # 1. ĐĂNG KÝ (REGISTER) với email duy nhất
    unique_email = f"test_e2e_{int(time.time())}@example.com"
    register_payload = {
        "email": unique_email,
        "password": "Password@123456",
        "phone": f"09{int(time.time()) % 100000000:08d}",
        "full_name": "Kiểm Thử Viên E2E"
    }
    reg_res = client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 201, f"Register failed: {reg_res.text}"

    # 2. ĐĂNG NHẬP (LOGIN)
    login_payload = {
        "email": unique_email,
        "password": "Password@123456"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    login_data = login_res.json()["data"]
    access_token = login_data["access_token"]
    assert access_token is not None
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    # 3. LẤY THÔNG TIN TÀI KHOẢN (AUTH/ME)
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == unique_email

    # 4. CẬP NHẬT SỞ THÍCH DINH DƯỠNG (USER PREFERENCES)
    pref_payload = {
        "preferred_categories": ["cat-1", "cat-3"],
        "budget_per_meal": 70000,
        "daily_calorie_target": 1900,
        "preferred_protein_min": 35,
        "dietary_restrictions": ["Eat Clean", "Tăng cơ"],
        "is_onboarded": True
    }
    pref_res = client.put("/api/v1/users/preferences", json=pref_payload, headers=auth_headers)
    assert pref_res.status_code == 200

    # 5. THÊM ĐỊA CHỈ GIAO HÀNG (USER ADDRESS)
    addr_payload = {
        "recipient_name": "Kiểm Thử Viên E2E",
        "recipient_phone": "0987654321",
        "address_line": "Số 1 Đại Cồ Việt, Bách Khoa",
        "district": "Hai Bà Trưng",
        "city": "Hà Nội",
        "is_default": True
    }
    addr_res = client.post("/api/v1/users/addresses", json=addr_payload, headers=auth_headers)
    assert addr_res.status_code in [200, 201]
    created_address_id = addr_res.json()["data"]["id"]

    # 6. TÌM KIẾM MÓN ĂN (SEARCH FOODS)
    search_res = client.get("/api/v1/foods?search=Cơm")
    assert search_res.status_code == 200
    foods = search_res.json()["data"]
    if not foods:
        foods = client.get("/api/v1/foods").json()["data"]
    assert len(foods) > 0, "No food found in database"
    selected_food = foods[0]
    food_id = selected_food["id"]

    # 7. XEM CHI TIẾT MÓN ĂN (GET FOOD DETAIL)
    detail_res = client.get(f"/api/v1/foods/{food_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["id"] == food_id

    # 8. THÊM VÀO GIỎ HÀNG (ADD TO CART)
    cart_add_payload = {
        "food_id": food_id,
        "quantity": 2,
        "notes": "Ít cay, không hành"
    }
    cart_res = client.post("/api/v1/cart/items", json=cart_add_payload, headers=auth_headers)
    assert cart_res.status_code == 201
    cart_data = cart_res.json()["data"]
    assert len(cart_data["items"]) >= 1

    # 9. ĐẶT HÀNG (CREATE ORDER / CHECKOUT)
    order_payload = {
        "address_id": created_address_id,
        "payment_method": "COD",
        "delivery_notes": "Gọi trước khi giao 10 phút"
    }
    order_res = client.post("/api/v1/orders", json=order_payload, headers=auth_headers)
    assert order_res.status_code == 201, f"Create order failed: {order_res.text}"
    created_order = order_res.json()["data"]
    order_id = created_order["id"]
    order_code = created_order["order_code"]
    assert order_id is not None
    assert order_code is not None

    # 10. XEM LỊCH SỬ ĐƠN HÀNG (ORDER HISTORY)
    history_res = client.get("/api/v1/orders", headers=auth_headers)
    assert history_res.status_code == 200
    history_items = history_res.json()["data"]
    assert any(o["id"] == order_id for o in history_items)

    # 11. XEM CHI TIẾT ĐƠN HÀNG (GET ORDER DETAILS)
    order_detail_res = client.get(f"/api/v1/orders/{order_id}", headers=auth_headers)
    assert order_detail_res.status_code == 200
    assert order_detail_res.json()["data"]["order_code"] == order_code

    # 12. ADMIN ĐĂNG NHẬP VÀ XỬ LÝ TRẠNG THÁI ĐƠN HÀNG ĐẾN KHI HOÀN THÀNH (COMPLETED)
    admin_login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@foodrecsys.com",
        "password": "Admin@123456"
    })
    assert admin_login_res.status_code == 200
    admin_token = admin_login_res.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Workflow: PENDING -> CONFIRMED -> PREPARING -> DELIVERING -> COMPLETED
    for next_status in ["CONFIRMED", "PREPARING", "DELIVERING", "COMPLETED"]:
        step_res = client.put(
            f"/api/v1/orders/{order_id}/status",
            json={"status": next_status},
            headers=admin_headers
        )
        assert step_res.status_code == 200
        assert step_res.json()["data"]["status"] == next_status

    # 13. GỬI ĐÁNH GIÁ MÓN ĂN (CREATE REVIEW CHO ĐƠN ĐÃ COMPLETED)
    review_payload = {
        "order_id": order_id,
        "food_id": food_id,
        "rating": 5,
        "comment": "Món ăn giao nhanh, ức gà mềm và nước sốt mè rất ngon!"
    }
    review_res = client.post("/api/v1/reviews", json=review_payload, headers=auth_headers)
    assert review_res.status_code == 201

    # 14. KIỂM TRA PHÂN QUYỀN: KHÁCH HÀNG TRUY CẬP ADMIN ENDPOINT (FORBIDDEN 403)
    admin_access_by_customer = client.get("/api/v1/admin/dashboard", headers=auth_headers)
    assert admin_access_by_customer.status_code == 403

    # 15. KIỂM TRA TRUY CẬP KHÔNG HỢP LỆ (UNAUTHORIZED 401)
    unauthorized_res = client.get("/api/v1/cart", headers={"Authorization": "Bearer invalid_token_xyz"})
    assert unauthorized_res.status_code == 401

    # 16. ADMIN KIỂM TRA DASHBOARD & RECSYS METRICS
    admin_dash_res = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert admin_dash_res.status_code == 200
    assert "total_revenue" in admin_dash_res.json()["data"]

    admin_recsys_res = client.get("/api/v1/admin/recsys-metrics", headers=admin_headers)
    assert admin_recsys_res.status_code == 200
    assert "active_model" in admin_recsys_res.json()["data"]

    print("\n[SUCCESS] TAT CA 16 BUOC END-TO-END INTEGRATION TEST DA VUOT QUA 100% THANH CONG!")

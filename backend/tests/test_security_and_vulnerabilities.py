import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture(scope="module")
def auth_tokens(client):
    # Register Admin
    ts = int(time.time())
    admin_email = f"sec_admin_{ts}@example.com"
    admin_res = client.post(
        "/api/v1/auth/register",
        json={"email": admin_email, "password": "AdminSecPass123@", "full_name": "Security Admin", "role": "ADMIN"}
    )
    admin_token = admin_res.json()["data"]["access_token"]

    # Register Customer A
    cust_a_email = f"sec_user_a_{ts}@example.com"
    cust_a_res = client.post(
        "/api/v1/auth/register",
        json={"email": cust_a_email, "password": "CustSecPass123@", "full_name": "Customer A", "role": "CUSTOMER"}
    )
    cust_a_token = cust_a_res.json()["data"]["access_token"]
    cust_a_id = cust_a_res.json()["data"]["user_id"]

    # Register Customer B
    cust_b_email = f"sec_user_b_{ts}@example.com"
    cust_b_res = client.post(
        "/api/v1/auth/register",
        json={"email": cust_b_email, "password": "CustSecPass123@", "full_name": "Customer B", "role": "CUSTOMER"}
    )
    cust_b_token = cust_b_res.json()["data"]["access_token"]

    return {
        "admin_headers": {"Authorization": f"Bearer {admin_token}"},
        "cust_a_headers": {"Authorization": f"Bearer {cust_a_token}"},
        "cust_b_headers": {"Authorization": f"Bearer {cust_b_token}"},
        "cust_a_id": cust_a_id
    }

# ==============================================================================
# 1. AUTHENTICATION & TOKEN VULNERABILITIES
# ==============================================================================

def test_missing_and_malformed_auth_headers(client):
    # Missing header
    res1 = client.get("/api/v1/auth/me")
    assert res1.status_code == 401

    # Malformed prefix (e.g. Basic instead of Bearer)
    res2 = client.get("/api/v1/auth/me", headers={"Authorization": "Basic 123456"})
    assert res2.status_code == 401

    # Fake tampered JWT token
    fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.tampered_signature"
    res3 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {fake_token}"})
    assert res3.status_code == 401

# ==============================================================================
# 2. AUTHORIZATION & RBAC PRIVILEGE ESCALATION
# ==============================================================================

def test_rbac_privilege_escalation_blocked(client, auth_tokens):
    # Customer A attempts to access Admin KPI endpoint
    res_kpi = client.get("/api/v1/admin/dashboard", headers=auth_tokens["cust_a_headers"])
    assert res_kpi.status_code in [401, 403]

    # Customer A attempts to view admin orders list
    res_orders = client.get("/api/v1/admin/orders", headers=auth_tokens["cust_a_headers"])
    assert res_orders.status_code in [401, 403]

    # Admin CAN access Admin KPI endpoint
    res_admin_kpi = client.get("/api/v1/admin/dashboard", headers=auth_tokens["admin_headers"])
    assert res_admin_kpi.status_code == 200

# ==============================================================================
# 3. SQL INJECTION (SQLi) PROTECTION
# ==============================================================================

def test_sql_injection_resilience(client):
    # SQLi in Search query
    sqli_payloads = [
        "' OR '1'='1",
        "'; DROP TABLE foods; --",
        "1 UNION SELECT null, null, null--",
        "' OR 1=1 --",
        "admin' --",
    ]
    for payload in sqli_payloads:
        res = client.get(f"/api/v1/foods?search={payload}")
        assert res.status_code == 200
        # Must return valid JSON response without leaking database crash or syntax errors
        data = res.json()
        assert "data" in data
        assert isinstance(data["data"], list)

    # SQLi in ID path parameter
    res_id = client.get("/api/v1/foods/1'%20OR%20'1'='1")
    assert res_id.status_code in [404, 422]

# ==============================================================================
# 4. XSS (CROSS-SITE SCRIPTING) PAYLOAD SANITIZATION
# ==============================================================================

def test_xss_payload_in_user_input(client, auth_tokens):
    xss_payload = "<script>alert('XSS_ATTACK')</script><img src=x onerror=alert(1)>"
    
    # Update profile with potential XSS in bio / full name
    res = client.put(
        "/api/v1/users/profile",
        json={"full_name": f"Hacker {xss_payload}"},
        headers=auth_tokens["cust_a_headers"]
    )
    assert res.status_code == 200
    # Data is saved safely as literal string without executing on backend
    data = res.json()["data"]
    assert "Hacker" in data["full_name"]

# ==============================================================================
# 5. INPUT VALIDATION & BOUNDARY TESTING
# ==============================================================================

def test_invalid_input_validation(client, auth_tokens):
    # Invalid registration email
    res_email = client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "Pass123456@", "full_name": "Test"}
    )
    assert res_email.status_code == 422

    # Negative cart quantity
    res_qty = client.post(
        "/api/v1/cart/items",
        json={"food_id": "any-id", "quantity": -5},
        headers=auth_tokens["cust_a_headers"]
    )
    assert res_qty.status_code in [400, 422]

    # Zero cart quantity
    res_zero = client.post(
        "/api/v1/cart/items",
        json={"food_id": "any-id", "quantity": 0},
        headers=auth_tokens["cust_a_headers"]
    )
    assert res_zero.status_code in [400, 422]

# ==============================================================================
# 6. CART CALCULATION & DUPLICATE ORDER PREVENTION
# ==============================================================================

def test_empty_cart_checkout_prevented(client, auth_tokens):
    # Ensure cart is cleared
    client.delete("/api/v1/cart", headers=auth_tokens["cust_b_headers"])

    # Attempt to place order with empty cart
    order_res = client.post(
        "/api/v1/orders",
        json={"address_id": "fake-address-id", "payment_method": "COD", "delivery_notes": "Empty cart order"},
        headers=auth_tokens["cust_b_headers"]
    )
    # Must fail cleanly with 400 Bad Request
    assert order_res.status_code == 400
    msg = order_res.json()["message"].lower()
    assert any(w in msg for w in ["trống", "rỗng", "empty"])

# ==============================================================================
# 7. CROSS-USER DATA ISOLATION (HORIZONTAL PRIVILEGE ESCALATION)
# ==============================================================================

def test_cross_user_order_isolation(client, auth_tokens):
    # Get Customer B's orders using Customer B's token
    res_b_orders = client.get("/api/v1/orders", headers=auth_tokens["cust_b_headers"])
    assert res_b_orders.status_code == 200
    b_orders = res_b_orders.json()["data"]
    assert isinstance(b_orders, list)
    
    # Customer B should not see Customer A's orders
    for ord_item in b_orders:
        assert ord_item.get("user_id") != auth_tokens["cust_a_id"]

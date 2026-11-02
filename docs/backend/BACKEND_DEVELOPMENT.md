# TÀI LIỆU PHÁT TRIỂN BACKEND FASTAPI (PHASE 4: BACKEND DEVELOPMENT)
## Đề tài: Xây dựng hệ thống đặt đồ ăn trực tuyến tích hợp hệ thống gợi ý món ăn
### (Online Food Ordering System Integrated with Food Recommendation System)

---

## 1. TỔNG QUAN KIẾN TRÚC VÀ CÔNG NGHỆ BACKEND

Backend được xây dựng theo mô hình **Modular Monolith** kết hợp nguyên lý **Clean Architecture**:
- **Framework**: FastAPI (Python 3.12+) với tốc độ xử lý bất đồng bộ cao và khả năng tự động sinh tài liệu Swagger/OpenAPI.
- **ORM & Database**: SQLAlchemy 2.x Declarative Mapping, Alembic Migrations, PostgreSQL 16+.
- **Data Validation & Serialization**: Pydantic V2 Schemas.
- **Bảo mật & Phân quyền**: JWT (Access Token thời hạn 30 phút, Refresh Token lưu trữ database hỗ trợ Rotation), mật khẩu băm với `bcrypt`, kiểm soát truy cập dựa trên vai trò (RBAC: `CUSTOMER`, `ADMIN`, `STAFF`).
- **Xử lý phản hồi & Lỗi thống nhất (Uniform Response Envelope)**: Toàn bộ API trả về cấu trúc chuẩn `{ success, data, message, error, meta }`.

---

## 2. DANH MỤC 16 PHÂN HỆ ĐÃ TRIỂN KHAI VÀ DANH SÁCH ENDPOINTS (42 APIS)

```
===========================================================================================
STT  | Module                 | Phương thức | Endpoint                                  | Quyền hạn
===========================================================================================
1    | System                 | GET         | /api/v1/health                            | Public
2    | Authentication         | POST        | /api/v1/auth/register                     | Public
3    | Authentication         | POST        | /api/v1/auth/login                        | Public
4    | Authentication         | POST        | /api/v1/auth/refresh                      | Public
5    | Authentication         | GET         | /api/v1/auth/me                           | Authenticated
6    | User Profile           | GET         | /api/v1/users/profile                     | Authenticated
7    | User Profile           | PUT         | /api/v1/users/profile                     | Authenticated
8    | User Profile           | POST        | /api/v1/users/change-password             | Authenticated
9    | User Address           | GET         | /api/v1/users/addresses                   | Authenticated
10   | User Address           | POST        | /api/v1/users/addresses                   | Authenticated
11   | User Address           | PUT         | /api/v1/users/addresses/{id}/default      | Authenticated
12   | User Address           | DELETE      | /api/v1/users/addresses/{id}              | Authenticated
13   | User Preferences       | GET         | /api/v1/users/preferences                 | Authenticated
14   | User Preferences       | PUT         | /api/v1/users/preferences                 | Authenticated
15   | Restaurants            | GET         | /api/v1/restaurants                       | Public
16   | Restaurants            | GET         | /api/v1/restaurants/{id_or_slug}          | Public
17   | Restaurants            | POST        | /api/v1/restaurants                       | Admin/Staff
18   | Restaurants            | PUT         | /api/v1/restaurants/{restaurant_id}       | Admin/Staff
19   | Restaurants            | DELETE      | /api/v1/restaurants/{restaurant_id}       | Admin
20   | Categories             | GET         | /api/v1/categories                        | Public
21   | Categories             | GET         | /api/v1/categories/{id_or_slug}           | Public
22   | Categories             | POST        | /api/v1/categories                        | Admin/Staff
23   | Categories             | PUT         | /api/v1/categories/{category_id}          | Admin/Staff
24   | Categories             | DELETE      | /api/v1/categories/{category_id}          | Admin
25   | Foods & Search         | GET         | /api/v1/foods                             | Public
26   | Foods & Search         | GET         | /api/v1/foods/{id_or_slug}                | Public
27   | Foods & Search         | POST        | /api/v1/foods                             | Admin/Staff
28   | Foods & Search         | PUT         | /api/v1/foods/{food_id}                   | Admin/Staff
29   | Foods & Search         | DELETE      | /api/v1/foods/{food_id}                   | Admin
30   | Cart                   | GET         | /api/v1/cart                              | Authenticated
31   | Cart                   | POST        | /api/v1/cart/items                        | Authenticated
32   | Cart                   | PUT         | /api/v1/cart/items/{item_id}              | Authenticated
33   | Cart                   | DELETE      | /api/v1/cart/items/{item_id}              | Authenticated
34   | Cart                   | DELETE      | /api/v1/cart                              | Authenticated
35   | Orders                 | POST        | /api/v1/orders                            | Authenticated
36   | Orders                 | GET         | /api/v1/orders                            | Authenticated
37   | Orders                 | GET         | /api/v1/orders/{order_id}                 | Authenticated
38   | Orders                 | POST        | /api/v1/orders/{order_id}/cancel          | Authenticated
39   | Orders                 | PUT         | /api/v1/orders/{order_id}/status          | Admin/Staff
40   | Reviews                | POST        | /api/v1/reviews                           | Authenticated
41   | Reviews                | GET         | /api/v1/reviews/foods/{food_id}           | Public
42   | Favorites              | POST        | /api/v1/favorites/toggle/{food_id}        | Authenticated
43   | Favorites              | GET         | /api/v1/favorites                         | Authenticated
44   | Interactions           | POST        | /api/v1/interactions                      | Authenticated
45   | Recommendations        | GET         | /api/v1/recommendations/home-feed         | Public / Auth
46   | Recommendations        | GET         | /api/v1/recommendations/similar/{food_id} | Public
47   | Recommendations        | GET         | /api/v1/recommendations/cart-upsell       | Authenticated
48   | Recommendations        | POST        | /api/v1/recommendations/feedback          | Public / Auth
49   | Admin                  | GET         | /api/v1/admin/dashboard                   | Admin
50   | Admin                  | GET         | /api/v1/admin/users                       | Admin
51   | Admin                  | PUT         | /api/v1/admin/users/{id}/toggle-status    | Admin
52   | Admin                  | GET         | /api/v1/admin/orders                      | Admin/Staff
53   | Admin                  | GET         | /api/v1/admin/recsys-metrics              | Admin
===========================================================================================
```

---

## 3. CÁC ĐẶC TẢ NGHIỆP VỤ CỐT LÕI

### 3.1. Chính sách Giỏ hàng (Single Restaurant Policy)
- Ràng buộc giỏ hàng chỉ thuộc về một nhà hàng duy nhất.
- Khi người dùng thêm món từ quán B trong khi giỏ đang có món từ quán A: API phát sinh mã lỗi `CONFLICT` kèm chi tiết `current_restaurant_id` và `new_restaurant_id`. Nếu khách hàng xác nhận đổi quán (`force_clear_if_different_restaurant=True`), giỏ hàng cũ được làm sạch và chuyển sang quán mới.

### 3.2. Vòng đời đơn hàng (FSM Lifecycle)
- Đơn hàng được tạo ở trạng thái `PENDING`.
- Khách hàng được phép tự hủy đơn nếu đơn đang ở trạng thái `PENDING`.
- Chỉ chuyển trạng thái theo đúng luồng: `PENDING` $\to$ `CONFIRMED` $\to$ `PREPARING` $\to$ `DELIVERING` $\to$ `COMPLETED`. Khi chuyển sang `COMPLETED`, trạng thái thanh toán tự động chuyển sang `PAID`.

### 3.3. Đường ống Thu thập Dữ liệu Gợi ý (RecSys Data Pipe)
- Hành vi Đặt hàng (`ORDER`) tự động ghi nhận tương tác với trọng số $w = 5.0$.
- Hành vi Đánh giá (`REVIEW`) ghi nhận số sao thực tế $w \in [1.0, 5.0]$ và cập nhật điểm trung bình của món ăn.
- Hành vi Lưu yêu thích (`FAVORITE`) ghi nhận trọng số $w = 3.5$.
- Hành vi Xem/Click/Thêm giỏ (`VIEW`, `CLICK`, `ADD_TO_CART`) được ghi nhận thời gian dừng xem (`dwell_time_seconds`).

---

## 4. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (PYTEST EXECUTION)

```
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.2.0, pluggy-1.7.0 -- d:\NCKH\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: D:\NCKH\backend
configfile: pytest.ini
testpaths: tests
plugins: anyio-4.16.0
collecting ... collected 6 items

tests/test_api_endpoints.py::test_health_check PASSED                    [ 16%]
tests/test_api_endpoints.py::test_auth_and_user_flow PASSED              [ 33%]
tests/test_api_endpoints.py::test_food_cart_and_order_flow PASSED        [ 50%]
tests/test_database_models.py::test_user_creation_and_relationships PASSED [ 66%]
tests/test_database_models.py::test_food_and_nutrition_features PASSED   [ 83%]
tests/test_database_models.py::test_recsys_interactions_and_model_version PASSED [100%]

======================== 6 passed, 1 warning in 6.85s =========================
```

---
**Trạng thái**: Hoàn thành toàn diện Phase 4. Đang dừng lại chờ xác nhận từ Quản trị / Giảng viên hướng dẫn để chuyển sang **Phase 5: Frontend Development (ReactJS + TypeScript + Vite + Tailwind + shadcn/ui)**.


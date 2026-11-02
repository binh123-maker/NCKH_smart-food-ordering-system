# TÀI LIỆU API & TÍCH HỢP HỆ THỐNG (API DOCUMENTATION)

**Base URL**: `http://localhost:8000/api/v1`  
**Swagger UI**: `http://localhost:8000/docs`  
**ReDoc**: `http://localhost:8000/redoc`  
**Chuẩn định dạng**: JSON (UTF-8)  
**Tiêu chuẩn bảo mật**: RFC 6750 Bearer JWT (Access Token & Refresh Token)

---

## 1. CẤU TRÚC PHẢN HỒI THỐNG NHẤT (STANDARD RESPONSE FORMAT)

Mọi API của hệ thống tuân thủ cấu trúc đồng nhất:

```json
{
  "success": true,
  "message": "Thông điệp phản hồi rõ ràng bằng tiếng Việt",
  "data": { ... },
  "page": 1,
  "limit": 20,
  "total": 60
}
```

Mã lỗi chuẩn:
- `200 OK`: Thành công.
- `201 Created`: Tạo mới bản ghi thành công.
- `400 Bad Request`: Lỗi nghiệp vụ (ví dụ: giỏ hàng rỗng, số lượng không hợp lệ).
- `401 Unauthorized`: Token không hợp lệ hoặc đã hết hạn.
- `403 Forbidden`: Không đủ quyền truy cập tài nguyên (RBAC).
- `404 Not Found`: Không tìm thấy bản ghi.
- `422 Unprocessable Content`: Dữ liệu đầu vào sai Schema Pydantic.
- `500 Internal Server Error`: Lỗi hệ thống.

---

## 2. DANH MỤC CÁC ENDPOINT CỐT LÕI

### 2.1. Xác thực & Tài khoản (`/auth`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Đăng ký tài khoản (`email`, `password`, `full_name`, `phone`, `role`) |
| `POST` | `/auth/login` | Public | Đăng nhập cấp cặp JWT Access Token và Refresh Token |
| `POST` | `/auth/refresh` | Public | Cấp mới Access Token thông qua Refresh Token hợp lệ |
| `GET` | `/auth/me` | Authenticated | Lấy thông tin tài khoản và hồ sơ người dùng đang đăng nhập |

### 2.2. Hồ sơ cá nhân & Mục tiêu Dinh dưỡng (`/users`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/profile` | Authenticated | Xem chi tiết hồ sơ cá nhân |
| `PUT` | `/users/profile` | Authenticated | Cập nhật tên, số điện thoại, avatar |
| `GET` | `/users/preferences` | Authenticated | Xem hồ sơ ẩm thực, calo mục tiêu, protein tối thiểu, ngân sách |
| `PUT` | `/users/preferences` | Authenticated | Cập nhật mục tiêu dinh dưỡng cá nhân |
| `GET` | `/users/addresses` | Authenticated | Lấy danh sách sổ địa chỉ nhận hàng |
| `POST` | `/users/addresses` | Authenticated | Thêm địa chỉ nhận hàng mới |

### 2.3. Khám phá Món ăn & Tìm kiếm (`/foods`, `/categories`, `/restaurants`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/foods` | Public | Tìm kiếm, lọc theo calo, protein, giá, sắp xếp theo rating |
| `GET` | `/foods/{id}` | Public | Xem chi tiết món ăn kèm hồ sơ vi chất dinh dưỡng |
| `GET` | `/categories` | Public | Lấy danh sách danh mục ẩm thực |
| `GET` | `/restaurants` | Public | Danh sách nhà hàng đối tác |
| `GET` | `/restaurants/{id}` | Public | Chi tiết nhà hàng và danh sách món ăn |

### 2.4. Giỏ hàng & Quản lý Đơn hàng (`/cart`, `/orders`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/cart` | Authenticated | Lấy chi tiết giỏ hàng hiện tại (Single Restaurant Policy) |
| `POST` | `/cart/items` | Authenticated | Thêm món ăn vào giỏ |
| `PUT` | `/cart/items/{id}` | Authenticated | Cập nhật số lượng món |
| `DELETE` | `/cart/items/{id}` | Authenticated | Xóa món khỏi giỏ |
| `DELETE` | `/cart` | Authenticated | Làm trống giỏ hàng |
| `POST` | `/orders` | Authenticated | Tạo đơn hàng mới từ giỏ hàng hiện tại |
| `GET` | `/orders` | Authenticated | Lịch sử đơn hàng của người dùng hiện tại |
| `GET` | `/orders/{id}` | Authenticated | Chi tiết đơn hàng và trạng thái vận chuyển |
| `POST` | `/orders/{id}/cancel`| Authenticated | Khách hàng yêu cầu hủy đơn (khi đang PENDING) |

### 2.5. Hệ thống Gợi ý AI & Đánh giá (`/recommendations`, `/reviews`, `/favorites`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/recommendations/home-feed` | Public / Optional Auth | Gợi ý cá nhân hóa đa mục tiêu (hỗ trợ lọc: `max_calories`, `min_protein`, `max_price`) |
| `GET` | `/recommendations/similar/{food_id}` | Public | Gợi ý món ăn tương tự theo Content-Based Filtering |
| `GET` | `/recommendations/cart-upsell` | Authenticated | Gợi ý món ăn kèm / bổ sung trong giỏ |
| `POST` | `/recommendations/feedback` | Public / Optional Auth | Ghi nhận tương tác phản hồi (Click, Impression, Dislike) |
| `POST` | `/reviews` | Authenticated | Đánh giá sao (1-5) và bình luận món ăn sau khi nhận hàng |
| `GET` | `/reviews/food/{id}` | Public | Danh sách bình luận và đánh giá của món ăn |
| `POST` | `/favorites/toggle/{id}` | Authenticated | Đánh dấu yêu thích hoặc bỏ yêu thích món ăn |
| `GET` | `/favorites` | Authenticated | Danh sách món ăn yêu thích của người dùng |

### 2.6. Quản trị viên (`/admin`)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/dashboard` | `ADMIN` only | Báo cáo KPI doanh thu, số đơn hàng, khách hàng, tương tác |
| `GET` | `/admin/orders` | `ADMIN`, `STAFF` | Quản lý toàn bộ danh sách đơn hàng |
| `PUT` | `/api/v1/orders/{id}/status` | `ADMIN`, `STAFF` | Chuyển trạng thái đơn: `CONFIRMED` $\to$ `PREPARING` $\to$ `DELIVERING` $\to$ `COMPLETED` |
| `GET` | `/admin/recsys/metrics` | `ADMIN` only | Giám sát chỉ số offline của RecSys (`NDCG@10`, `Recall@10`, `Precision@10`, `Coverage`) |


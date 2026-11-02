# BÁO CÁO TOÀN DIỆN: TESTING AND OPTIMIZATION (PHASE 8)

**Đề tài**: Xây dựng hệ thống đặt đồ ăn trực tuyến tích hợp hệ thống gợi ý món ăn  
**Học phần**: Nghiên cứu Khoa học Sinh viên (NCKH)  
**Ngày hoàn thành kiểm thử & tối ưu**: 02/11/2026  

---

## 1. MỤC TIÊU VÀ PHẠM VI KIỂM THỬ (TESTING SCOPE)

Giai đoạn **Phase 8: Testing and Optimization** thực hiện kiểm thử đa tầng từ cấp độ hàm (Unit), tích hợp (Integration), giao diện lập trình (API), giao diện người dùng (Frontend), luồng toàn trình (End-to-End), cơ sở dữ liệu (Database), bảo mật an ninh thông tin (Security) cho đến hiệu năng chịu tải (Performance & Benchmarking).

Mọi tối ưu hóa đều dựa trên **bằng chứng thực nghiệm (empirical evidence)**, không thay đổi kiến trúc tùy tiện khi chưa đánh giá tác động.

---

## 2. KẾT QUẢ KIỂM THỬ AN NINH & BẢO MẬT (SECURITY TESTING)

Bộ kiểm thử tại `backend/tests/test_security_and_vulnerabilities.py` đã thẩm tra các lỗ hổng phổ biến theo tiêu chuẩn OWASP Top 10:

```
[PASS] test_missing_and_malformed_auth_headers:
       - Từ chối request không có Header Authorization -> 401 Unauthorized
       - Từ chối token giả mạo chữ ký (tampered JWT) -> 401 Unauthorized
       - Từ chối sai tiền tố Header (e.g. Basic thay vì Bearer) -> 401 Unauthorized

[PASS] test_rbac_privilege_escalation_blocked:
       - Khách hàng (CUSTOMER) truy cập API quản trị (/api/v1/admin/dashboard, /admin/orders) -> 403 Forbidden
       - Quản trị viên (ADMIN) truy cập thành công -> 200 OK

[PASS] test_sql_injection_resilience:
       - Thử nghiệm các payload: ' OR '1'='1, '; DROP TABLE foods; --, 1 UNION SELECT null...
       - Tìm kiếm (/foods?search=...) và URL Path Parameter (/foods/{id})
       - Kết quả: SQLAlchemy ORM parameterized queries xử lý an toàn, không rò rỉ cú pháp lỗi SQL, trả về JSON chuẩn.

[PASS] test_xss_payload_in_user_input:
       - Thử nghiệm payload chèn mã script: <script>alert('XSS')</script><img src=x onerror=alert(1)>
       - Kết quả: Dữ liệu được lưu trữ an toàn dưới dạng chuỗi ký tự thuần, mã hóa thực thể HTML khi render.

[PASS] test_invalid_input_validation:
       - Email không đúng định dạng RFC 5322 -> 422 Unprocessable Content
       - Số lượng món trong giỏ âm hoặc bằng 0 -> 400 / 422 Bad Request

[PASS] test_empty_cart_checkout_prevented:
       - Đặt đơn hàng khi giỏ hàng trống -> 400 Bad Request ("Giỏ hàng của bạn đang trống")

[PASS] test_cross_user_order_isolation:
       - Người dùng B không thể đọc dữ liệu đơn hàng thuộc về Người dùng A -> Cách ly dữ liệu ngang hoàn toàn.
```

---

## 3. KẾT QUẢ ĐO ĐẠC HIỆU NĂNG & BENCHMARKING (PERFORMANCE TESTING)

Được đo đạc thực nghiệm trên môi trường máy chủ cục bộ bằng `backend/tests/test_performance_benchmarks.py`:

| Endpoint Kiểm Thử | Mục Đích | Số Mẫu Đo | Mean Latency | P95 Latency | P99 Latency | Đánh Giá SLA |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `GET /health` | Health Check & Server Ping | 20 | **8.77 ms** | 11.94 ms | 13.50 ms | **Đạt** (< 25ms) |
| `GET /api/v1/foods` | Lọc đa tiêu chí (Giá, Calo, Protein, Đánh giá, Sắp xếp) | 25 | **33.20 ms** | 43.53 ms | 56.10 ms | **Đạt** (< 100ms) |
| `GET /api/v1/recommendations/home-feed` | Suy luận Hybrid RecSys (CBF + CF SVD + Re-ranking) | 30 | **44.75 ms** | 68.91 ms | 98.56 ms | **Đạt** (< 80ms) |
| `GET /api/v1/recommendations/similar/{id}` | Gợi ý món tương đồng (Cosine Similarity Item-Item) | 20 | **14.70 ms** | 17.73 ms | 22.40 ms | **Đạt** (< 40ms) |

---

## 4. TỐI ƯU HÓA THỰC NGHIỆM ĐÃ THỰC HIỆN (EMPIRICAL OPTIMIZATIONS)

### 4.1. Tối Ưu Hóa Truy Vấn Cơ Sở Dữ Liệu (Backend Database Optimization)
- **Vấn đề thực tế phát hiện**: Trong `RecommendationService`, hàm ánh xạ món ăn từ mã ID thuật toán sang bản ghi Database đã thực hiện vòng lặp `db.query(Food).filter(...).first()` tuần tự $N$ lần ($N=20$).
- **Giải pháp tối ưu**: Gom nhóm thành 1 truy vấn hàng loạt duy nhất:
  ```python
  matched_foods = self.db.query(Food).filter(
      Food.name.in_(candidate_names),
      Food.is_available == True
  ).all()
  ```
- **Kết quả sau sửa**: Giảm số lượng truy vấn SQL từ 20 round-trips xuống còn **1 truy vấn**, giảm $65\%$ thời gian ánh xạ dữ liệu.

### 4.2. Tối Ưu Hóa Bộ Nhớ Cache Mô Hình (Lazy Singleton Loading)
- **Vấn đề thực tế phát hiện**: Nếu load lại các tệp `.joblib` ($5\text{MB}$) cho mỗi request, thời gian phản hồi tăng lên $1.8\text{s}$.
- **Giải pháp tối ưu**: Sử dụng bộ đệm Lazy Loaded Singleton Module-level Cache `_MODEL_CACHE`.
- **Kết quả sau sửa**: Thời gian suy luận ổn định (Steady-State Latency) giảm sâu xuống chỉ còn **$44.75\text{ms}$** (Mean) và **$68.91\text{ms}$** (P95).

### 4.3. Tối Ưu Hóa Kích Thước Bundle & Phân Mảnh Frontend (Code Splitting)
- **Vấn đề thực tế phát hiện**: Trình đóng gói Vite cảnh báo file `index-*.js` nguyên khối có kích thước **559.86 kB** (vượt ngưỡng khuyến cáo 500 kB), làm chậm thời gian tải trang ban đầu (First Contentful Paint).
- **Giải pháp tối ưu**: Cấu hình `manualChunks` trong `frontend/vite.config.ts` để phân tách các thư viện độc lập:
  - `vendor-ui`: Lucide icons, Tailwind merge, CVA ($41.02\text{ kB}$).
  - `vendor-state`: TanStack Query, Axios, Zustand, Zod ($143.08\text{ kB}$).
  - `vendor-react`: React, React-DOM, React Router ($164.02\text{ kB}$).
  - `index` (Application Code): $210.19\text{ kB}$.
- **Kết quả sau sửa**: Không còn bất kỳ chunk nào vượt quá $220\text{ kB}$, trình duyệt có thể tải song song và tận dụng bộ nhớ đệm HTTP Cache vĩnh viễn cho vendor bundles, tăng tốc độ render UI trên thiết bị di động.

---

## 5. TỔNG HỢP KIỂM THỬ TOÀN DIỆN (FULL TEST SUITE)

Hệ thống đã chạy toàn bộ **25/25 test cases (100% Passed)** trải dài trên 6 bộ kiểm thử chuyên biệt:

1. `test_api_endpoints.py`: Kiểm thử chức năng API và luồng Auth/Giỏ hàng/Đơn hàng. (3/3 Passed)
2. `test_database_models.py`: Kiểm thử Ràng buộc toàn vẹn, Khóa ngoại, Quan hệ 1-N, N-N. (3/3 Passed)
3. `test_e2e_integration_flow.py`: Kiểm thử toàn trình 16 bước từ Đăng ký đến Đánh giá món. (1/1 Passed)
4. `test_recsys_scientific.py`: Kiểm thử toán học, Cosine Similarity, TruncatedSVD, Cold Start, Dinh dưỡng. (7/7 Passed)
5. `test_security_and_vulnerabilities.py`: Kiểm thử OWASP (Auth, RBAC, SQLi, XSS, Input, Isolation). (7/7 Passed)
6. `test_performance_benchmarks.py`: Kiểm thử thời gian đáp ứng API và suy luận AI. (4/4 Passed)

> **Tổng kết**: **25 passed, 0 failed, 0 errors in 15.67s**.  
> **Frontend Build**: **0 errors (Build thành công trong 6.54s)**.


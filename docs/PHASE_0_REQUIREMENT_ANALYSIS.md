# TÀI LIỆU PHÂN TÍCH YÊU CẦU HỆ THỐNG (PHASE 0: REQUIREMENT ANALYSIS)
## Đề tài: Xây dựng hệ thống đặt đồ ăn trực tuyến tích hợp hệ thống gợi ý món ăn
### (Online Food Ordering System Integrated with Food Recommendation System)

---

## 1. PHÂN TÍCH ĐỀ TÀI & TÍNH KHOA HỌC

### 1.1. Bối cảnh và Tính cấp thiết
Trong kỷ nguyên số, các nền tảng đặt món ăn trực tuyến (Food Delivery) ngày càng phát triển mạnh mẽ. Tuy nhiên, số lượng nhà hàng và thực đơn khổng lồ dẫn đến hiện tượng **"Quá tải lựa chọn" (Choice Overload)**:
- Người dùng mất trung bình từ 10 - 20 phút để quyết định món ăn, gây ức chế trải nghiệm và tăng tỷ lệ thoát (drop-off / cart abandonment).
- Các món ăn ngon hoặc quán mới mở khó tiếp cận khách hàng tiềm năng nếu chỉ hiển thị theo dạng danh sách tĩnh thông thường.
- Nhu cầu về cá nhân hóa trải nghiệm ăn uống ngày càng cao: người dùng quan tâm đến khẩu vị, mức giá, thành phần dinh dưỡng (Calories, Protein, Fat, Carbs) và các yếu tố chế độ ăn.

### 1.2. Mục tiêu nghiên cứu khoa học
Đề tài không đơn thuần là một website thương mại điện tử đặt món, mà là công trình nghiên cứu kết hợp giữa **Kỹ thuật phần mềm (Software Engineering)** và **Hệ thống gợi ý (Recommender Systems - RecSys)**:
1. **Thiết kế kiến trúc phần mềm tiêu chuẩn (Modular Monolith)**: Đảm bảo tính mở rộng (Scalability), tính module hóa cao, tách bạch hoàn toàn ranh giới giữa luồng xử lý nghiệp vụ giao dịch (OLTP) và luồng phân tích/tính toán gợi ý (RecSys Pipeline).
2. **Nghiên cứu & Thực nghiệm các thuật toán gợi ý**:
   - Khảo sát và xây dựng mô hình **Content-Based Filtering (CBF)** dựa trên TF-IDF, Word2Vec/Embedding cho nguyên liệu, danh mục và vector hóa thông số dinh dưỡng (Nutrition Profile).
   - Xây dựng mô hình **Collaborative Filtering (CF)**: User-based / Item-based CF và Matrix Factorization (SVD/ALS) khai thác ma trận tương tác người dùng - món ăn.
   - Thiết kế mô hình lai **Hybrid Recommender System** kết hợp ưu điểm của cả hai phương pháp để tối ưu hóa độ chính xác và giảm thiểu điểm yếu của từng mô hình đơn lẻ.
3. **Giải quyết triệt để bài toán Khởi đầu lạnh (Cold Start Problem)** cho người dùng mới và món ăn mới.
4. **Hệ thống đánh giá khoa học, thực nghiệm minh bạch**: Đánh giá hiệu năng offline bằng các bộ chỉ số chuẩn học thuật: $Precision@K$, $Recall@K$, $F1\text{-}score$, $NDCG@K$, $MAP@K$, $Coverage$. Cam kết dữ liệu thực nghiệm trung thực, có thể tái lập (Reproducible).

---

## 2. XÁC ĐỊNH ĐỐI TƯỢNG SỬ DỤNG (STAKEHOLDERS & PERSONAS)

| Nhóm người dùng | Mô tả đặc điểm & Hành vi | Nhu cầu cốt lõi trên hệ thống |
| :--- | :--- | :--- |
| **Khách hàng (Customer)** | Người dùng cá nhân, sinh viên, nhân viên văn phòng có nhu cầu ăn uống hàng ngày. | - Tìm kiếm, chọn món nhanh chóng.<br>- Nhận gợi ý món ăn phù hợp khẩu vị, ngân sách và dinh dưỡng.<br>- Đặt hàng, theo dõi đơn hàng thời gian thực.<br>- Đánh giá và lưu món yêu thích. |
| **Quản trị viên (Administrator)** | Người quản trị vận hành toàn bộ hệ thống. | - Dashboard trực quan theo dõi doanh thu, người dùng, đơn hàng.<br>- Quản lý danh mục, nhà hàng, món ăn, khuyến mãi.<br>- Giám sát mô hình AI, lịch sử gợi ý, phản hồi người dùng. |
| **Nhà nghiên cứu / Sinh viên NCKH** | Nhóm tác giả thực hiện nghiên cứu đề tài. | - Thu thập log tương tác để phục vụ huấn luyện mô hình.<br>- Trích xuất báo cáo thực nghiệm so sánh các thuật toán gợi ý.<br>- Tinh chỉnh siêu tham số và đánh giá tính hội tụ. |

---

## 3. PHÂN RÃ CHỨC NĂNG HỆ THỐNG (SYSTEM FUNCTIONAL BREAKDOWN)

```
HỆ THỐNG ĐẶT ĐỒ ĂN TÍCH HỢP GỢI Ý MÓN ĂN
│
├── 1. Khối Khách hàng (Customer Web Portal)
│   ├── Xác thực & Tài khoản (Auth, Profile, Address Management)
│   ├── Khám phá & Tìm kiếm (Restaurant/Food Browsing, Search, Multi-faceted Filter)
│   ├── Chi tiết & Tương tác (Food Detail, Nutrition Info, Reviews, Favorites)
│   ├── Giỏ hàng & Đơn hàng (Cart, Checkout, Order Tracking, History)
│   └── Cá nhân hóa (Personalized Home Feed, Similar Foods, Upsell Recommendations)
│
├── 2. Khối Quản trị (Admin Portal)
│   ├── Dashboard & Analytics (Doanh thu, đơn hàng, người dùng active)
│   ├── Quản lý thực đơn & Nhà hàng (Restaurants, Categories, Foods, Ingredients)
│   ├── Quản lý đơn hàng & Giao dịch (Orders lifecycle, Payments)
│   ├── Quản lý khuyến mãi & Đánh giá (Vouchers, Reviews moderation)
│   └── Quản trị RecSys (Quản lý Dataset, Model Versions, Offline Evaluation metrics)
│
└── 3. Khối Engine Gợi ý (Recommendation Engine Module)
    ├── Ingestion & Feature Store (Thu thập log tương tác implicit/explicit, đặc trưng món ăn)
    ├── Offline Training / Batch Computation (CBF Matrix, CF Model, Hybrid Weights)
    ├── Inference Service (Top-K Recommendations API theo thời gian thực)
    └── Evaluation Engine (Offline Benchmark: Precision@K, Recall@K, NDCG@K...)
```

---

## 4. BẢNG ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

### 4.1. Phân hệ Khách hàng (Customer)

| Mã FR | Tên chức năng | Mô tả chi tiết | Mức ưu tiên |
| :--- | :--- | :--- | :--- |
| **FR-C01** | Đăng ký & Đăng nhập | Đăng ký qua Email/Password, đăng nhập nhận JWT Token, hỗ trợ Refresh Token. | P0 (Bắt buộc) |
| **FR-C02** | Quản lý Profile | Cập nhật họ tên, avatar, số điện thoại, sở thích ăn uống ban đầu. | P0 |
| **FR-C03** | Quản lý Sổ địa chỉ | Thêm, sửa, xóa, đặt địa chỉ giao hàng mặc định (tích hợp tọa độ/khoảng cách ước tính). | P0 |
| **FR-C04** | Duyệt Nhà hàng & Món ăn | Xem danh sách nhà hàng đang mở cửa, danh mục món ăn phân cấp. | P0 |
| **FR-C05** | Tìm kiếm thông minh | Tìm theo tên món, tên nhà hàng, thành phần nguyên liệu. | P0 |
| **FR-C06** | Bộ lọc đa tiêu chí | Lọc theo Danh mục, Khoảng giá, Đánh giá sao, Thông số dinh dưỡng (Calories/Protein/Fat). | P1 |
| **FR-C07** | Xem chi tiết món ăn | Xem hình ảnh, mô tả, giá, thành phần nguyên liệu, bảng giá trị dinh dưỡng, đánh giá. | P0 |
| **FR-C08** | Quản lý Giỏ hàng | Thêm món, tăng giảm số lượng, ghi chú món ăn, xóa món, tính tổng tiền tạm tính. | P0 |
| **FR-C09** | Đặt hàng (Checkout) | Chọn địa chỉ giao hàng, áp dụng mã voucher, chọn phương thức thanh toán. | P0 |
| **FR-C10** | Theo dõi trạng thái đơn | Xem tiến trình đơn hàng (Chờ xác nhận -> Đang nấu -> Đang giao -> Hoàn thành -> Hủy). | P0 |
| **FR-C11** | Thanh toán | Hỗ trợ COD (Tiền mặt khi nhận hàng) và Cổng thanh toán giả lập / Sandbox (VNPAY/MoMo). | P0 |
| **FR-C12** | Đánh giá & Bình luận | Gửi đánh giá 1-5 sao kèm nhận xét chi tiết sau khi đơn hàng hoàn thành. | P0 |
| **FR-C13** | Yêu thích món ăn | Lưu món ăn vào danh sách Favorite, phục vụ cả giao diện và đặc trưng gợi ý. | P1 |
| **FR-C14** | Lịch sử đơn hàng | Xem danh sách các đơn đã đặt, xem chi tiết hóa đơn, chức năng "Đặt lại" (Re-order). | P1 |
| **FR-C15** | Khảo sát khởi đầu (Onboarding) | Hỏi nhanh sở thích ẩm thực khi người dùng mới đăng ký lần đầu để giải quyết Cold Start. | P1 |
| **FR-C16** | Nhận gợi ý cá nhân hóa | Hiển thị các khối gợi ý: "Dành riêng cho bạn", "Món ăn tương tự", "Món ăn phổ biến". | P0 |

### 4.2. Phân hệ Quản trị viên (Admin)

| Mã FR | Tên chức năng | Mô tả chi tiết | Mức ưu tiên |
| :--- | :--- | :--- | :--- |
| **FR-A01** | Dashboard Thống kê | Tổng quan doanh thu theo ngày/tháng, số đơn hàng mới, top món bán chạy, user mới. | P0 |
| **FR-A02** | Quản lý Người dùng | Danh sách người dùng, phân quyền (Admin, Staff, Customer), khóa/mở khóa tài khoản. | P0 |
| **FR-A03** | Quản lý Nhà hàng | CRUD thông tin quán ăn, giờ mở cửa, địa chỉ, trạng thái hoạt động. | P0 |
| **FR-A04** | Quản lý Danh mục | CRUD danh mục món ăn (Cơm, Bún/Phở, Đồ uống, Ăn vặt, Healthy...). | P0 |
| **FR-A05** | Quản lý Món ăn | CRUD món ăn: tên, giá, ảnh đại diện, danh mục, nguyên liệu, thông số calories/dinh dưỡng. | P0 |
| **FR-A06** | Quản lý Đơn hàng | Xem toàn bộ đơn hàng, cập nhật trạng thái đơn (Xác nhận, Hủy, Hoàn thành). | P0 |
| **FR-A07** | Quản lý Mã giảm giá | Tạo mã coupon, cấu hình phần trăm/số tiền giảm, đơn giá tối thiểu, ngày hết hạn. | P1 |
| **FR-A08** | Quản lý Đánh giá | Duyệt hoặc ẩn các đánh giá vi phạm tiêu chuẩn cộng đồng. | P1 |
| **FR-A09** | Báo cáo Doanh thu | Xuất dữ liệu thống kê doanh số theo khoảng thời gian và theo nhà hàng. | P1 |
| **FR-A10** | Quản trị Dữ liệu RecSys | Xem tổng số tương tác ghi nhận, kích hoạt Re-training, xem điểm benchmark model hiện tại. | P0 |

### 4.3. Phân hệ Hệ thống Gợi ý (Recommendation Engine)

| Mã FR | Tên chức năng | Mô tả chi tiết | Mức ưu tiên |
| :--- | :--- | :--- | :--- |
| **FR-R01** | Content-Based Filtering | Khuyến nghị dựa trên độ tương đồng Cosine của TF-IDF/Embedding nguyên liệu + Nutrition vector. | P0 |
| **FR-R02** | Collaborative Filtering | Khuyến nghị dựa trên Item-Item Collaborative Filtering và Matrix Factorization (SVD). | P0 |
| **FR-R03** | Hybrid Recommendation | Kết hợp tuyến tính có trọng số hoặc Switching Hybrid giữa CBF và CF. | P0 |
| **FR-R04** | Cold Start Engine | Cơ chế fallback gợi ý theo onboarding survey hoặc Top Popularity có xét theo danh mục/thời gian. | P0 |
| **FR-R05** | Tương tác ngầm (Implicit Tracker) | Ghi nhận sự kiện click xem món, thời gian xem, thêm giỏ hàng để cập nhật trọng số. | P1 |
| **FR-R06** | Module Đánh giá Offline | Tính toán tự động các chỉ số Precision@K, Recall@K, NDCG@K, MAP@K trên tập Test. | P0 |

---

## 5. ĐẶC TẢ YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

### 5.1. Hiệu năng (Performance)
- **API Response Time**: Thời gian phản hồi cho các API CRUD nghiệp vụ thông thường $P_{95} \le 150\text{ ms}$.
- **Recommendation Latency**: Thời gian suy luận (Inference) Top-K gợi ý $P_{95} \le 200\text{ ms}$. Sử dụng cơ chế Pre-computed Similarity Matrix và caching (Redis hoặc In-memory Cache) cho các truy vấn lặp lại.
- **Frontend Performance**: Điểm Google Lighthouse Performance $\ge 85$, First Contentful Paint (FCP) $\le 1.5\text{ s}$.

### 5.2. Tính mở rộng & Kiến trúc (Scalability & Architecture)
- Áp dụng cấu trúc **Modular Monolith**: Mỗi module (Auth, Foods, Orders, RecSys) có cấu trúc phân tầng rõ ràng (API $\to$ Service $\to$ Repository $\to$ Model/Schema).
- Module Recommendation Engine hoàn toàn độc lập về logic, giao tiếp qua Service Interface hoặc nội bộ qua Event/DTO rõ ràng, sẵn sàng trích xuất thành Microservice độc lập nếu mở rộng quy mô.

### 5.3. Bảo mật (Security)
- Mã hóa mật khẩu bằng thuật toán an toàn (`bcrypt` hoặc `argon2`).
- Cơ chế xác thực phân quyền Stateless thông qua JWT (Access Token thời hạn ngắn 15-30 phút, Refresh Token lưu an toàn).
- Phòng chống các lỗ hổng OWASP Top 10: SQL Injection (SQLAlchemy ORM với parameterized queries), XSS (Sanitize input, React auto-escape), CSRF, Rate Limiting chống spam/DDoS.
- Biến môi trường quản lý tập trung qua `.env`, tuyệt đối không commit secrets lên Git.

### 5.4. Tính toàn vẹn & Khoa học của Dữ liệu (Scientific Integrity & Reproducibility)
- Dữ liệu thực nghiệm phân tách rõ ràng thành tập **Train / Validation / Test** (ví dụ: chia theo thời gian hoặc random stratified 80:10:10 với Random Seed cố định).
- Không giả lập hay làm sai lệch số liệu thực nghiệm. Toàn bộ metric đánh giá được tính toán tự động bằng code Python khách quan.

### 5.5. Khả năng kiểm thử & Bảo trì (Maintainability & Testability)
- Định nghĩa kiểu dữ liệu nghiêm ngặt: Frontend 100% TypeScript (strict mode, không dùng `any`), Backend 100% Pydantic schemas kết hợp Python Type Hints.
- Độ bao phủ kiểm thử (Test Coverage): Tối thiểu $70\%$ cho các Service nghiệp vụ quan trọng (Cart, Order, Payment calculation, Recommendation metrics).

---

## 6. PHÂN TÍCH NGHIỆP VỤ ĐẶT ĐỒ ĂN (ORDERING WORKFLOW)

### 6.1. Vòng đời đơn hàng (Order State Machine)
Đơn hàng được vận hành theo máy trạng thái hữu hạn (FSM) chặt chẽ:

```
 [Tạo đơn hàng] ──► PENDING (Chờ xử lý)
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
   CONFIRMED (Đã xác nhận)       CANCELLED (Hủy đơn)
         │
         ▼
   PREPARING (Đang chuẩn bị)
         │
         ▼
   DELIVERING (Đang giao hàng)
         │
         ▼
   COMPLETED (Hoàn thành) ──► [Mở quyền Đánh giá & Gợi ý phản hồi]
```

**Quy tắc chuyển trạng thái**:
- `PENDING`: Đơn vừa được đặt, hệ thống kiểm tra tồn kho/khả dụng của món ăn. Khách hàng có thể hủy đơn trực tiếp.
- `CONFIRMED`: Nhà hàng/Hệ thống đã nhận đơn. Không thể tự ý hủy nếu không có sự can thiệp của Admin.
- `PREPARING`: Đang chế biến món ăn.
- `DELIVERING`: Đơn vị giao hàng đang trên đường giao.
- `COMPLETED`: Khách hàng đã nhận món và thanh toán thành công. Kích hoạt trigger ghi log tương tác phục vụ Recommender System, cho phép khách hàng đánh giá món ăn.
- `CANCELLED`: Đơn bị hủy (bởi khách hàng ở trạng thái PENDING hoặc bởi Admin kèm lý do).

### 6.2. Quy tắc nghiệp vụ Giỏ hàng & Thanh toán
1. **Chính sách Giỏ hàng (Cart Policy)**:
   - Trong một giỏ hàng, chỉ được phép chứa các món ăn thuộc **cùng một nhà hàng** để đảm bảo tính khả thi trong giao hàng (nếu thêm món từ nhà hàng khác, hệ thống sẽ cảnh báo yêu cầu làm mới giỏ hàng).
   - Kiểm tra trạng thái món ăn (Còn hàng / Tạm ngưng) và biến động giá tại thời điểm mở giỏ hàng và trước khi bấm Đặt hàng.
2. **Quy tắc tính toán tiền**:
   $$\text{Tổng tiền} = \sum (\text{Đơn giá} \times \text{Số lượng}) + \text{Phí giao hàng} - \text{Giá trị giảm giá (Voucher)}$$
3. **Thanh toán**:
   - `COD`: Ghi nhận trạng thái thanh toán `UNPAID`, chuyển sang `PAID` khi đơn hàng chuyển sang `COMPLETED`.
   - `SIMULATED_GATEWAY` (VNPAY/MoMo Sandbox): Chuyển sang `PAID` ngay khi nhận webhook/callback thành công từ cổng thanh toán.

---

## 7. PHÂN TÍCH NGHIỆP VỤ GỢI Ý MÓN ĂN (RECOMMENDATION ARCHITECTURE)

### 7.1. Các điểm chạm người dùng (Recommendation Touchpoints)

| Vị trí (Touchpoint) | Mục tiêu trải nghiệm | Thuật toán áp dụng chính |
| :--- | :--- | :--- |
| **Trang chủ (Home Feed)** | Thu hút người dùng ngay khi vào app, đưa ra thực đơn "Hôm nay ăn gì?" cá nhân hóa. | **Hybrid RecSys** (CF + CBF) hoặc **Popularity + Onboarding** (cho user mới). |
| **Chi tiết món ăn (Food Detail)** | Giúp người dùng khám phá các món ăn tương tự nếu chưa ưng ý món hiện tại. | **Content-Based Filtering** (Cosine similarity giữa các vector đặc trưng món). |
| **Giỏ hàng (Cart / Checkout)** | Gia tăng giá trị đơn hàng (Cross-sell / Upsell), gợi ý món ăn kèm, đồ uống. | **Association Rule Mining / Item-Item Co-occurrence**. |
| **Kết quả tìm kiếm (Search Ranking)** | Tái sắp xếp kết quả tìm kiếm dựa trên độ phù hợp với khẩu vị cá nhân. | **Contextual Re-ranking**. |

### 7.2. Không gian đặc trưng & Dữ liệu đầu vào (Feature Engineering)
Dữ liệu phục vụ gợi ý được thu thập và tiền xử lý thành các nhóm:
1. **Dữ liệu Tương tác Rõ ràng (Explicit Feedback)**:
   - Đánh giá sao ($r_{u, i} \in [1, 5]$).
   - Đánh dấu yêu thích ($f_{u, i} \in \{0, 1\}$).
2. **Dữ liệu Tương tác Ngầm định (Implicit Feedback)**:
   - Tần suất đặt món trong quá khứ ($c_{u, i} \in \mathbb{N}$).
   - Lượt click xem chi tiết ($v_{u, i}$).
   - Hành vi thêm vào giỏ hàng nhưng chưa mua.
   - Trọng số tương tác tổng hợp:
     $$w_{u, i} = \alpha \cdot r_{u, i} + \beta \cdot c_{u, i} + \gamma \cdot f_{u, i} + \delta \cdot v_{u, i}$$
3. **Đặc trưng Món ăn (Item Metadata)**:
   - Textual/Categorical: Tên món, danh mục chính, nguyên liệu chính $\to$ Vector hóa bằng **TF-IDF**.
   - Nutrition Vector: $[\text{Calories}, \text{Protein}, \text{Fat}, \text{Carbohydrates}]$, chuẩn hóa Min-Max Scaling:
     $$\mathbf{x}_{\text{nutr}} = \left[\frac{C - C_{\min}}{C_{\max} - C_{\min}}, \dots \right]$$
   - Price bracket: Phân khoảng giá phù hợp với ngân sách người dùng.

### 7.3. Chiến lược giải quyết Khởi đầu lạnh (Cold Start Strategy)
- **Người dùng mới (New User Cold Start)**:
  - Khi đăng ký, hiển thị màn hình Onboarding chọn nhanh 3 danh mục hoặc 3 món ăn ưa thích + ngân sách bình quân một bữa.
  - Nếu người dùng bỏ qua Onboarding: Fallback sang thuật toán **Top-K Most Popular** lọc theo khu vực địa lý hoặc theo danh mục đang xem.
- **Món ăn mới (New Item Cold Start)**:
  - Món ăn mới chưa có rating/lượt mua sẽ không thể gợi ý bằng Collaborative Filtering.
  - Sử dụng ngay **Content-Based Filtering**: Tính toán tương đồng đặc trưng (nguyên liệu, danh mục, dinh dưỡng) với các món ăn sẵn có để đưa vào cụm "Món ăn tương tự".
  - Áp dụng chiến lược Exploration ($\epsilon$-Greedy): Dành $10\text{ - }15\%$ vị trí hiển thị để giới thiệu món mới đến người dùng phù hợp.

### 7.4. Phương pháp Đánh giá Mô hình (Offline Metrics)
Hệ thống đo lường độ chính xác trên tập Test thông qua:
- **$Precision@K$**: Tỷ lệ các món được gợi ý nằm trong tập món thực tế người dùng yêu thích/đã đặt:
  $$Precision@K = \frac{|\text{Recommended}_K \cap \text{Relevant}|}{K}$$
- **$Recall@K$**: Tỷ lệ các món người dùng thích được hệ thống tìm ra:
  $$Recall@K = \frac{|\text{Recommended}_K \cap \text{Relevant}|}{|\text{Relevant}|}$$
- **$F1\text{-}score@K$**: Trung bình điều hòa giữa Precision và Recall:
  $$F1@K = 2 \cdot \frac{Precision@K \cdot Recall@K}{Precision@K + Recall@K}$$
- **$NDCG@K$ (Normalized Discounted Cumulative Gain)**: Đánh giá chất lượng thứ hạng gợi ý (món người dùng quan tâm nhất có xuất hiện ở vị trí đầu hay không).
- **$Coverage$**: Tỷ lệ phần trăm các món ăn trong toàn bộ danh mục có thể được hệ thống đưa vào danh sách gợi ý (tránh thiên kiến chỉ gợi ý món hot).

---

## 8. XÁC ĐỊNH PHẠM VI MVP (MINIMUM VIABLE PRODUCT SCOPE)

Để đảm bảo dự án hoàn thành đúng tiến độ, chất lượng và đáp ứng chuẩn mực NCKH, hệ thống chia làm 2 giai đoạn:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PHẠM VI MVP (CỐT LÕI)                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Toàn bộ luồng Auth & Quản lý User (Customer, Admin).                │
│ 2. Catalog: Quản lý Nhà hàng, Danh mục, Món ăn, Dinh dưỡng.           │
│ 3. Giỏ hàng & Đơn hàng hoàn chỉnh (COD & Giả lập Thanh toán).          │
│ 4. Tương tác: Rating 1-5 sao, Review, Favorite, Log View/Click.        │
│ 5. Recommendation Engine Baseline:                                     │
│    - Content-Based Filtering (TF-IDF nguyên liệu + Nutrition Vector).  │
│    - Collaborative Filtering (Item-based CF / Matrix Factorization).   │
│    - Hybrid Weighted Recommendation.                                   │
│    - Cold-start Onboarding & Popular fallback.                         │
│ 6. Module Offline Evaluation (Tính toán Precision, Recall, NDCG).       │
│ 7. Giao diện Web Responsive hiện đại (Tailwind + shadcn/ui).           │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (Kế hoạch mở rộng sau MVP)
┌────────────────────────────────────────────────────────────────────────┐
│                        POST-MVP & PHÁT TRIỂN NÂNG CAO                  │
├────────────────────────────────────────────────────────────────────────┤
│ - Deep Learning Recommender (Neural Collaborative Filtering, Two-Tower)│
│ - Tích hợp bản đồ GPS thời gian thực (Google Maps API / OpenStreetMap) │
│ - Đơn vị vận chuyển thứ 3 và Driver App riêng biệt                     │
│ - Hệ thống thông báo đẩy Web Push / WebSocket thời gian thực           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 9. MA TRẬN RỦI RO KỸ THUẬT & BIỆN PHÁP GIẢM THIỂU (TECHNICAL RISKS)

| STT | Rủi ro kỹ thuật | Mức độ | Biện pháp kiểm soát & Giảm thiểu |
| :---: | :--- | :---: | :--- |
| **1** | **Dữ liệu thưa thớt (Data Sparsity)**: Hệ thống mới có ít lượt đánh giá và đơn hàng thực tế. | Cao | Sử dụng bộ dữ liệu mẫu chuẩn (benchmark dataset từ Kaggle/Food.com/Yelp Food dataset) kết hợp với dữ liệu tương tác ngầm định (Implicit clicks/favorites). |
| **2** | **Vấn đề Khởi đầu lạnh (Cold Start)**: Người dùng mới hoặc món mới không nhận được gợi ý chính xác. | Cao | Thiết kế luồng Onboarding lấy nhanh sở thích ban đầu; áp dụng Content-Based dựa trên dinh dưỡng và nguyên liệu ngay khi tạo món mới. |
| **3** | **Độ trễ tính toán gợi ý (Inference Latency)**: Tính toán ma trận độ tương đồng trực tiếp tại mỗi request sẽ làm sập API. | Cao | Phân tách ranh giới rõ ràng: Tính toán ma trận tương đồng offline theo Batch/Scheduled Job; API chỉ thực hiện Vector Dot Product hoặc truy vấn Top-K từ cache. |
| **4** | **Phức tạp hóa kiến trúc (Over-engineering)**: Chia nhỏ Microservices quá sớm dẫn đến phân tán tài nguyên và khó debug. | Trung bình | Kiên định áp dụng **Modular Monolith**; chuẩn hóa tầng Service Interface để có thể tách service sau này mà không phải đập bỏ viết lại. |
| **5** | **Xung đột phiên bản thư viện Machine Learning**: Scikit-learn, Pandas, NumPy không tương thích với FastAPI hoặc runtime Python. | Trung bình | Cố định phiên bản thư viện trong `requirements.txt` / `pyproject.toml`, chạy kiểm thử môi trường thông qua Docker Container đồng nhất. |

---

## 10. KẾ HOẠCH CHI TIẾT CÁC PHASE TIẾP THEO (PROJECT ROADMAP)

| Phase | Tên giai đoạn | Mục tiêu chính | Đầu ra (Deliverables) |
| :---: | :--- | :--- | :--- |
| **Phase 0** | **Requirement Analysis** *(Hiện tại)* | Phân tích toàn diện nghiệp vụ, đối tượng, rủi ro, NFR và phạm vi MVP. | Tài liệu `PHASE_0_REQUIREMENT_ANALYSIS.md`. |
| **Phase 1** | **System Architecture** | Thiết kế kiến trúc Modular Monolith, sơ đồ C4 Model, luồng dữ liệu RecSys, thiết kế RESTful API contract. | Tài liệu kiến trúc, sơ đồ C4, API Specification (OpenAPI). |
| **Phase 2** | **UI/UX Design** | Thiết kế Wireframe, cấu trúc màn hình Customer & Admin, thiết lập Design System (shadcn/ui + Tailwind). | Design spec, Theme configuration, Page mockups & Component hierarchy. |
| **Phase 3** | **Database Design** | Xây dựng ERD chuẩn hóa, bảng quan hệ, index tối ưu, script Alembic migrations ban đầu. | Sơ đồ ERD, Data Dictionary, file Migration SQLAlchemy/Alembic. |
| **Phase 4** | **Backend Development** | Phát triển API Modular Monolith: Auth, Users, Foods, Cart, Orders, Admin theo Clean Architecture. | Mã nguồn Backend FastAPI, Unit Tests nghiệp vụ, Swagger UI. |
| **Phase 5** | **Frontend Development** | Xây dựng giao diện Khách hàng & Quản trị viên bằng React, TypeScript, Vite, TanStack Query, Zustand. | Mã nguồn Frontend, Components, State stores, UI Pages. |
| **Phase 6** | **Frontend & Backend Integration**| Kết nối API, kiểm tra luồng hoàn chỉnh từ Đăng ký, Chọn món, Giỏ hàng, Đặt hàng đến Quản trị. | Hệ thống tích hợp End-to-End, hoàn thiện xử lý lỗi và loading states. |
| **Phase 7** | **AI Recommendation Engine** | Hiện thực hóa CBF (Nutrition/TF-IDF), CF, Hybrid, Cold Start Engine và Module đánh giá Benchmark. | Recommendation Service, Model Training Scripts, Báo cáo thực nghiệm khoa học. |
| **Phase 8** | **Testing & Optimization** | Kiểm thử Unit/Integration, kiểm tra bảo mật, tối ưu hóa truy vấn SQL, Caching và đo đạc hiệu năng. | Bộ test pytest/vitest pass 100%, Báo cáo Benchmark độ trễ và Coverage. |
| **Phase 9** | **Documentation & Deployment**| Viết báo cáo NCKH hoàn chỉnh, hướng dẫn triển khai Docker Compose, đóng gói mã nguồn. | Dockerfile, docker-compose.yml, Báo cáo nghiên cứu khoa học hoàn chỉnh. |

---
**Trạng thái**: Hoàn thành Phase 0. Đang chờ xác nhận từ Quản trị / Giảng viên hướng dẫn để chuyển sang **Phase 1: System Architecture**.


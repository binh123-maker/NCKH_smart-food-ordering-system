# TÀI LIỆU PHÁT TRIỂN FRONTEND (PHASE 5 – FRONTEND DEVELOPMENT)

**Dự án**: Online Food Ordering System Integrated with Food Recommendation System  
**Công nghệ**: React 18, TypeScript Strict, Vite, Tailwind CSS, TanStack Query, Zustand, Axios, React Hook Form, Zod, Lucide Icons  
**Trạng thái**: Hoàn thành và vượt qua kiểm thử build production (`tsc && vite build`) 100%.

---

## 1. CẤU TRÚC KIẾN TRÚC FRONTEND

Frontend được thiết kế theo cấu trúc Feature & Modular Component-Driven:

```
frontend/
├── src/
│   ├── assets/              # Static assets & icons
│   ├── components/
│   │   ├── common/          # FoodCard, RestaurantCard, CartConflictModal
│   │   ├── layout/          # CustomerLayout, AdminLayout, Header, Footer, CartDrawer
│   │   └── ui/              # Button, Input, Badge, MacroBadge, MatchScoreIndicator,
│   │                        # StarRating, Skeleton, LoadingSpinner, EmptyState, ErrorState, Modal
│   ├── data/
│   │   └── mockData.ts      # Dữ liệu mẫu chuẩn hóa (MOCK_FOODS, MOCK_RESTAURANTS, MOCK_CATEGORIES, MOCK_ORDERS, MOCK_RECOMMENDATIONS)
│   ├── lib/
│   │   ├── axios.ts         # Axios instance với JWT interceptors và auto token refresh / logout
│   │   └── utils.ts         # Tiện ích cn, formatVND, formatDate
│   ├── pages/               # Toàn bộ 17 màn hình (12 Customer + 5 Admin)
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── RestaurantListingPage.tsx
│   │   ├── FoodListingPage.tsx
│   │   ├── FoodDetailPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── OrderHistoryPage.tsx
│   │   ├── RecommendationPage.tsx
│   │   ├── UserProfilePage.tsx
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminFoodManagementPage.tsx
│   │   ├── AdminOrderManagementPage.tsx
│   │   ├── AdminRestaurantPage.tsx
│   │   └── AdminRecsysPage.tsx
│   ├── routes/
│   │   └── AppRoutes.tsx    # Định tuyến React Router v6 lồng ghép Layouts
│   ├── stores/
│   │   ├── authStore.ts     # Zustand lưu trữ trạng thái đăng nhập & thông tin User
│   │   └── cartStore.ts     # Zustand giỏ hàng với Single Restaurant Conflict Policy
│   ├── types/
│   │   └── index.ts         # Strict TypeScript definitions ánh xạ chuẩn hóa với Backend models
│   ├── App.tsx              # Cấu hình QueryClientProvider và BrowserRouter
│   ├── main.tsx             # Entry point React 18 createRoot
│   └── index.css            # Tailwind CSS direct tokens & animations
├── package.json
├── tsconfig.json            # TypeScript Strict Mode + Vite Client Types
└── vite.config.ts
```

---

## 2. DANH SÁCH MÀN HÌNH VÀ TÍNH NĂNG ĐÃ TRIỂN KHAI

### 2.1. Phân hệ Khách hàng (Customer Interface)
1. **Trang chủ (`HomePage.tsx`)**:
   - Hero Banner với tìm kiếm tức thời món ăn / nhà hàng.
   - Thanh trượt danh mục món ăn (Category Rail).
   - Khối tiêu điểm món ăn AI gợi ý hôm nay (Recommendation Spotlight) hiển thị Match Score và lý do đề xuất.
   - Danh sách món ăn thịnh hành (Trending Foods) và đối tác nhà hàng nổi bật.
2. **Đăng nhập (`LoginPage.tsx`)**:
   - Form xác thực Email & Mật khẩu với Validation, hiển thị tài khoản mẫu (Khách hàng & Quản trị viên).
3. **Đăng ký (`RegisterPage.tsx`)**:
   - Quy trình Onboarding 2 bước: Bước 1 (Tài khoản) $\rightarrow$ Bước 2 (Khảo sát sở thích dinh dưỡng & chế độ ăn: Eat Clean, Thuần chay, Ngân sách mỗi bữa, Calorie mục tiêu).
4. **Danh sách nhà hàng (`RestaurantListingPage.tsx`)**:
   - Danh sách đối tác, thời gian mở cửa, đánh giá sao, khoảng cách vận chuyển.
5. **Danh sách món ăn (`FoodListingPage.tsx`)**:
   - Lọc theo danh mục, mức giá, calorie và phân trang.
6. **Chi tiết món ăn (`FoodDetailPage.tsx`)**:
   - Thư viện ảnh món ăn, thông tin định lượng dinh dưỡng chi tiết (Calories, Protein, Fat, Carbs, Sodium).
   - Danh sách nguyên liệu thành phần (Ingredients).
   - Tùy chỉnh số lượng, ghi chú vào giỏ hàng, đánh giá từ khách hàng.
7. **Tìm kiếm (`SearchPage.tsx`)**:
   - Tìm kiếm từ khóa theo thời gian thực kết hợp lọc nhanh và sắp xếp theo đánh giá / giá bán.
8. **Giỏ hàng (`CartPage.tsx` & `CartDrawer.tsx`)**:
   - Xem nhanh giỏ hàng bằng Drawer trượt từ cạnh phải hoặc trang giỏ hàng chi tiết.
   - Chính sách **Single Restaurant Policy**: Cảnh báo khi người dùng chọn món từ nhà hàng khác và hiển thị Modal xác nhận xóa giỏ cũ.
9. **Thanh toán (`CheckoutPage.tsx`)**:
   - Chọn địa chỉ nhận hàng, chọn phương thức thanh toán (COD, Chuyển khoản QR Momo/VNPAY).
   - Tóm tắt chi phí (Tạm tính + Phí giao hàng + Giảm giá) và tạo đơn hàng.
10. **Lịch sử đơn hàng (`OrderHistoryPage.tsx`)**:
    - Danh sách đơn đặt với mã đơn, thời gian, trạng thái (Chờ xác nhận, Đang chế biến, Đang giao, Hoàn thành), nút đặt lại món.
11. **Giao diện Gợi ý cá nhân hóa (`RecommendationPage.tsx`)**:
    - **Explainable AI UI**: Khối giải thích cơ sở gợi ý (Content-Based theo thói quen dinh dưỡng, Collaborative Filtering từ nhóm khách hàng tương đồng).
    - Hiển thị Match Score (%) và Macro Badges.
    - Bộ lọc theo lượng calo (Dưới 500 kcal, Giàu Protein, Eat Clean).
12. **Hồ sơ cá nhân (`UserProfilePage.tsx`)**:
    - Quản lý thông tin tài khoản, danh sách sổ địa chỉ giao hàng.
    - Trình chỉnh sửa sở thích ẩm thực & mục tiêu dinh dưỡng cá nhân hóa.

### 2.2. Phân hệ Quản trị (Admin Portal)
13. **Bảng điều khiển Quản trị (`AdminDashboardPage.tsx`)**:
    - Thẻ chỉ số KPI (Doanh thu hôm nay, Đơn hàng mới, Người dùng tích cực, Tỷ lệ Click-through RecSys).
    - Banner giám sát sức khỏe mô hình AI Recommendation đang active (`v1.0.4-hybrid`).
    - Bảng giám sát đơn hàng thời gian thực và Top món ăn được gợi ý hiệu quả nhất.
14. **Quản lý Món ăn (`AdminFoodManagementPage.tsx`)**:
    - Bảng danh sách món ăn, tìm kiếm, lọc theo nhà hàng và danh mục.
    - Cập nhật nhanh trạng thái Đang bán / Tạm dừng.
    - Modal thêm mới / chỉnh sửa món ăn với đầy đủ trường Dinh dưỡng (Calories, Protein, Fat, Carbs) phục vụ dữ liệu cho AI Engine.
15. **Quản lý Đơn hàng (`AdminOrderManagementPage.tsx`)**:
    - Giám sát toàn bộ đơn hàng trong hệ thống.
    - Chuyển đổi trạng thái đơn (PENDING $\rightarrow$ PREPARING $\rightarrow$ DELIVERING $\rightarrow$ COMPLETED / CANCELLED).
    - Modal xem chi tiết từng món ăn trong đơn, địa chỉ giao hàng và phương thức thanh toán.
16. **Quản lý Nhà hàng (`AdminRestaurantPage.tsx`)**:
    - Thêm, sửa, xóa đối tác nhà hàng, quản lý giờ mở cửa và thông tin liên hệ.
17. **Giám sát Mô hình AI (`AdminRecsysPage.tsx`)**:
    - Bảng theo dõi các phiên bản mô hình trong Registry (`model_versions`).
    - Hiển thị chi tiết các chỉ số thực nghiệm NCKH: **NDCG@10, Precision@10, Recall@10, MAP@10, Catalog Coverage**.
    - Nút kích hoạt lại quy trình huấn luyện (Retrain Pipeline).

---

## 3. THIẾT KẾ VÀ TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX DESIGN)

- **Bộ màu chủ đạo (Color Palette)**:
  - Primary Accent: Tangerine Orange (`#F97316`) mang lại cảm giác ngon miệng và kích thích đặt hàng.
  - Secondary Health: Emerald Green (`#10B981`) thể hiện tiêu chí dinh dưỡng và thực phẩm sạch.
  - AI Intelligence Accent: Deep Purple (`#8B5CF6`) tạo nhận diện trực quan cho các tính năng gợi ý thông minh.
- **Component System**:
  - `MacroBadge`: Hiển thị định lượng Protein, Fat, Carbs với màu sắc trực quan.
  - `MatchScoreIndicator`: Hiển thị độ phù hợp thuật toán (ví dụ: `98% Phù hợp`).
  - `CartConflictModal`: Bảo vệ toàn vẹn nghiệp vụ đặt món từ một nhà hàng duy nhất.
  - `Modal`, `Skeleton`, `EmptyState`, `ErrorState`: Xử lý đầy đủ mọi trạng thái tải và dữ liệu trống.

---

## 4. KẾT QUẢ KIỂM THỬ VÀ BUILD PRODUCTION

- Trình biên dịch TypeScript: **Strict Mode** (Không có lỗi `any` ngầm định, kiểm tra đầy đủ type checking).
- Lệnh thực thi: `npm --prefix frontend run build` (`tsc && vite build`).
- Kết quả: **Thành công 100%**, tạo các gói tài nguyên tối ưu:
  - `dist/index.html` (0.88 kB)
  - `dist/assets/index-DbBlpIzd.css` (42.68 kB │ gzip: 7.64 kB)
  - `dist/assets/index-Ce8bCwD9.js` (481.52 kB │ gzip: 134.88 kB)
  - Thời gian build: **3.67 giây**.


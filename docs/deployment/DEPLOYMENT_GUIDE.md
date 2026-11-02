# HƯỚNG DẪN CÀI ĐẶT, TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG (DEPLOYMENT GUIDE)

**Đề tài**: Xây dựng hệ thống đặt đồ ăn trực tuyến tích hợp hệ thống gợi ý món ăn (Online Food Ordering System Integrated with Food Recommendation System)  
**Phiên bản**: 1.0.0 (Production-Ready)  

---

## 1. YÊU CẦU TIỀN ĐỀ TRÊN MÁY TÍNH MỚI (PREREQUISITES)

Để triển khai hệ thống từ đầu trên một máy tính mới, cần cài đặt:

| Phần mềm | Phiên bản khuyến nghị | Mục đích |
| :--- | :--- | :--- |
| **Git** | $\ge 2.40$ | Quản lý mã nguồn |
| **Docker Desktop** | $\ge 24.0$ (Docker Compose $\ge 2.20$) | Đóng gói và điều phối container |
| **Python** *(Nếu chạy thủ công)* | $3.12+$ | Môi trường backend & ML |
| **Node.js** *(Nếu chạy thủ công)* | $20.x+$ LTS (kèm npm $\ge 10.x$) | Môi trường frontend ReactJS |

---

## 2. HƯỚNG DẪN KHỞI CHẠY TỪ ĐẦU BẰNG DOCKER COMPOSE (KHUYẾN NGHỊ)

Đây là phương thức nhanh nhất, chuẩn hóa toàn bộ môi trường PostgreSQL 16, FastAPI Backend và Nginx/ReactJS Frontend.

### Bước 1: Sao chép mã nguồn về máy tính
```bash
git clone https://github.com/your-username/food-recsys.git
cd food-recsys
```

### Bước 2: Thiết lập biến môi trường (Environment Variables)
Tạo file `.env` từ file mẫu `.env.example`:
```bash
# Trên Linux / macOS:
cp .env.example .env

# Trên Windows PowerShell:
Copy-Item .env.example .env
```
> [!IMPORTANT]
> Mở file `.env` và thay đổi các giá trị mặc định:
> - `POSTGRES_PASSWORD`: Đặt mật khẩu cơ sở dữ liệu mạnh.
> - `SECRET_KEY`: Tạo một chuỗi ngẫu nhiên bí mật cho JWT tokens (VD: chạy `openssl rand -hex 32` để sinh khóa).

### Bước 3: Khởi tạo và khởi chạy Containers
```bash
# Build images và khởi chạy ngầm tất cả các dịch vụ (PostgreSQL, Backend, Frontend)
docker compose up -d --build
```

### Bước 4: Khởi tạo cơ sở dữ liệu & Nạp dữ liệu khoa học ban đầu (Database Seeding)
Khi các container đã ở trạng thái `healthy`, chạy lệnh nạp dữ liệu và đăng ký mô hình AI vào PostgreSQL:
```bash
docker compose exec backend python -m app.recsys.scripts.sync_to_database
```

### Bước 5: Truy cập hệ thống
- **Giao diện Khách hàng & Quản trị**: `http://localhost` (Port 80)
- **FastAPI OpenAPI Interactive Swagger**: `http://localhost/docs` hoặc `http://localhost:8000/docs`
- **Tài khoản quản trị viên mặc định**:
  - Email: `admin@foodrecsys.com`
  - Mật khẩu: `Admin@123456`
- **Tài khoản khách hàng mẫu**:
  - Email: `customer@example.com`
  - Mật khẩu: `Customer@123456`

---

## 3. HƯỚNG DẪN KHỞI CHẠY THỦ CÔNG (BARE-METAL DEVELOPMENT SETUP)

Nếu máy tính không có Docker daemon, bạn có thể chạy trực tiếp bằng Python và Node.js cục bộ:

### Bước 1: Thiết lập Backend (FastAPI + RecSys)
```bash
cd backend

# 1. Tạo môi trường ảo Python
python -m venv .venv

# Kích hoạt môi trường ảo:
# Trên Windows PowerShell:
.venv\Scripts\Activate.ps1
# Trên Linux/macOS:
source .venv/bin/activate

# 2. Cài đặt thư viện
pip install --upgrade pip
pip install -r requirements.txt

# 3. Đồng bộ dữ liệu thực nghiệm vào Database cục bộ
python -m app.recsys.scripts.sync_to_database

# 4. Khởi chạy Backend Server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Bước 2: Thiết lập Frontend (ReactJS + Vite)
Mở một cửa sổ Terminal thứ hai:
```bash
cd frontend

# 1. Cài đặt packages
npm install

# 2. Khởi chạy Frontend Development Server
npm run dev
# Truy cập: http://localhost:3000 hoặc http://localhost:5173
```

---

## 4. TẬP LỆNH KIỂM TRA HỆ THỐNG (HEALTH & STATUS COMMANDS)

### 4.1. Kiểm tra trạng thái các Container
```bash
# Xem danh sách container và health status
docker compose ps

# Xem tài nguyên tiêu thụ (CPU, RAM)
docker stats --no-stream
```

### 4.2. Kiểm tra Logs thời gian thực
```bash
# Xem logs toàn bộ hệ thống
docker compose logs -f

# Xem riêng logs backend
docker compose logs -f backend

# Xem riêng logs database
docker compose logs -f postgres
```

### 4.3. Kiểm tra Healthcheck Endpoint
```bash
# Kiểm tra máy chủ Backend
curl -I http://localhost:8000/health

# Kiểm tra phản hồi API Gợi ý món ăn
curl -s http://localhost:8000/api/v1/recommendations/home-feed?limit=2
```

---

## 5. QUY TRÌNH SAO LƯU VÀ PHỤC HỒI DATABASE (BACKUP & DISASTER RECOVERY)

### 5.1. Sao lưu Cơ sở dữ liệu (Database Backup)
Tạo bản sao lưu toàn diện dạng file nén SQL có đánh dấu thời gian:

```bash
# 1. Tạo thư mục chứa bản sao lưu
mkdir -p backups

# 2. Xuất dữ liệu từ PostgreSQL container bằng pg_dump (Đổi biến phù hợp với .env)
# Trên Linux/macOS/Git Bash:
docker compose exec -T postgres pg_dump -U recsys_user -d food_recsys -F c > backups/backup_$(date +%Y%m%d_%H%M%S).dump

# Trên Windows PowerShell:
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
docker compose exec -T postgres pg_dump -U recsys_user -d food_recsys -F c > "backups\backup_$timestamp.dump"
```

### 5.2. Phục hồi Cơ sở dữ liệu (Database Restore)
Khi gặp sự cố hoặc cần khôi phục dữ liệu trên máy tính mới:

```bash
# 1. Khởi động PostgreSQL container
docker compose up -d postgres

# 2. Phục hồi từ file backup (.dump)
# Trên Linux / macOS:
docker compose exec -T postgres pg_restore -U recsys_user -d food_recsys --clean --if-exists < backups/backup_20261102_120000.dump

# Trên Windows PowerShell:
cmd.exe /c "docker compose exec -T postgres pg_restore -U recsys_user -d food_recsys --clean --if-exists < backups\backup_20261102_120000.dump"
```

### 5.3. Tự động hóa Backup định kỳ (Linux Cronjob)
Để sao lưu tự động hàng ngày lúc 02:00 sáng, thêm vào `crontab -e`:
```cron
0 2 * * * cd /path/to/food-recsys && docker compose exec -T postgres pg_dump -U recsys_user -d food_recsys | gzip > /var/backups/recsys/db_$(date +\%Y\%m\%d).sql.gz
```


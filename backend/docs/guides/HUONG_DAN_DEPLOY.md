# 🐳 Hướng Dẫn Deploy với Docker - Từng Bước

## 📋 Yêu Cầu Trước Khi Bắt Đầu

- ✅ Docker Desktop đã được cài đặt và đang chạy
- ✅ Ít nhất 4GB RAM trống
- ✅ 10GB dung lượng ổ cứng trống
- ✅ Đã clone/nhận được source code

---

## 🚀 BƯỚC 1: Kiểm Tra Docker

Mở **Command Prompt** (Windows) hoặc **Terminal** (Mac/Linux) và chạy:

```bash
docker --version
docker-compose --version
```

Nếu hiển thị version → ✅ OK, tiếp tục  
Nếu báo lỗi → Cần cài Docker Desktop trước

---

## 📝 BƯỚC 2: Tạo File Cấu Hình `.env`

### 2.1. Tạo file `.env` từ template

**Windows:**
```bash
copy env.example .env
```

**Linux/Mac:**
```bash
cp env.example .env
```

### 2.2. Mở file `.env` và chỉnh sửa

Mở file `.env` bằng Notepad hoặc bất kỳ text editor nào và cập nhật các giá trị:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=your_secure_password_here
MYSQL_DATABASE=tailor_shop
MYSQL_USER=tailor_user
MYSQL_PASSWORD=your_secure_password_here
MYSQL_PORT=3306

# Backend Configuration
BACKEND_PORT=8083
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-characters!!!

# Frontend Configuration
FRONTEND_PORT=80
VITE_API_BASE_URL=http://localhost:8083/api/v1

# Email Configuration (nếu cần)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# AWS S3 Configuration (nếu cần)
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=ap-southeast-2
AWS_S3_BASE_URL=https://your-bucket.s3.region.amazonaws.com
```

**⚠️ QUAN TRỌNG:**
- Đổi `MYSQL_ROOT_PASSWORD` thành mật khẩu mạnh
- Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên dài (ít nhất 32 ký tự)
- Các giá trị khác có thể giữ mặc định nếu chưa cần

**Lưu file lại!**

---

## 🔨 BƯỚC 3: Build Docker Images

### Cách 1: Dùng Script Helper (Khuyên dùng)

**Windows:**
```bash
docker-helper.bat build
```

**Linux/Mac:**
```bash
chmod +x docker-helper.sh
./docker-helper.sh build
```

### Cách 2: Dùng Docker Compose Trực Tiếp

```bash
docker-compose build --no-cache
```

**⏱️ Thời gian:** 5-15 phút (lần đầu tiên sẽ lâu hơn vì phải download images)

**💡 Mẹo:** Nếu build bị lỗi, kiểm tra:
- Docker Desktop đang chạy chưa?
- Có đủ RAM không? (tối thiểu 4GB)
- Internet có ổn định không?

---

## ▶️ BƯỚC 4: Khởi Động Services

### Cách 1: Dùng Script Helper

**Windows:**
```bash
docker-helper.bat start
```

**Linux/Mac:**
```bash
./docker-helper.sh start
```

### Cách 2: Dùng Docker Compose

```bash
docker-compose up -d
```

**Lệnh này sẽ:**
1. ✅ Tạo network cho các containers
2. ✅ Tạo volume cho MySQL database
3. ✅ Khởi động MySQL container
4. ✅ Đợi MySQL sẵn sàng
5. ✅ Khởi động Backend container
6. ✅ Khởi động Frontend container

**⏱️ Thời gian:** 1-3 phút

---

## ✅ BƯỚC 5: Kiểm Tra Services Đã Chạy

### 5.1. Kiểm tra status

**Windows:**
```bash
docker-helper.bat status
```

**Linux/Mac:**
```bash
./docker-helper.sh status
```

Hoặc:
```bash
docker-compose ps
```

**Kết quả mong đợi:**
```
NAME                    STATUS              PORTS
tailor-shop-backend     Up (healthy)        0.0.0.0:8083->8083/tcp
tailor-shop-frontend    Up (healthy)        0.0.0.0:80->80/tcp
tailor-shop-mysql       Up (healthy)        0.0.0.0:3306->3306/tcp
```

### 5.2. Kiểm tra logs (nếu có lỗi)

**Xem logs của tất cả services:**
```bash
docker-compose logs -f
```

**Xem logs của từng service:**
```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# MySQL
docker-compose logs -f mysql
```

**Nhấn `Ctrl+C` để thoát khỏi logs**

---

## 🌐 BƯỚC 6: Truy Cập Ứng Dụng

Mở trình duyệt và truy cập:

### ✅ Frontend (Giao diện người dùng)
```
http://localhost
```
hoặc
```
http://localhost:80
```

### ✅ Backend API
```
http://localhost:8083/api/v1
```

### ✅ Kiểm tra API hoạt động
```
http://localhost:8083/api/v1/health
```
(Nếu có endpoint này)

---

## 🔍 BƯỚC 7: Xử Lý Lỗi (Nếu Có)

### ❌ Lỗi: Port đã được sử dụng

**Triệu chứng:**
```
Error: bind: address already in use
```

**Giải pháp:**
1. Đổi port trong file `.env`:
   ```env
   BACKEND_PORT=8084
   FRONTEND_PORT=8081
   MYSQL_PORT=3307
   ```
2. Lưu file và chạy lại:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### ❌ Lỗi: Backend không kết nối được MySQL

**Triệu chứng:**
```
Connection refused
```

**Giải pháp:**
1. Kiểm tra MySQL đã sẵn sàng:
   ```bash
   docker-compose logs mysql
   ```
2. Đợi thêm 30 giây và restart backend:
   ```bash
   docker-compose restart backend
   ```

### ❌ Lỗi: Frontend không load được

**Triệu chứng:**
- Trang trắng
- 404 Not Found

**Giải pháp:**
1. Rebuild frontend:
   ```bash
   docker-compose build --no-cache frontend
   docker-compose up -d frontend
   ```
2. Kiểm tra logs:
   ```bash
   docker-compose logs frontend
   ```

### ❌ Lỗi: Out of memory

**Triệu chứng:**
```
Killed
```

**Giải pháp:**
1. Tăng RAM cho Docker Desktop:
   - Mở Docker Desktop
   - Settings → Resources → Memory
   - Tăng lên ít nhất 4GB
   - Apply & Restart
2. Restart services:
   ```bash
   docker-compose restart
   ```

---

## 📊 Các Lệnh Quản Lý Thường Dùng

### Dừng Services
```bash
# Windows
docker-helper.bat stop

# Linux/Mac
./docker-helper.sh stop

# Hoặc
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Xem Logs
```bash
# Tất cả
docker-compose logs -f

# Chỉ backend
docker-compose logs -f backend
```

### Vào Container (Debug)
```bash
# Vào backend container
docker-compose exec backend sh

# Vào frontend container
docker-compose exec frontend sh

# Vào MySQL
docker-compose exec mysql mysql -u root -p
```

### Rebuild Tất Cả
```bash
# Windows
docker-helper.bat rebuild

# Linux/Mac
./docker-helper.sh rebuild
```

---

## 💾 Backup Database

### Tạo Backup
```bash
# Windows
docker-helper.bat backup

# Linux/Mac
./docker-helper.sh backup
```

File backup sẽ được lưu với tên: `backup_YYYYMMDD_HHMMSS.sql`

### Restore Backup
```bash
# Windows
docker-helper.bat restore backup_20241230_120000.sql

# Linux/Mac
./docker-helper.sh restore backup_20241230_120000.sql
```

---

## 🚀 Deploy Production

### 1. Cập nhật `.env` với giá trị production

```env
MYSQL_ROOT_PASSWORD=STRONG_PRODUCTION_PASSWORD
JWT_SECRET=STRONG_256_BIT_SECRET_KEY
# ... các giá trị khác
```

### 2. Chạy production mode

```bash
# Windows
docker-helper.bat prod

# Linux/Mac
./docker-helper.sh prod
```

Hoặc:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🧹 Dọn Dẹp (Nếu Cần)

### Xóa tất cả containers và volumes
```bash
# ⚠️ CẢNH BÁO: Sẽ xóa toàn bộ dữ liệu database!
docker-compose down -v
```

### Xóa images
```bash
docker rmi tailor-shop-backend tailor-shop-frontend
```

---

## ✅ Checklist Hoàn Thành

- [ ] Docker Desktop đã cài và chạy
- [ ] Đã tạo file `.env` từ `env.example`
- [ ] Đã cập nhật mật khẩu trong `.env`
- [ ] Đã build images thành công
- [ ] Đã khởi động services
- [ ] Đã kiểm tra status (tất cả đều "Up")
- [ ] Đã truy cập được frontend tại http://localhost
- [ ] Đã truy cập được backend API tại http://localhost:8083/api/v1

---

## 🆘 Cần Hỗ Trợ?

1. **Kiểm tra logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Kiểm tra status:**
   ```bash
   docker-compose ps
   ```

3. **Restart tất cả:**
   ```bash
   docker-compose restart
   ```

4. **Xem tài liệu chi tiết:**
   Đọc file `DOCKER_SETUP.md`

---

## 🎉 Chúc Mừng!

Nếu bạn đã hoàn thành tất cả các bước và truy cập được ứng dụng → **Bạn đã deploy thành công!** 🎊


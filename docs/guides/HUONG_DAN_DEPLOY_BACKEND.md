# 🚀 Hướng Dẫn Deploy Backend

## 📋 Yêu Cầu Trước Khi Deploy

1. ✅ **Docker Desktop đã được cài đặt và đang chạy**
2. ✅ **File `.env` đã được tạo** (từ `env.example`)
3. ✅ **MySQL container đã chạy** (nếu chưa, sẽ tự động start khi deploy backend)

## 🔧 Các Bước Deploy Backend

### Bước 1: Kiểm tra file `.env`

Đảm bảo bạn đã có file `.env` trong thư mục gốc của project. Nếu chưa có:

```bash
# Copy từ env.example
copy env.example .env
```

**⚠️ QUAN TRỌNG:** Kiểm tra các biến môi trường sau trong file `.env`:

- `JWT_SECRET`: Phải có ít nhất 32 ký tự
- `MYSQL_PASSWORD`: Mật khẩu MySQL
- `MYSQL_USER`: Tên user MySQL
- `MYSQL_DATABASE`: Tên database (mặc định: `tailor_shop`)

### Bước 2: Build và Start Backend Container

Có 2 cách để deploy backend:

#### **Cách 1: Deploy tất cả services (MySQL + Backend + Frontend)**

```bash
docker-compose up -d
```

#### **Cách 2: Chỉ deploy Backend (MySQL sẽ tự động start nếu chưa có)**

```bash
# Start MySQL trước (nếu chưa chạy)
docker-compose up -d mysql

# Đợi MySQL sẵn sàng (khoảng 10-20 giây)
# Sau đó start Backend
docker-compose up -d backend
```

#### **Cách 3: Build lại Backend image (nếu có thay đổi code)**

```bash
# Build lại image và start
docker-compose up -d --build backend
```

### Bước 3: Kiểm tra Logs

Sau khi start, kiểm tra logs để đảm bảo backend khởi động thành công:

```bash
# Xem logs real-time
docker-compose logs -f backend

# Hoặc xem logs của tất cả services
docker-compose logs -f
```

**✅ Dấu hiệu Backend đã sẵn sàng:**
- Thấy dòng: `Started TailorShopApplication in X.XXX seconds`
- Không có lỗi `Exception` hoặc `Error`
- Health check trả về thành công

### Bước 4: Kiểm tra Health Check

```bash
# Kiểm tra trạng thái containers
docker-compose ps

# Test API health endpoint
curl http://localhost:8083/api/v1/health
# Hoặc mở trình duyệt: http://localhost:8083/api/v1/health
```

## 🔍 Troubleshooting

### ❌ Lỗi: "JWT secret too short"

**Nguyên nhân:** `JWT_SECRET` trong file `.env` quá ngắn (< 32 ký tự)

**Giải pháp:**
1. Mở file `.env`
2. Tìm dòng `JWT_SECRET=...`
3. Thay bằng một secret dài ít nhất 32 ký tự:
   ```
   JWT_SECRET=my-super-secret-key-12345678901234567890
   ```
4. Rebuild và restart:
   ```bash
   docker-compose up -d --build backend
   ```

### ❌ Lỗi: "Cannot connect to MySQL"

**Nguyên nhân:** MySQL container chưa sẵn sàng hoặc cấu hình sai

**Giải pháp:**
1. Kiểm tra MySQL đã chạy:
   ```bash
   docker-compose ps mysql
   ```
2. Kiểm tra logs MySQL:
   ```bash
   docker-compose logs mysql
   ```
3. Đảm bảo các biến môi trường trong `.env` đúng:
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
4. Restart MySQL:
   ```bash
   docker-compose restart mysql
   ```

### ❌ Lỗi: "Port 8083 already in use"

**Nguyên nhân:** Port 8083 đã được sử dụng bởi process khác

**Giải pháp:**
1. Tìm process đang dùng port 8083:
   ```bash
   # Windows
   netstat -ano | findstr :8083
   ```
2. Hoặc thay đổi port trong file `.env`:
   ```
   BACKEND_PORT=8084
   ```
3. Restart backend:
   ```bash
   docker-compose up -d backend
   ```

### ❌ Lỗi: "Build failed" hoặc "Maven build error"

**Nguyên nhân:** Lỗi compile hoặc dependency

**Giải pháp:**
1. Kiểm tra logs build:
   ```bash
   docker-compose build backend
   ```
2. Xóa cache và build lại:
   ```bash
   docker-compose build --no-cache backend
   docker-compose up -d backend
   ```

### ❌ Backend start nhưng không kết nối được từ Frontend

**Nguyên nhân:** CORS hoặc network configuration

**Giải pháp:**
1. Kiểm tra backend đang chạy:
   ```bash
   curl http://localhost:8083/api/v1/health
   ```
2. Kiểm tra CORS config trong `SecurityConfig.java`
3. Đảm bảo frontend đang dùng đúng API URL:
   - Development: `http://localhost:8083/api/v1`
   - Docker: `/api/v1` (relative path qua Nginx proxy)

## 📊 Kiểm tra Trạng Thái

### Xem trạng thái tất cả containers:

```bash
docker-compose ps
```

**Kết quả mong đợi:**
```
NAME                    STATUS              PORTS
tailor-shop-backend     Up (healthy)        0.0.0.0:8083->8083/tcp
tailor-shop-frontend    Up (healthy)        0.0.0.0:80->80/tcp
tailor-shop-mysql       Up (healthy)        0.0.0.0:3308->3306/tcp
```

### Xem resource usage:

```bash
docker stats
```

### Xem logs của một service cụ thể:

```bash
# Backend logs
docker-compose logs -f backend

# MySQL logs
docker-compose logs -f mysql

# Tất cả logs
docker-compose logs -f
```

## 🔄 Các Lệnh Hữu Ích

### Restart Backend:

```bash
docker-compose restart backend
```

### Stop Backend:

```bash
docker-compose stop backend
```

### Stop tất cả services:

```bash
docker-compose down
```

### Stop và xóa volumes (⚠️ Xóa dữ liệu):

```bash
docker-compose down -v
```

### Rebuild Backend (khi có thay đổi code):

```bash
docker-compose up -d --build backend
```

### Xem logs real-time:

```bash
docker-compose logs -f backend
```

## ✅ Checklist Sau Khi Deploy

- [ ] Backend container đang chạy (`docker-compose ps`)
- [ ] Health check thành công (`curl http://localhost:8083/api/v1/health`)
- [ ] Không có lỗi trong logs (`docker-compose logs backend`)
- [ ] Frontend có thể kết nối đến Backend API
- [ ] Database connection thành công (kiểm tra trong logs)

## 🎯 Kết Quả Mong Đợi

Sau khi deploy thành công:

1. ✅ Backend chạy trên: `http://localhost:8083`
2. ✅ API endpoint: `http://localhost:8083/api/v1`
3. ✅ Health check: `http://localhost:8083/api/v1/health`
4. ✅ Frontend có thể gọi API từ Backend
5. ✅ Database connection hoạt động bình thường

## 📝 Ghi Chú

- Backend sẽ tự động kết nối đến MySQL container qua network `tailor-shop-network`
- Backend sử dụng profile `docker` (từ `application-docker.yml`)
- Upload files sẽ được lưu trong volume: `./tailor_shop/uploads`
- Logs có thể xem bằng: `docker-compose logs -f backend`

---

**Nếu gặp vấn đề, hãy kiểm tra logs và tham khảo các file:**
- `FIX_DOCKER_ERRORS.md` - Các lỗi thường gặp
- `FIX_CORS_AND_API.md` - Vấn đề về CORS và API
- `GIAI_THICH_DOCKER.md` - Giải thích chi tiết về Docker


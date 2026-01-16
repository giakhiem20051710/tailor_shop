# 🔧 Hướng Dẫn Sửa Lỗi Docker

## ❌ Lỗi 1: Frontend Build - npm ci Failed

### Triệu chứng:
```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Invalid: lock file's picomatch@2.3.1 does not satisfy picomatch@4.0.3
```

### Nguyên nhân:
- `package-lock.json` không đồng bộ với `package.json`
- Có conflict về version của `picomatch`

### ✅ Giải pháp đã áp dụng:
Đã cập nhật `my-react-app/Dockerfile` để:
- Thử `npm install --legacy-peer-deps` trước
- Nếu thất bại thì fallback về `npm ci`

### 🔨 Cách sửa thủ công (nếu cần):

**Bước 1:** Vào thư mục frontend
```bash
cd my-react-app
```

**Bước 2:** Xóa lock file và node_modules
```bash
rm package-lock.json
rm -rf node_modules
```

**Bước 3:** Cài đặt lại
```bash
npm install
```

**Bước 4:** Commit lock file mới
```bash
git add package-lock.json
git commit -m "Update package-lock.json"
```

---

## ❌ Lỗi 2: Backend - JwtService Constructor Exception

### Triệu chứng:
```
Error creating bean with name 'jwtService': Constructor threw exception
Failed to instantiate [com.example.tailor_shop.config.security.JwtService]
```

### Nguyên nhân:
- `JWT_SECRET` quá ngắn (< 32 bytes)
- `Keys.hmacShaKeyFor()` yêu cầu secret tối thiểu 32 bytes (256 bits) cho HMAC SHA-256

### ✅ Giải pháp đã áp dụng:
1. **Thêm validation** trong `JwtService` constructor:
   - Kiểm tra secret không null/empty
   - Kiểm tra độ dài >= 32 bytes
   - Error message rõ ràng hơn

2. **Cập nhật `env.example`** với cảnh báo rõ ràng

### 🔨 Cách sửa:

**Bước 1:** Mở file `.env`
```bash
# Windows
notepad .env

# Linux/Mac
nano .env
```

**Bước 2:** Đảm bảo `JWT_SECRET` có ít nhất 32 ký tự:

```env
# ❌ SAI (quá ngắn):
JWT_SECRET=secret123

# ✅ ĐÚNG (>= 32 ký tự):
JWT_SECRET=my-super-secret-key-12345678901234567890

# ✅ ĐÚNG (ví dụ khác):
JWT_SECRET=change-me-256-bit-secret-key-min-length-32-bytes-required!!!
```

**Bước 3:** Lưu file và restart backend
```bash
docker-compose restart backend
```

### 🎲 Tạo JWT Secret ngẫu nhiên:

**Windows PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Online:**
- https://www.random.org/strings/
- Tạo string 32+ ký tự

---

## ✅ Kiểm Tra Sau Khi Sửa

### 1. Kiểm tra Frontend build:
```bash
docker-compose build --no-cache frontend
docker-compose logs frontend
```

### 2. Kiểm tra Backend:
```bash
docker-compose logs backend
```

Tìm dòng:
```
Started TailorShopApplication
```

Nếu thấy → ✅ Backend đã chạy thành công!

### 3. Kiểm tra JWT Secret:
```bash
# Xem environment variable
docker-compose exec backend env | grep JWT_SECRET

# Hoặc xem logs để tìm error message
docker-compose logs backend | grep -i jwt
```

---

## 🚀 Rebuild Tất Cả (Nếu Cần)

Nếu vẫn còn lỗi, rebuild toàn bộ:

```bash
# Dừng tất cả
docker-compose down

# Xóa images cũ
docker rmi tailor-shop-backend tailor-shop-frontend

# Rebuild
docker-compose build --no-cache

# Khởi động lại
docker-compose up -d

# Xem logs
docker-compose logs -f
```

---

## 📋 Checklist

- [ ] `JWT_SECRET` trong `.env` có >= 32 ký tự
- [ ] `package-lock.json` đã được update (nếu có lỗi frontend)
- [ ] Đã restart backend sau khi sửa `.env`
- [ ] Backend logs không còn lỗi JwtService
- [ ] Frontend build thành công

---

## 🆘 Vẫn Còn Lỗi?

### Xem logs chi tiết:
```bash
# Backend
docker-compose logs backend

# Frontend
docker-compose logs frontend

# Tất cả
docker-compose logs
```

### Kiểm tra environment variables:
```bash
docker-compose exec backend env | grep -E "JWT|MYSQL|SPRING"
```

### Restart từ đầu:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

**Chúc bạn sửa thành công! 🎉**


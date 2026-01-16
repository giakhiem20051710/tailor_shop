# 🔧 Sửa Lỗi Port Conflict

## ❌ Lỗi: Port 3306 đã được sử dụng

```
Error: Ports are not available: exposing port TCP 0.0.0.0:3306 -> 0.0.0.0:0: 
listen tcp 0.0.0.0:3306: bind: Only one usage of each socket address 
(protocol/network address/port) is normally permitted.
```

## 🔍 Nguyên nhân

Port 3306 (MySQL) đang được sử dụng bởi:
- MySQL đang chạy ngoài Docker
- Hoặc container MySQL khác đang chạy

## ✅ Giải pháp

### Cách 1: Đổi Port MySQL trong Docker (Khuyên dùng)

**Bước 1:** Mở file `.env`

**Bước 2:** Đổi port MySQL:
```env
# Đổi từ 3306 sang 3307 (hoặc port khác)
MYSQL_PORT=3307
```

**Bước 3:** Lưu và restart:
```bash
docker-compose down
docker-compose up -d
```

**Bước 4:** Cập nhật connection string trong backend (nếu cần):
- Backend trong Docker vẫn dùng `mysql:3306` (tên service)
- Chỉ port bên ngoài thay đổi

### Cách 2: Dừng MySQL ngoài Docker

**Windows:**
```bash
# Dừng MySQL service
net stop MySQL80

# Hoặc dừng MySQL service khác
sc stop MySQL
```

**Kiểm tra MySQL đang chạy:**
```bash
netstat -ano | findstr :3306
```

**Xem process:**
```bash
tasklist | findstr mysql
```

### Cách 3: Dùng MySQL ngoài Docker (Nếu có sẵn)

Nếu bạn đã có MySQL chạy sẵn, có thể cấu hình backend kết nối trực tiếp:

**Bước 1:** Cập nhật `.env`:
```env
# Comment out MySQL service trong docker-compose.yml
# Hoặc cập nhật connection string:
SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/tailor_shop
```

**Bước 2:** Cập nhật `docker-compose.yml`:
```yaml
services:
  backend:
    # ...
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

## 🔍 Kiểm tra Port đang dùng

**Windows:**
```bash
netstat -ano | findstr :3306
```

**Xem process ID:**
```bash
tasklist | findstr <PID>
```

## ✅ Sau khi sửa

**Kiểm tra status:**
```bash
docker-compose ps
```

**Xem logs:**
```bash
docker-compose logs -f backend
```

**Tìm dòng:**
```
Started TailorShopApplication
```

Nếu thấy → ✅ Backend đã chạy thành công!

---

## 📝 Lưu ý

- **Backend trong Docker** kết nối MySQL qua tên service `mysql:3306` (không phải `localhost:3306`)
- **Port trong `.env`** chỉ ảnh hưởng đến việc truy cập từ máy host
- Nếu đổi port, bạn cần dùng `localhost:3307` (hoặc port mới) để kết nối từ máy host

---

**Chúc bạn sửa thành công! 🎉**


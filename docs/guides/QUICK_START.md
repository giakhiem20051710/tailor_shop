# ⚡ Quick Start - Deploy Nhanh

## 🎯 3 Bước Đơn Giản

### 1️⃣ Tạo file `.env`
```bash
# Windows
copy env.example .env

# Linux/Mac
cp env.example .env
```

**Mở `.env` và đổi mật khẩu:**
- `MYSQL_ROOT_PASSWORD` → mật khẩu mạnh
- `JWT_SECRET` → chuỗi ngẫu nhiên dài (32+ ký tự)

### 2️⃣ Build và Start
```bash
# Windows
docker-helper.bat rebuild

# Linux/Mac
chmod +x docker-helper.sh && ./docker-helper.sh rebuild
```

**Hoặc dùng docker-compose:**
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 3️⃣ Truy Cập
- 🌐 **Frontend:** http://localhost
- 🔌 **Backend API:** http://localhost:8083/api/v1

---

## 📋 Lệnh Thường Dùng

| Lệnh | Mô Tả |
|------|-------|
| `docker-compose up -d` | Khởi động services |
| `docker-compose down` | Dừng services |
| `docker-compose logs -f` | Xem logs |
| `docker-compose ps` | Kiểm tra status |
| `docker-compose restart` | Restart services |

---

## 🆘 Lỗi Thường Gặp

**Port đã dùng?** → Đổi port trong `.env`  
**Backend lỗi?** → `docker-compose logs backend`  
**Frontend lỗi?** → `docker-compose build --no-cache frontend`

---

📖 **Xem hướng dẫn chi tiết:** `HUONG_DAN_DEPLOY.md`


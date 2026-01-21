# 🐳 Docker Rebuild Guide - Keep Database

## 📋 Các bước rebuild Docker (giữ database)

### Bước 1: Stop containers
```cmd
docker-compose down
```

### Bước 2: Rebuild backend (no cache)
```cmd
docker-compose build --no-cache backend
```

### Bước 3: Rebuild frontend (no cache)
```cmd
docker-compose build --no-cache frontend
```

### Bước 4: Start lại containers
```cmd
docker-compose up -d
```

### Bước 5: Xem logs
```cmd
docker-compose logs -f backend
```

---

## 🚀 Quick Commands (Copy & Paste)

**Rebuild tất cả trong 1 lệnh:**
```cmd
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

**Chỉ rebuild backend:**
```cmd
docker-compose stop backend && docker-compose build --no-cache backend && docker-compose up -d backend
```

**Chỉ rebuild frontend:**
```cmd
docker-compose stop frontend && docker-compose build --no-cache frontend && docker-compose up -d frontend
```

---

## 🔍 Kiểm tra status

```cmd
# Xem containers đang chạy
docker-compose ps

# Xem logs backend
docker-compose logs -f backend

# Xem logs frontend
docker-compose logs -f frontend

# Xem logs database
docker-compose logs -f mysql
```

---

## ⚠️ Nếu vẫn bị code cũ

### Option 1: Remove images cũ
```cmd
docker rmi tailor-shop-backend tailor-shop-frontend
docker-compose build --no-cache
docker-compose up -d
```

### Option 2: Prune tất cả
```cmd
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Verify code mới đã load

### Check backend version:
```cmd
docker-compose exec backend cat /app/pom.xml | findstr version
```

### Check logs for startup:
```cmd
docker-compose logs backend | findstr "Started"
```

---

## 💾 Database vẫn giữ nguyên

Database được lưu trong volume: `tailor_shop_mysql_data`

Để xem:
```cmd
docker volume ls | findstr mysql
```

**KHÔNG chạy lệnh này nếu muốn giữ data:**
```cmd
docker volume rm tailor_shop_mysql_data
```

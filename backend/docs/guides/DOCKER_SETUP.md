# Hướng dẫn Deploy với Docker

## Yêu cầu

- Docker Engine 20.10+
- Docker Compose 2.0+
- ít nhất 4GB RAM
- 10GB dung lượng ổ cứng

## Cấu trúc Docker

```
.
├── docker-compose.yml          # Cấu hình chính
├── docker-compose.prod.yml     # Cấu hình production
├── .env.example                # Template biến môi trường
├── tailor_shop/
│   ├── Dockerfile              # Backend Dockerfile
│   ├── .dockerignore
│   └── src/main/resources/
│       └── application-docker.yml
└── my-react-app/
    ├── Dockerfile              # Frontend Dockerfile
    ├── .dockerignore
    └── nginx.conf              # Nginx configuration
```

## Cài đặt nhanh

### 1. Tạo file .env

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với các giá trị phù hợp:

```env
MYSQL_ROOT_PASSWORD=your-secure-password
MYSQL_USER=tailor_user
MYSQL_PASSWORD=your-secure-password
JWT_SECRET=your-256-bit-secret-key
```

### 2. Build và chạy

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Kiểm tra

- Frontend: http://localhost
- Backend API: http://localhost:8083/api/v1
- MySQL: localhost:3306

## Các lệnh thường dùng

### Xem logs

```bash
# Tất cả services
docker-compose logs -f

# Chỉ backend
docker-compose logs -f backend

# Chỉ frontend
docker-compose logs -f frontend

# Chỉ MySQL
docker-compose logs -f mysql
```

### Dừng services

```bash
docker-compose down
```

### Dừng và xóa volumes (⚠️ Xóa dữ liệu)

```bash
docker-compose down -v
```

### Rebuild images

```bash
# Rebuild tất cả
docker-compose build --no-cache

# Rebuild chỉ backend
docker-compose build --no-cache backend

# Rebuild chỉ frontend
docker-compose build --no-cache frontend
```

### Restart services

```bash
# Restart tất cả
docker-compose restart

# Restart chỉ backend
docker-compose restart backend
```

### Xem status

```bash
docker-compose ps
```

### Vào container

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# MySQL
docker-compose exec mysql mysql -u root -p
```

## Cấu hình

### Backend

- Port: 8083 (có thể thay đổi trong `.env`)
- Profile: `docker` (sử dụng `application-docker.yml`)
- Health check: `/actuator/health`

### Frontend

- Port: 80 (có thể thay đổi trong `.env`)
- Served by: Nginx
- Health check: `/health`

### MySQL

- Port: 3306 (có thể thay đổi trong `.env`)
- Database: `tailor_shop` (có thể thay đổi trong `.env`)
- Data persistence: Volume `mysql_data`

## Troubleshooting

### Backend không kết nối được MySQL

1. Kiểm tra MySQL đã sẵn sàng:
```bash
docker-compose logs mysql
```

2. Kiểm tra network:
```bash
docker network inspect tailor-shop_tailor-shop-network
```

3. Kiểm tra environment variables:
```bash
docker-compose exec backend env | grep MYSQL
```

### Frontend không load được

1. Kiểm tra build:
```bash
docker-compose logs frontend
```

2. Rebuild frontend:
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Port đã được sử dụng

Thay đổi port trong `.env`:

```env
BACKEND_PORT=8084
FRONTEND_PORT=8080
MYSQL_PORT=3307
```

### Xóa và tạo lại từ đầu

```bash
# Dừng và xóa tất cả
docker-compose down -v

# Xóa images
docker rmi tailor-shop-backend tailor-shop-frontend

# Build lại
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

### 1. Tạo file .env.production

```bash
cp .env.example .env.production
```

Cập nhật các giá trị bảo mật:
- `MYSQL_ROOT_PASSWORD`: Mật khẩu mạnh
- `JWT_SECRET`: Secret key 256-bit
- `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`: AWS credentials
- `MAIL_USERNAME`, `MAIL_PASSWORD`: Email credentials

### 2. Deploy

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Backup database

```bash
# Backup
docker-compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} tailor_shop > backup.sql

# Restore
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} tailor_shop < backup.sql
```

### 4. Monitoring

```bash
# Resource usage
docker stats

# Health checks
docker-compose ps
```

## Security Notes

⚠️ **QUAN TRỌNG cho Production:**

1. **Đổi tất cả mật khẩu mặc định** trong `.env`
2. **Sử dụng JWT_SECRET mạnh** (ít nhất 32 ký tự)
3. **Không commit `.env`** vào git
4. **Sử dụng HTTPS** với reverse proxy (Nginx/Traefik)
5. **Giới hạn network access** cho MySQL
6. **Backup database** định kỳ

## Nâng cao

### Sử dụng với Nginx Reverse Proxy

Tạo `nginx-proxy.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:8083;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
    }
}
```

### Sử dụng với Traefik

Thêm labels vào `docker-compose.yml`:

```yaml
services:
  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.your-domain.com`)"
      - "traefik.http.services.backend.loadbalancer.server.port=8083"
```

## Support

Nếu gặp vấn đề, kiểm tra:
1. Logs: `docker-compose logs`
2. Health checks: `docker-compose ps`
3. Network: `docker network ls`


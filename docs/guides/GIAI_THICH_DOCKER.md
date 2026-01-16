# 📚 Giải Thích Chi Tiết về Docker Deployment

## 🎯 Docker là gì?

**Docker** giống như một "hộp đựng" (container) chứa toàn bộ ứng dụng của bạn:
- ✅ Code
- ✅ Thư viện (libraries)
- ✅ Cấu hình
- ✅ Môi trường chạy

**Lợi ích:**
- 🚀 Chạy giống nhau trên mọi máy (Windows, Mac, Linux)
- 🔒 Cô lập, không ảnh hưởng máy chủ
- 📦 Dễ deploy, dễ quản lý
- ⚡ Nhanh hơn máy ảo (Virtual Machine)

---

## 🏗️ Kiến Trúc Docker trong Dự Án

```
┌─────────────────────────────────────────┐
│         Docker Compose                   │
│  (Quản lý nhiều containers cùng lúc)   │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   MySQL      │  │   Backend    │   │
│  │  Container   │  │  Container   │   │
│  │  (Database)  │  │  (Spring)    │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐                      │
│  │   Frontend   │                      │
│  │  Container   │                      │
│  │  (React)     │                      │
│  └──────────────┘                      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📄 Giải Thích Từng File

### 1️⃣ **Dockerfile** - Công Thức Nấu Ăn

Dockerfile giống như **công thức nấu ăn**, hướng dẫn cách "nấu" (build) một image.

#### **Backend Dockerfile** (`tailor_shop/Dockerfile`)

```dockerfile
# BƯỚC 1: Giai đoạn BUILD (nấu ăn)
FROM maven:3.9-eclipse-temurin-21 AS builder
```
**Giải thích:**
- `FROM` = Bắt đầu từ image có sẵn (giống như lấy nguyên liệu)
- `maven:3.9-eclipse-temurin-21` = Image có Maven + Java 21
- `AS builder` = Đặt tên giai đoạn này là "builder"

```dockerfile
WORKDIR /app
```
**Giải thích:**
- `WORKDIR` = Thư mục làm việc (giống như vào bếp)
- Tất cả lệnh sau sẽ chạy trong `/app`

```dockerfile
# Copy pom.xml và download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B
```
**Giải thích:**
- `COPY pom.xml .` = Copy file `pom.xml` vào container
- `RUN mvn dependency:go-offline` = Tải tất cả thư viện Java về trước
- **Tại sao làm vậy?** → Để cache, lần build sau sẽ nhanh hơn!

```dockerfile
# Copy source code và build
COPY src ./src
RUN mvn clean package -DskipTests
```
**Giải thích:**
- `COPY src ./src` = Copy toàn bộ code vào
- `RUN mvn clean package` = Biên dịch code thành file JAR
- `-DskipTests` = Bỏ qua test (để build nhanh hơn)

```dockerfile
# BƯỚC 2: Giai đoạn RUNTIME (phục vụ)
FROM eclipse-temurin:21-jre-jammy
```
**Giải thích:**
- Bắt đầu image mới, chỉ có Java Runtime (không có Maven)
- **Tại sao?** → Image nhỏ hơn, nhanh hơn!

```dockerfile
# Install curl for health check
RUN apt-get update && apt-get install -y curl
```
**Giải thích:**
- Cài `curl` để kiểm tra sức khỏe ứng dụng

```dockerfile
# Create non-root user
RUN groupadd -r spring && useradd -r -g spring spring
USER spring
```
**Giải thích:**
- Tạo user mới (không phải root)
- **Tại sao?** → Bảo mật! Nếu bị hack, hacker không có quyền root

```dockerfile
# Copy JAR from builder
COPY --from=builder /app/target/*.jar app.jar
```
**Giải thích:**
- `--from=builder` = Lấy file từ giai đoạn "builder"
- Copy file JAR đã build vào image mới

```dockerfile
# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
```
**Giải thích:**
- Lệnh chạy khi container khởi động
- `java -jar app.jar` = Chạy ứng dụng Spring Boot

---

#### **Frontend Dockerfile** (`my-react-app/Dockerfile`)

```dockerfile
# Giai đoạn BUILD
FROM node:20-alpine AS builder
```
**Giải thích:**
- `node:20-alpine` = Node.js 20, bản Alpine (rất nhẹ)
- `alpine` = Linux nhỏ nhất, chỉ ~5MB

```dockerfile
COPY package*.json ./
RUN npm ci
```
**Giải thích:**
- Copy `package.json` và `package-lock.json`
- `npm ci` = Cài đặt chính xác theo `package-lock.json` (nhanh và chính xác hơn `npm install`)

```dockerfile
COPY . .
RUN npm run build
```
**Giải thích:**
- Copy toàn bộ code
- `npm run build` = Biên dịch React thành file tĩnh (HTML, CSS, JS)

```dockerfile
# Giai đoạn PRODUCTION
FROM nginx:alpine
```
**Giải thích:**
- Nginx = Web server nhẹ, nhanh
- Chỉ cần serve file tĩnh, không cần Node.js nữa

```dockerfile
COPY --from=builder /app/dist /usr/share/nginx/html
```
**Giải thích:**
- Copy file đã build vào thư mục Nginx
- `/usr/share/nginx/html` = Nơi Nginx tìm file để serve

```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```
**Giải thích:**
- Copy cấu hình Nginx tùy chỉnh

---

### 2️⃣ **docker-compose.yml** - Điều Phối Viên

Docker Compose giống như **người quản lý**, điều phối nhiều containers cùng lúc.

```yaml
version: '3.8'
```
**Giải thích:**
- Phiên bản format của docker-compose

```yaml
services:
  mysql:
    image: mysql:8.0
```
**Giải thích:**
- `services` = Danh sách các containers
- `mysql` = Tên service
- `image: mysql:8.0` = Dùng image MySQL phiên bản 8.0

```yaml
    container_name: tailor-shop-mysql
```
**Giải thích:**
- Tên container (để dễ nhận biết)

```yaml
    restart: unless-stopped
```
**Giải thích:**
- Tự động khởi động lại nếu container bị dừng
- `unless-stopped` = Trừ khi bạn dừng thủ công

```yaml
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpassword}
```
**Giải thích:**
- `environment` = Biến môi trường
- `${MYSQL_ROOT_PASSWORD:-rootpassword}` = 
  - Lấy từ file `.env`
  - Nếu không có → dùng `rootpassword` (giá trị mặc định)

```yaml
    ports:
      - "${MYSQL_PORT:-3306}:3306"
```
**Giải thích:**
- `ports` = Ánh xạ cổng
- Format: `HOST_PORT:CONTAINER_PORT`
- `3306:3306` = Port 3306 của máy → Port 3306 của container
- Bạn có thể truy cập MySQL từ máy qua `localhost:3306`

```yaml
    volumes:
      - mysql_data:/var/lib/mysql
```
**Giải thích:**
- `volumes` = Lưu trữ dữ liệu
- `mysql_data` = Tên volume (tự động tạo)
- `/var/lib/mysql` = Nơi MySQL lưu database trong container
- **Tại sao?** → Dữ liệu không mất khi container bị xóa!

```yaml
    networks:
      - tailor-shop-network
```
**Giải thích:**
- `networks` = Mạng để các containers giao tiếp
- Tất cả containers cùng network có thể nói chuyện với nhau

```yaml
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
```
**Giải thích:**
- `healthcheck` = Kiểm tra sức khỏe
- Mỗi 10 giây chạy lệnh `mysqladmin ping`
- Nếu OK → Container "healthy"
- Nếu lỗi → Container "unhealthy"

```yaml
  backend:
    depends_on:
      mysql:
        condition: service_healthy
```
**Giải thích:**
- `depends_on` = Phụ thuộc
- Backend **phải đợi** MySQL healthy mới chạy
- **Tại sao?** → Backend cần MySQL, nếu MySQL chưa sẵn sàng → Backend lỗi!

```yaml
    build:
      context: ./tailor_shop
      dockerfile: Dockerfile
```
**Giải thích:**
- `build` = Tự build image (không dùng image có sẵn)
- `context` = Thư mục chứa code
- `dockerfile` = File Dockerfile để build

```yaml
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/tailor_shop
```
**Giải thích:**
- `mysql:3306` = Tên service MySQL (không phải `localhost`!)
- **Tại sao?** → Trong Docker network, dùng tên service để giao tiếp

```yaml
    volumes:
      - ./tailor_shop/uploads:/app/uploads
```
**Giải thích:**
- `./tailor_shop/uploads` = Thư mục trên máy bạn
- `:/app/uploads` = Thư mục trong container
- **Tại sao?** → File upload sẽ lưu trên máy bạn, không mất khi container xóa

---

### 3️⃣ **.env** - File Cấu Hình

File `.env` chứa **biến môi trường** (cấu hình).

```env
MYSQL_ROOT_PASSWORD=my_secure_password
```
**Giải thích:**
- Định nghĩa mật khẩu MySQL
- Docker Compose đọc file này và thay vào `${MYSQL_ROOT_PASSWORD}`

**Tại sao dùng `.env`?**
- ✅ Tách biệt cấu hình khỏi code
- ✅ Dễ thay đổi (không cần sửa code)
- ✅ Bảo mật (không commit vào git)

---

### 4️⃣ **nginx.conf** - Cấu Hình Web Server

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
}
```
**Giải thích:**
- Nginx lắng nghe port 80
- Serve file từ `/usr/share/nginx/html`

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
**Giải thích:**
- **Quan trọng cho React Router!**
- Nếu không tìm thấy file → trả về `index.html`
- **Tại sao?** → React Router dùng JavaScript routing, cần luôn trả về `index.html`

```nginx
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
}
```
**Giải thích:**
- Cache file tĩnh 1 năm
- **Tại sao?** → Tăng tốc độ tải trang

---

## 🔄 Quy Trình Hoạt Động

### Khi bạn chạy `docker-compose up -d`:

```
1. Docker đọc docker-compose.yml
   ↓
2. Tạo network: tailor-shop-network
   ↓
3. Tạo volume: mysql_data
   ↓
4. Khởi động MySQL container
   ├─ Kiểm tra health check
   └─ Đợi MySQL sẵn sàng (healthy)
   ↓
5. Khởi động Backend container
   ├─ Build image (nếu chưa có)
   ├─ Đợi MySQL healthy
   ├─ Kết nối MySQL
   └─ Chạy Spring Boot
   ↓
6. Khởi động Frontend container
   ├─ Build image (nếu chưa có)
   ├─ Build React app
   └─ Chạy Nginx
   ↓
7. Tất cả containers đã chạy! ✅
```

---

## 🎯 Các Khái Niệm Quan Trọng

### **Image vs Container**

- **Image** = Bản thiết kế (như file .exe)
- **Container** = Instance đang chạy (như process)

**Ví dụ:**
```
Image: mysql:8.0 (bản thiết kế)
  ↓ (docker run)
Container: tailor-shop-mysql (đang chạy)
```

### **Volume**

Volume = Lưu trữ dữ liệu **bên ngoài** container.

**Tại sao cần?**
- Container bị xóa → Dữ liệu vẫn còn
- Dễ backup, restore

**Ví dụ:**
```
Container MySQL xóa → Database vẫn còn trong volume mysql_data
```

### **Network**

Network = Mạng riêng để containers giao tiếp.

**Tại sao cần?**
- Containers có thể nói chuyện với nhau
- Cô lập với mạng bên ngoài

**Ví dụ:**
```
Backend → mysql:3306 (trong network)
Backend → localhost:3306 (KHÔNG hoạt động!)
```

### **Multi-stage Build**

Build trong nhiều giai đoạn để giảm kích thước image.

**Ví dụ Backend:**
```
Stage 1 (builder): Maven + Java + Code → Build JAR (2GB)
  ↓
Stage 2 (runtime): Chỉ Java + JAR (500MB)
```

**Lợi ích:**
- Image nhỏ hơn
- Deploy nhanh hơn
- Bảo mật hơn (không có build tools)

---

## 🛠️ Các Lệnh Quan Trọng

### **Build Image**
```bash
docker-compose build
```
**Làm gì:**
- Đọc Dockerfile
- Build image từng service
- Lưu image vào Docker

### **Khởi động Services**
```bash
docker-compose up -d
```
**Làm gì:**
- Tạo containers từ images
- Khởi động tất cả
- `-d` = Chạy nền (detached)

### **Xem Logs**
```bash
docker-compose logs -f backend
```
**Làm gì:**
- Xem output của container
- `-f` = Follow (theo dõi real-time)

### **Dừng Services**
```bash
docker-compose down
```
**Làm gì:**
- Dừng tất cả containers
- Xóa containers
- **KHÔNG** xóa volumes (dữ liệu vẫn còn)

### **Dừng + Xóa Volumes**
```bash
docker-compose down -v
```
**⚠️ CẢNH BÁO:** Xóa cả dữ liệu database!

---

## ❓ Câu Hỏi Thường Gặp

### **Q: Tại sao build lâu?**
A: Lần đầu phải download images và dependencies. Lần sau sẽ nhanh hơn nhờ cache.

### **Q: Container bị dừng, làm sao?**
A: 
```bash
docker-compose logs [service_name]  # Xem lỗi
docker-compose restart [service_name]  # Restart
```

### **Q: Muốn thay đổi code, phải rebuild không?**
A: Có! Code nằm trong image, phải rebuild:
```bash
docker-compose build --no-cache [service]
docker-compose up -d [service]
```

### **Q: Database ở đâu?**
A: Trong volume `mysql_data`. Xem:
```bash
docker volume ls
docker volume inspect tailor-shop_mysql_data
```

### **Q: Làm sao backup database?**
A:
```bash
docker-compose exec mysql mysqldump -u root -p tailor_shop > backup.sql
```

---

## 🎓 Tóm Tắt

1. **Dockerfile** = Công thức build image
2. **docker-compose.yml** = Điều phối nhiều containers
3. **.env** = Cấu hình (mật khẩu, port, ...)
4. **Volume** = Lưu trữ dữ liệu bền vững
5. **Network** = Kết nối containers với nhau

**Luồng hoạt động:**
```
Code → Dockerfile → Image → Container → Running App
```

---

## 📚 Tài Liệu Tham Khảo

- [Docker Official Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- File `DOCKER_SETUP.md` - Hướng dẫn kỹ thuật
- File `HUONG_DAN_DEPLOY.md` - Hướng dẫn từng bước

---

**Chúc bạn hiểu rõ về Docker! 🚀**


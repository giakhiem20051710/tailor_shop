<div align="center">

# 📦 Tài liệu Docker - Tailor Shop Application

<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
<img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot"/>
<img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" alt="Prometheus"/>
<img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" alt="Grafana"/>
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>

<br/>
<br/>

**Tài liệu hướng dẫn chi tiết về Docker và luồng hoạt động của ứng dụng Tailor Shop**

</div>

---

<details>
<summary><h2>📑 Mục lục (Click để mở)</h2></summary>

| # | Nội dung | Mô tả |
|:-:|----------|-------|
| 1 | [Tổng quan về Docker](#1-tổng-quan-về-docker) | Giới thiệu Docker và lợi ích |
| 2 | [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống) | Sơ đồ và mô tả các thành phần |
| 3 | [Dockerfile - Chi tiết](#3-dockerfile---chi-tiết) | Giải thích multi-stage build |
| 4 | [Docker Compose - Chi tiết](#4-docker-compose---chi-tiết) | Cấu hình orchestration |
| 5 | [Luồng hoạt động chi tiết](#5-luồng-hoạt-động-chi-tiết) | Các flow diagrams |
| 6 | [Hướng dẫn sử dụng](#6-hướng-dẫn-sử-dụng) | Commands và examples |
| 7 | [Troubleshooting](#7-troubleshooting) | Xử lý lỗi thường gặp |

</details>

---

<h2 id="1-tổng-quan-về-docker">
  <img src="https://cdn-icons-png.flaticon.com/512/919/919853.png" width="30" style="vertical-align: middle;"/>
  1. Tổng quan về Docker
</h2>

### 1.1 Docker là gì?

<blockquote>
<p>🐳 <strong>Docker</strong> là một nền tảng containerization cho phép đóng gói ứng dụng cùng với tất cả dependencies vào một container. Container hoạt động độc lập và có thể chạy trên bất kỳ môi trường nào có Docker.</p>
</blockquote>

### 1.2 Lợi ích khi sử dụng Docker

<table>
  <thead>
    <tr>
      <th width="150">🎯 Lợi ích</th>
      <th>📝 Mô tả</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>✅ Consistency</strong></td>
      <td>Ứng dụng chạy giống nhau trên mọi môi trường (dev, staging, production)</td>
    </tr>
    <tr>
      <td><strong>🔒 Isolation</strong></td>
      <td>Mỗi container hoạt động độc lập, không ảnh hưởng lẫn nhau</td>
    </tr>
    <tr>
      <td><strong>📦 Portability</strong></td>
      <td>Dễ dàng di chuyển container giữa các máy chủ</td>
    </tr>
    <tr>
      <td><strong>📈 Scalability</strong></td>
      <td>Dễ dàng scale up/down theo nhu cầu</td>
    </tr>
    <tr>
      <td><strong>🔄 Version Control</strong></td>
      <td>Quản lý phiên bản image dễ dàng</td>
    </tr>
  </tbody>
</table>

### 1.3 Các thành phần chính trong dự án

```
📁 tailor_shop/
├── 🐳 Dockerfile              # Định nghĩa cách build image cho Spring Boot app
├── 🎼 docker-compose.yml      # Định nghĩa và orchestrate các services
├── 📊 prometheus.yml          # Cấu hình Prometheus monitoring
├── 📂 src/                    # Source code ứng dụng
└── 📋 pom.xml                 # Maven dependencies
```

---

<h2 id="2-kiến-trúc-hệ-thống">
  🏗️ 2. Kiến trúc hệ thống
</h2>

### 2.1 Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOST MACHINE (Windows)                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         DOCKER ENVIRONMENT                              │ │
│  │                                                                         │ │
│  │  ┌─────────────────────┐         ┌─────────────────────────────────┐  │ │
│  │  │   Prometheus        │         │     Spring Boot App             │  │ │
│  │  │   Container         │         │     (chạy native trên host)     │  │ │
│  │  │                     │         │                                 │  │ │
│  │  │   Port: 9090        │◄────────│     Port: 8083                  │  │ │
│  │  │                     │  scrape │                                 │  │ │
│  │  │   /prometheus       │  metrics│   Endpoints:                    │  │ │
│  │  │                     │         │   - /api/v1/*                   │  │ │
│  │  │   Metrics:          │         │   - /actuator/prometheus        │  │ │
│  │  │   - CPU usage       │         │   - /actuator/health            │  │ │
│  │  │   - Memory          │         │                                 │  │ │
│  │  │   - HTTP requests   │         │                                 │  │ │
│  │  │   - JVM metrics     │         │                                 │  │ │
│  │  └─────────────────────┘         └─────────────────────────────────┘  │ │
│  │           │                                     │                      │ │
│  │           │                                     │                      │ │
│  └───────────┼─────────────────────────────────────┼──────────────────────┘ │
│              │                                     │                        │
│              ▼                                     ▼                        │
│    ┌─────────────────┐                  ┌─────────────────────┐            │
│    │  Browser/Client │                  │   MySQL Database    │            │
│    │  localhost:9090 │                  │   localhost:3306    │            │
│    └─────────────────┘                  └─────────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mô tả các thành phần

<table>
  <thead>
    <tr>
      <th width="200">🔧 Thành phần</th>
      <th>📝 Mô tả</th>
      <th width="100">🔌 Port</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=spring-boot&logoColor=white"/>
        <br/><strong>Spring Boot App</strong>
      </td>
      <td>Ứng dụng chính Tailor Shop</td>
      <td align="center"><code>8083</code></td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Prometheus-E6522C?style=flat-square&logo=prometheus&logoColor=white"/>
        <br/><strong>Prometheus</strong>
      </td>
      <td>Hệ thống monitoring và alerting</td>
      <td align="center"><code>9090</code></td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white"/>
        <br/><strong>MySQL</strong>
      </td>
      <td>Cơ sở dữ liệu</td>
      <td align="center"><code>3306</code></td>
    </tr>
  </tbody>
</table>

---

<h2 id="3-dockerfile---chi-tiết">
  🐳 3. Dockerfile - Chi tiết
</h2>

### 3.1 Multi-stage Build

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 10px; color: white;">

Dockerfile sử dụng **multi-stage build** để tối ưu kích thước image cuối cùng.

</div>

```dockerfile
# ================== STAGE 1: BUILD ==================
FROM maven:3.9-eclipse-temurin-21 AS builder
```

> 💡 **Giải thích:**
> - Sử dụng image Maven với JDK 21
> - Stage này chỉ dùng để build, không có trong image cuối

### 3.2 Chi tiết từng bước

```
┌────────────────────────────────────────────────────────────────────┐
│                        BUILD STAGE (builder)                        │
│                                                                      │
│  Step 1: Set working directory                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  WORKDIR /app                                                 │   │
│  │  → Tạo và chuyển vào thư mục /app                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ▼                                       │
│  Step 2: Copy pom.xml và download dependencies                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  COPY pom.xml .                                               │   │
│  │  RUN mvn dependency:go-offline -B                             │   │
│  │  → Download tất cả dependencies (cached layer)                │   │
│  │  → Tối ưu: nếu pom.xml không đổi, layer này được cache        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ▼                                       │
│  Step 3: Copy source và build                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  COPY src ./src                                               │   │
│  │  RUN mvn clean package -DskipTests                            │   │
│  │  → Compile và đóng gói thành JAR file                         │   │
│  │  → Skip tests để build nhanh hơn                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                       RUNTIME STAGE                                  │
│                                                                      │
│  Step 4: Base image (JRE only - nhẹ hơn JDK)                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  FROM eclipse-temurin:21-jre-jammy                            │   │
│  │  → Chỉ có JRE, không có JDK (giảm ~200MB)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ▼                                       │
│  Step 5: Cài đặt curl cho health check                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  RUN apt-get update && apt-get install -y curl                │   │
│  │  → Cần curl để kiểm tra health của app                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ▼                                       │
│  Step 6: Tạo non-root user (security)                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  RUN groupadd -r spring && useradd -r -g spring spring        │   │
│  │  → Không chạy app với root (security best practice)           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ▼                                       │
│  Step 7: Copy JAR từ build stage                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  COPY --from=builder /app/target/*.jar app.jar                │   │
│  │  → Chỉ copy file JAR, không copy source code                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ▼                                       │
│  Step 8: Cấu hình và chạy                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  USER spring                                                   │   │
│  │  EXPOSE 8083                                                   │   │
│  │  HEALTHCHECK --interval=30s --timeout=3s ...                   │   │
│  │  ENTRYPOINT ["java", "-jar", "app.jar"]                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 3.3 Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8083/api/v1/health || curl -f http://localhost:8083/ || exit 1
```

<table>
  <thead>
    <tr>
      <th width="150">⚙️ Parameter</th>
      <th width="100">📊 Giá trị</th>
      <th>📝 Mô tả</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>--interval</code></td>
      <td align="center"><code>30s</code></td>
      <td>Kiểm tra mỗi 30 giây</td>
    </tr>
    <tr>
      <td><code>--timeout</code></td>
      <td align="center"><code>3s</code></td>
      <td>Timeout cho mỗi lần check</td>
    </tr>
    <tr>
      <td><code>--start-period</code></td>
      <td align="center"><code>60s</code></td>
      <td>Thời gian chờ app khởi động</td>
    </tr>
    <tr>
      <td><code>--retries</code></td>
      <td align="center"><code>3</code></td>
      <td>Số lần retry trước khi đánh dấu unhealthy</td>
    </tr>
  </tbody>
</table>

---

<h2 id="4-docker-compose---chi-tiết">
  🎼 4. Docker Compose - Chi tiết
</h2>

### 4.1 Cấu trúc docker-compose.yml

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest     # Image từ Docker Hub
    container_name: prometheus         # Tên container cố định
    ports:
      - "9090:9090"                    # Map port host:container
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml  # Mount config
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'   # Chỉ định config file
    restart: unless-stopped            # Tự restart nếu crash
```

### 4.2 Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s        # Thu thập metrics mỗi 15 giây
  evaluation_interval: 15s    # Đánh giá rules mỗi 15 giây

scrape_configs:
  - job_name: 'tailor-shop-app'
    metrics_path: '/actuator/prometheus'  # Endpoint metrics của Spring Boot
    static_configs:
      - targets: ['host.docker.internal:8083']  # Kết nối từ container đến host
        labels:
          application: 'tailor-shop'
          environment: 'dev'
```

> ⚠️ **Lưu ý:** `host.docker.internal` là DNS đặc biệt cho phép container truy cập services trên host machine.

---

<h2 id="5-luồng-hoạt-động-chi-tiết">
  🔄 5. Luồng hoạt động chi tiết
</h2>

### 5.1 Luồng Build Docker Image

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER BUILD FLOW                                  │
│                                                                              │
│  Developer                                                                   │
│     │                                                                        │
│     │  $ docker build -t tailor-shop:latest .                               │
│     ▼                                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Docker Engine                                      │ │
│  │                                                                         │ │
│  │  1. Parse Dockerfile                                                    │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │  2. Pull base image (maven:3.9-eclipse-temurin-21)                     │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │  3. Execute BUILD stage:                                                │ │
│  │     ┌─────────────────────────────────────────────────────────────┐    │ │
│  │     │  a. WORKDIR /app                                             │    │ │
│  │     │  b. COPY pom.xml → Cache Layer #1                           │    │ │
│  │     │  c. mvn dependency:go-offline → Cache Layer #2              │    │ │
│  │     │  d. COPY src → Layer #3                                      │    │ │
│  │     │  e. mvn clean package → Layer #4 (JAR created)              │    │ │
│  │     └─────────────────────────────────────────────────────────────┘    │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │  4. Pull runtime base image (eclipse-temurin:21-jre-jammy)             │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │  5. Execute RUNTIME stage:                                              │ │
│  │     ┌─────────────────────────────────────────────────────────────┐    │ │
│  │     │  a. Install curl                                             │    │ │
│  │     │  b. Create spring user                                       │    │ │
│  │     │  c. COPY --from=builder JAR file                            │    │ │
│  │     │  d. Set permissions                                          │    │ │
│  │     │  e. Configure EXPOSE, HEALTHCHECK, ENTRYPOINT               │    │ │
│  │     └─────────────────────────────────────────────────────────────┘    │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │  6. Create final image: tailor-shop:latest                             │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Luồng Docker Compose Up

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DOCKER COMPOSE UP FLOW                                │
│                                                                              │
│  $ docker-compose up -d                                                      │
│     │                                                                        │
│     ▼                                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Parse docker-compose.yml                                            │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │  2. Create network (default bridge network)                             │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │  3. Pull images (if not exists locally)                                 │ │
│  │     • prom/prometheus:latest                                            │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │  4. Create and start containers:                                        │ │
│  │                                                                         │ │
│  │     ┌─────────────────────────────────────────────────────────────┐    │ │
│  │     │  Prometheus Container                                        │    │ │
│  │     │  ─────────────────────                                       │    │ │
│  │     │  • Mount prometheus.yml                                      │    │ │
│  │     │  • Bind port 9090:9090                                       │    │ │
│  │     │  • Start prometheus process                                  │    │ │
│  │     │  • Load scrape configs                                       │    │ │
│  │     │  • Begin scraping metrics from                               │    │ │
│  │     │    host.docker.internal:8083/actuator/prometheus             │    │ │
│  │     └─────────────────────────────────────────────────────────────┘    │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │  5. All containers running                                              │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Luồng Metrics Collection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       METRICS COLLECTION FLOW                                │
│                                                                              │
│  ┌─────────────┐    Every 15s    ┌─────────────────────────────────────────┐│
│  │             │ ◄───────────────│          Prometheus Container           ││
│  │  Spring     │                 │                                         ││
│  │  Boot App   │                 │  1. GET /actuator/prometheus            ││
│  │             │─────────────────▶│                                         ││
│  │  Port:8083  │  metrics data   │  2. Parse Prometheus format             ││
│  │             │                 │                                         ││
│  │  Actuator:  │                 │  3. Store in time-series DB             ││
│  │  /actuator/ │                 │                                         ││
│  │  prometheus │                 │  4. Make available for queries          ││
│  │             │                 │                                         ││
│  └─────────────┘                 └─────────────────────────────────────────┘│
│                                                    │                        │
│                                                    ▼                        │
│                                  ┌─────────────────────────────────────────┐│
│                                  │  Browser: http://localhost:9090         ││
│                                  │                                         ││
│                                  │  • Query metrics                        ││
│                                  │  • View graphs                          ││
│                                  │  • Set up alerts                        ││
│                                  └─────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Luồng Request từ Client

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT REQUEST FLOW                                   │
│                                                                              │
│  ┌─────────────┐                                                            │
│  │   Client    │                                                            │
│  │  (Browser)  │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         │ HTTP Request to localhost:8083/api/v1/products                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     Spring Boot Application                              ││
│  │                                                                          ││
│  │  1. Request hits Tomcat (port 8083)                                      ││
│  │     │                                                                    ││
│  │     ▼                                                                    ││
│  │  2. Security Filter Chain                                                ││
│  │     │ • JWT validation                                                   ││
│  │     │ • CORS check                                                       ││
│  │     ▼                                                                    ││
│  │  3. DispatcherServlet                                                    ││
│  │     │                                                                    ││
│  │     ▼                                                                    ││
│  │  4. Controller Layer                                                     ││
│  │     │ • ProductController                                                ││
│  │     │ • Request mapping                                                  ││
│  │     ▼                                                                    ││
│  │  5. Service Layer                                                        ││
│  │     │ • Business logic                                                   ││
│  │     │ • Validation                                                       ││
│  │     ▼                                                                    ││
│  │  6. Repository Layer                                                     ││
│  │     │ • JPA/Hibernate                                                    ││
│  │     ▼                                                                    ││
│  │  7. MySQL Database                                                       ││
│  │     │ • Query execution                                                  ││
│  │     ▼                                                                    ││
│  │  8. Response back through layers                                         ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│         │                                                                    │
│         │ HTTP Response (JSON)                                              │
│         ▼                                                                    │
│  ┌─────────────┐                                                            │
│  │   Client    │                                                            │
│  │  (Browser)  │                                                            │
│  └─────────────┘                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

<h2 id="6-hướng-dẫn-sử-dụng">
  📖 6. Hướng dẫn sử dụng
</h2>

### 6.1 Khởi động Prometheus (Monitoring)

```powershell
# Chạy Prometheus container
docker-compose up -d

# Kiểm tra container đang chạy
docker ps

# Xem logs
docker-compose logs -f prometheus
```

### 6.2 Build và chạy Spring Boot App trong Docker

```powershell
# Build image
docker build -t tailor-shop:latest .

# Chạy container
docker run -d \
  --name tailor-shop-app \
  -p 8083:8083 \
  -e DB_URL=jdbc:mysql://host.docker.internal:3306/tailor_shop \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=your_password \
  tailor-shop:latest

# Hoặc chạy với tất cả environment variables
docker run -d \
  --name tailor-shop-app \
  -p 8083:8083 \
  --env-file .env \
  tailor-shop:latest
```

### 6.3 Environment Variables

Tạo file `.env` để quản lý biến môi trường:

```env
# Database
DB_URL=jdbc:mysql://host.docker.internal:3306/tailor_shop
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-256-bit-secret-key-min-length-32-bytes

# AWS S3
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_S3_REGION=ap-southeast-2

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### 6.4 Các lệnh Docker thường dùng

```powershell
# === CONTAINER MANAGEMENT ===
# Xem tất cả containers
docker ps -a

# Stop container
docker stop tailor-shop-app

# Start container
docker start tailor-shop-app

# Restart container
docker restart tailor-shop-app

# Remove container
docker rm -f tailor-shop-app

# === LOGS ===
# Xem logs
docker logs tailor-shop-app

# Xem logs theo thời gian thực
docker logs -f tailor-shop-app

# Xem logs 100 dòng gần nhất
docker logs --tail 100 tailor-shop-app

# === SHELL ACCESS ===
# Truy cập vào container
docker exec -it tailor-shop-app bash

# === DOCKER COMPOSE ===
# Khởi động tất cả services
docker-compose up -d

# Dừng tất cả services
docker-compose down

# Xem logs tất cả services
docker-compose logs -f

# Rebuild và khởi động
docker-compose up -d --build

# === IMAGES ===
# Xem tất cả images
docker images

# Remove image
docker rmi tailor-shop:latest

# Remove dangling images
docker image prune

# === CLEANUP ===
# Remove all stopped containers
docker container prune

# Remove all unused data
docker system prune -a
```

---

<h2 id="7-troubleshooting">
  🔧 7. Troubleshooting
</h2>

### 7.1 Container không khởi động được

```powershell
# Kiểm tra logs
docker logs tailor-shop-app

# Kiểm tra health status
docker inspect --format='{{.State.Health.Status}}' tailor-shop-app

# Kiểm tra exit code
docker inspect --format='{{.State.ExitCode}}' tailor-shop-app
```

### 7.2 Không kết nối được database

**Vấn đề:** Container không thể kết nối với MySQL trên host

**Giải pháp:**
```powershell
# Sử dụng host.docker.internal thay vì localhost
DB_URL=jdbc:mysql://host.docker.internal:3306/tailor_shop
```

### 7.3 Port đã được sử dụng

```powershell
# Kiểm tra port đang được sử dụng
netstat -ano | findstr :8083

# Kill process đang dùng port (thay PID)
taskkill /PID <PID> /F
```

### 7.4 Prometheus không scrape được metrics

**Kiểm tra:**
1. Spring Boot app đang chạy trên port 8083
2. Endpoint `/actuator/prometheus` accessible
3. Prometheus config đúng target

```powershell
# Test từ host
curl http://localhost:8083/actuator/prometheus

# Kiểm tra Prometheus targets
# Truy cập http://localhost:9090/targets
```

### 7.5 Image build chậm

**Tối ưu hóa:**
- Sử dụng `.dockerignore` để loại bỏ files không cần thiết
- Tận dụng layer caching (copy pom.xml trước src)
- Sử dụng multi-stage build

Tạo file `.dockerignore`:
```
target/
*.log
.git/
.idea/
*.iml
*.md
!README.md
```

---

<h2 id="8-best-practices">
  ⭐ 8. Best Practices
</h2>

<details open>
<summary><h3>🔒 8.1 Security</h3></summary>

- [x] Sử dụng non-root user trong container
- [x] Không hardcode credentials trong Dockerfile
- [x] Sử dụng environment variables hoặc secrets
- [x] Scan images for vulnerabilities

</details>

<details open>
<summary><h3>🚀 8.2 Performance</h3></summary>

- [x] Sử dụng multi-stage builds
- [x] Tối ưu layer caching
- [x] Sử dụng JRE thay vì JDK trong production
- [x] Sử dụng .dockerignore

</details>

<details open>
<summary><h3>📊 8.3 Monitoring</h3></summary>

- [x] Implement health checks
- [x] Export metrics với Prometheus
- [x] Centralized logging

</details>

---

<h2 id="9-kết-luận">
  📌 9. Kết luận
</h2>

<div align="center">

Docker giúp standardize môi trường development và production, đảm bảo ứng dụng chạy nhất quán trên mọi nền tảng.

</div>

### Tổng kết cấu hình hiện tại:

| Thành phần | Chức năng |
|------------|-----------|
| 🐳 **Dockerfile** | Multi-stage build để tạo image tối ưu |
| 🎼 **Docker Compose** | Orchestrate Prometheus để monitoring |
| 📊 **Prometheus** | Thu thập metrics từ Spring Boot Actuator |

> 💡 **Mở rộng:** Bạn có thể thêm các services như MySQL, Redis, Grafana vào docker-compose.yml để có môi trường development hoàn chỉnh.

---

<div align="center">

### 🚀 Quick Start

</div>

```powershell
# Chạy monitoring (Prometheus) với app chạy local
docker-compose up -d

# Hoặc chạy toàn bộ stack (MySQL + App + Prometheus + Grafana)
docker-compose -f docker-compose.full.yml up -d
```

<div align="center">

| Service | URL |
|---------|-----|
| 🌐 **Application** | http://localhost:8083 |
| 📊 **Prometheus** | http://localhost:9090 |
| 📈 **Grafana** | http://localhost:3000 (admin/admin) |

---

<sub>📅 Last Updated: January 2026 | 📝 Tailor Shop Documentation</sub>

</div>


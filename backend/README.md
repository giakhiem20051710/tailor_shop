# Tailor Shop Backend API

Backend Spring Boot 3.x cho hệ thống quản lý tiệm may "My Hien Tailor".

## 🏗️ Kiến trúc

- **Architecture**: Modules-by-feature (Clean Architecture)
- **Framework**: Spring Boot 3.2.0
- **Database**: MySQL 8.0
- **ORM**: Spring Data JPA (Hibernate)
- **Migration**: Flyway
- **Security**: Spring Security 6 + JWT (Stateless)
- **Validation**: Jakarta Bean Validation

## 📁 Cấu trúc Project

```
com.myhien.tailor
├─ TailorApplication.java
├─ config/
│  ├─ security/          # Spring Security + JWT
│  └─ exception/         # Global Exception Handler
├─ modules/
│  ├─ user/              # User & Role management
│  ├─ order/              # Order management
│  ├─ fabric/             # Fabric inventory
│  ├─ measurement/        # Customer measurements
│  ├─ appointment/        # Appointment scheduling
│  ├─ billing/            # Invoice & Transaction
│  ├─ promotion/          # Promotions
│  └─ review/             # Product reviews
└─ resources/
   ├─ application.yml
   └─ db/migration/       # Flyway migrations
```

## 🚀 Setup

### Yêu cầu
- Java 17+
- Maven 3.6+
- MySQL 8.0+

### Cài đặt

1. **Clone repository**
```bash
cd backend
```

2. **Cấu hình database**
- Tạo database: `CREATE DATABASE tailor;`
- Cập nhật `application.yml` với thông tin database của bạn

3. **Chạy ứng dụng**
```bash
mvn spring-boot:run
```

4. **API sẽ chạy tại**: `http://localhost:8080`

## 📝 API Endpoints

### Orders
- `POST /api/v1/orders` - Tạo đơn hàng
- `GET /api/v1/orders` - Lấy danh sách đơn hàng
- `GET /api/v1/orders/{id}` - Lấy đơn hàng theo ID
- `PUT /api/v1/orders/{id}` - Cập nhật đơn hàng
- `PATCH /api/v1/orders/{id}/status` - Cập nhật trạng thái
- `DELETE /api/v1/orders/{id}` - Xóa đơn hàng (soft delete)

### Users
- `POST /api/v1/users` - Tạo user
- `GET /api/v1/users` - Lấy danh sách users
- `GET /api/v1/users/{id}` - Lấy user theo ID
- `PUT /api/v1/users/{id}` - Cập nhật user
- `DELETE /api/v1/users/{id}` - Xóa user (soft delete)

## 🗄️ Database

- **Migration**: Flyway tự động chạy khi start ứng dụng
- **Schema**: Xem `src/main/resources/db/migration/V1__init.sql`

## 🔒 Security

- JWT-based authentication (sẽ implement sau)
- Password encoding: BCrypt
- CORS enabled cho frontend

## 📦 Dependencies chính

- Spring Boot 3.2.0
- Spring Data JPA
- Spring Security
- MySQL Connector
- Flyway
- Lombok
- Jakarta Bean Validation

## 🧪 Testing

```bash
mvn test
```

## 📄 License

Proprietary - My Hien Tailor Shop


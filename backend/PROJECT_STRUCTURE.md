# Cấu trúc Project - Modules-by-Feature

## 📂 Tổng quan

Dự án sử dụng kiến trúc **Modules-by-Feature** - mỗi feature có đầy đủ các layer riêng biệt.

## 🗂️ Cấu trúc thư mục

```
backend/
├─ src/main/java/com/myhien/tailor/
│  ├─ TailorApplication.java          # Main application class
│  │
│  ├─ config/                           # Global configurations
│  │  ├─ security/
│  │  │  └─ SecurityConfig.java        # Spring Security + JWT config
│  │  └─ exception/
│  │     ├─ GlobalExceptionHandler.java
│  │     ├─ BusinessException.java
│  │     └─ ApiError.java
│  │
│  └─ modules/                          # Feature modules
│     ├─ user/                          # User & Role management
│     │  ├─ controller/
│     │  │  └─ UserController.java
│     │  ├─ service/
│     │  │  ├─ UserService.java
│     │  │  └─ impl/
│     │  │     └─ UserServiceImpl.java
│     │  ├─ repository/
│     │  │  ├─ UserRepository.java
│     │  │  └─ RoleRepository.java
│     │  ├─ domain/
│     │  │  ├─ UserEntity.java
│     │  │  └─ RoleEntity.java
│     │  └─ dto/
│     │     ├─ UserRequestDTO.java
│     │     └─ UserResponseDTO.java
│     │
│     ├─ order/                         # Order management
│     │  ├─ controller/
│     │  │  └─ OrderController.java
│     │  ├─ service/
│     │  │  ├─ OrderService.java
│     │  │  └─ impl/
│     │  │     └─ OrderServiceImpl.java
│     │  ├─ repository/
│     │  │  └─ OrderRepository.java
│     │  ├─ domain/
│     │  │  ├─ OrderEntity.java
│     │  │  └─ OrderStatus.java
│     │  └─ dto/
│     │     ├─ OrderRequestDTO.java
│     │     └─ OrderResponseDTO.java
│     │
│     ├─ fabric/                        # Fabric inventory (TODO)
│     ├─ measurement/                   # Measurements (TODO)
│     ├─ appointment/                   # Appointments (TODO)
│     ├─ billing/                       # Invoice & Transaction (TODO)
│     ├─ promotion/                     # Promotions (TODO)
│     └─ review/                        # Reviews (TODO)
│
└─ src/main/resources/
   ├─ application.yml                   # Application configuration
   └─ db/migration/
      └─ V1__init.sql                   # Database schema
```

## 🎯 Nguyên tắc Clean Code

### 1. **Controller Layer**
- Chỉ nhận/trả DTO, không expose Entity
- Validation với `@Valid`
- Không chứa business logic

### 2. **Service Layer**
- Chứa toàn bộ business logic
- `@Transactional` cho write operations
- Mapping Entity ↔ DTO (thủ công, không dùng MapStruct)
- Throw `BusinessException` khi có lỗi nghiệp vụ

### 3. **Repository Layer**
- Chỉ extend `JpaRepository`
- Custom queries với `@Query` nếu cần
- Filter `is_deleted = false` mặc định

### 4. **Domain Layer (Entity)**
- JPA Entities với `@Entity`
- Không có logic nghiệp vụ
- Soft delete với `is_deleted`

### 5. **DTO Layer**
- Request DTO: Validation với Jakarta Bean Validation
- Response DTO: Record class (Java 17+)
- Không expose internal fields

## 📋 Module Template

Khi tạo module mới, follow structure này:

```
module-name/
├─ controller/
│  └─ ModuleController.java
├─ service/
│  ├─ ModuleService.java
│  └─ impl/
│     └─ ModuleServiceImpl.java
├─ repository/
│  └─ ModuleRepository.java
├─ domain/
│  └─ ModuleEntity.java
└─ dto/
   ├─ ModuleRequestDTO.java
   └─ ModuleResponseDTO.java
```

## 🔄 Flow xử lý request

```
Client Request
    ↓
Controller (validate DTO)
    ↓
Service (business logic + mapping)
    ↓
Repository (database operations)
    ↓
Entity (JPA)
    ↓
Database
```

## ✅ Best Practices

1. **Soft Delete**: Luôn dùng `is_deleted`, không hard delete
2. **Validation**: DTO validation ở Controller level
3. **Exception**: Dùng `BusinessException` cho business errors
4. **Transaction**: `@Transactional` ở Service, không ở Controller
5. **Mapping**: Manual mapping trong Service, không dùng MapStruct
6. **Money**: Dùng `BigDecimal` cho tiền tệ
7. **Time**: Dùng `OffsetDateTime` cho timestamps

## 🚀 Next Steps

1. Implement JWT Authentication
2. Tạo các module còn lại (Fabric, Measurement, Appointment, Billing, Promotion, Review)
3. Add unit tests
4. Add integration tests
5. Docker setup


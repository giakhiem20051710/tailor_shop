# 🗺️ Implementation Roadmap - Backend Tailor Shop

## 📊 Tình Trạng Hiện Tại

### ✅ Đã Hoàn Thành
- [x] Database Schema (V1__init.sql)
- [x] Project Structure (Modules-by-Feature)
- [x] Config (Security, Exception, CORS)
- [x] User Module (Controller, Service, Repository, Entity, DTO)
- [x] Order Module (Controller, Service, Repository, Entity, DTO)
- [x] Common Response/Request utilities
- [x] Global Exception Handler

### 📝 Cần Implement
- [ ] Fabric Module
- [ ] Measurement Module
- [ ] Appointment Module
- [ ] Billing Module (Invoice + Transaction)
- [ ] Product Module
- [ ] Promotion Module
- [ ] Review Module
- [ ] Authentication (JWT)
- [ ] Dashboard APIs

---

## 🎯 Roadmap Implementation

### Phase 1: Core Modules (Tuần 1-2)

#### 1.1. Fabric Module ⭐ (Ưu tiên cao)

**Lý do:** Cần cho Order module (fabric selection)

**Tasks:**
- [ ] FabricEntity
- [ ] FabricRepository
- [ ] FabricService + Implementation
- [ ] FabricController
- [ ] FabricRequestDTO + FabricResponseDTO
- [ ] FabricHoldEntity + Service
- [ ] FabricVisitEntity + Service
- [ ] Stock Management

**API Endpoints:**
```
GET    /api/v1/fabrics
GET    /api/v1/fabrics/{id}
POST   /api/v1/fabrics
PUT    /api/v1/fabrics/{id}
DELETE /api/v1/fabrics/{id}

GET    /api/v1/fabrics/{id}/stock
POST   /api/v1/fabrics/{id}/hold
POST   /api/v1/fabrics/{id}/visit
```

**Dependencies:** None (independent)

---

#### 1.2. Measurement Module

**Tasks:**
- [ ] MeasurementEntity
- [ ] MeasurementRepository
- [ ] MeasurementService + Implementation
- [ ] MeasurementController
- [ ] MeasurementRequestDTO + MeasurementResponseDTO

**API Endpoints:**
```
GET    /api/v1/measurements/order/{orderId}
POST   /api/v1/measurements
PUT    /api/v1/measurements/{id}
DELETE /api/v1/measurements/{id}
```

**Dependencies:** Order module

---

#### 1.3. Appointment Module

**Tasks:**
- [ ] AppointmentEntity
- [ ] AppointmentRepository
- [ ] AppointmentService + Implementation
- [ ] AppointmentController
- [ ] AppointmentRequestDTO + AppointmentResponseDTO

**API Endpoints:**
```
GET    /api/v1/appointments
GET    /api/v1/appointments/{id}
POST   /api/v1/appointments
PUT    /api/v1/appointments/{id}
PATCH  /api/v1/appointments/{id}/status
DELETE /api/v1/appointments/{id}

GET    /api/v1/appointments/order/{orderId}
GET    /api/v1/appointments/tailor/{tailorId}
GET    /api/v1/appointments/date/{date}
```

**Dependencies:** Order, User modules

---

### Phase 2: Business Modules (Tuần 3-4)

#### 2.1. Billing Module

**Tasks:**
- [ ] InvoiceEntity
- [ ] InvoiceRepository
- [ ] InvoiceService + Implementation
- [ ] InvoiceController
- [ ] TransactionEntity
- [ ] TransactionRepository
- [ ] TransactionService + Implementation
- [ ] TransactionController

**API Endpoints:**
```
# Invoice
GET    /api/v1/invoices
GET    /api/v1/invoices/{id}
POST   /api/v1/invoices
PUT    /api/v1/invoices/{id}
PATCH  /api/v1/invoices/{id}/status

# Transaction
GET    /api/v1/invoices/{invoiceId}/transactions
POST   /api/v1/invoices/{invoiceId}/transactions
GET    /api/v1/transactions/{id}
```

**Dependencies:** Order module

---

#### 2.2. Product Module

**Tasks:**
- [ ] ProductEntity
- [ ] ProductRepository
- [ ] ProductService + Implementation
- [ ] ProductController
- [ ] StyleEntity
- [ ] StyleRepository
- [ ] StyleService + Implementation
- [ ] StyleController
- [ ] FavoriteEntity
- [ ] FavoriteRepository
- [ ] FavoriteService + Implementation
- [ ] FavoriteController

**API Endpoints:**
```
# Product
GET    /api/v1/products
GET    /api/v1/products/{key}
POST   /api/v1/products
PUT    /api/v1/products/{key}
DELETE /api/v1/products/{key}

# Style
GET    /api/v1/styles
GET    /api/v1/styles/{id}
POST   /api/v1/styles
PUT    /api/v1/styles/{id}
DELETE /api/v1/styles/{id}

# Favorite
GET    /api/v1/favorites/customer/{customerId}
POST   /api/v1/favorites
DELETE /api/v1/favorites/{id}
```

**Dependencies:** User module

---

#### 2.3. Promotion Module

**Tasks:**
- [ ] PromotionEntity
- [ ] PromotionRepository
- [ ] PromotionService + Implementation
- [ ] PromotionController
- [ ] OrderPromotionEntity (join table)

**API Endpoints:**
```
GET    /api/v1/promotions
GET    /api/v1/promotions/{id}
GET    /api/v1/promotions/code/{code}
POST   /api/v1/promotions
PUT    /api/v1/promotions/{id}
DELETE /api/v1/promotions/{id}

POST   /api/v1/promotions/validate
```

**Dependencies:** Order module

---

### Phase 3: Additional Features (Tuần 5-6)

#### 3.1. Review Module

**Tasks:**
- [ ] ReviewEntity
- [ ] ReviewRepository
- [ ] ReviewService + Implementation
- [ ] ReviewController

**API Endpoints:**
```
GET    /api/v1/reviews
GET    /api/v1/reviews/{id}
GET    /api/v1/reviews/product/{productKey}
GET    /api/v1/reviews/order/{orderId}
POST   /api/v1/reviews
PUT    /api/v1/reviews/{id}
DELETE /api/v1/reviews/{id}
```

**Dependencies:** Product, Order, User modules

---

#### 3.2. Authentication Module

**Tasks:**
- [ ] JWT Service
- [ ] Authentication Controller
- [ ] Login/Register endpoints
- [ ] Password reset flow

**API Endpoints:**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/refresh-token
GET    /api/v1/auth/me
```

**Dependencies:** User module

---

#### 3.3. Dashboard APIs

**Tasks:**
- [ ] Statistics Service
- [ ] Dashboard Controller
- [ ] Analytics endpoints

**API Endpoints:**
```
GET    /api/v1/dashboard/stats
GET    /api/v1/dashboard/orders/summary
GET    /api/v1/dashboard/revenue
GET    /api/v1/dashboard/customers/stats
```

**Dependencies:** All modules

---

## 📋 Template Implementation Cho Mỗi Module

### Step-by-Step Guide

#### Step 1: Entity
```java
@Entity
@Table(name = "module_name")
public class ModuleEntity {
    // Copy từ database schema
    // Add relationships
    // Add soft delete
}
```

#### Step 2: Repository
```java
@Repository
public interface ModuleRepository extends JpaRepository<ModuleEntity, Long> {
    // Custom queries
    Page<ModuleEntity> findByIsDeletedFalse(Pageable pageable);
}
```

#### Step 3: DTOs
```java
// RequestDTO với validation
public record ModuleRequestDTO(
    @NotNull Long field1,
    @Size(max = 100) String field2
) {}

// ResponseDTO
public record ModuleResponseDTO(
    Long id,
    String field1,
    String field2,
    OffsetDateTime createdAt
) {}
```

#### Step 4: Service
```java
@Service
@Transactional
public class ModuleServiceImpl implements ModuleService {
    // Business logic
    // Mapping Entity ↔ DTO
    // Exception handling
}
```

#### Step 5: Controller
```java
@RestController
@RequestMapping("/api/v1/modules")
public class ModuleController {
    // REST endpoints
    // @Valid validation
    // Pagination
}
```

---

## 🎯 Priority Order

### High Priority (Làm trước)
1. ✅ User Module (đã có)
2. ✅ Order Module (đã có)
3. ⭐ Fabric Module (cần cho order)
4. Measurement Module (cần cho order)
5. Appointment Module (cần cho order)

### Medium Priority
6. Billing Module (invoice, transaction)
7. Product Module (catalog)
8. Promotion Module

### Low Priority
9. Review Module
10. Authentication (JWT)
11. Dashboard APIs
12. Loyalty Module (optional)

---

## 📝 Checklist Cho Mỗi Module

Khi implement module mới:

- [ ] **Entity**
  - [ ] Tạo Entity class
  - [ ] Map đúng database schema
  - [ ] Relationships đúng
  - [ ] Soft delete (is_deleted)

- [ ] **Repository**
  - [ ] Extends JpaRepository
  - [ ] Custom queries
  - [ ] Filter is_deleted

- [ ] **DTOs**
  - [ ] RequestDTO với validation
  - [ ] ResponseDTO đầy đủ
  - [ ] Mapping logic

- [ ] **Service**
  - [ ] Interface + Implementation
  - [ ] Business logic
  - [ ] Exception handling
  - [ ] @Transactional

- [ ] **Controller**
  - [ ] REST endpoints
  - [ ] @Valid
  - [ ] Pagination
  - [ ] Filtering

- [ ] **Test**
  - [ ] Test với Postman
  - [ ] Verify response format
  - [ ] Test error cases

---

## 🚀 Quick Start: Implement Fabric Module

### 1. Entity
```java
@Entity
@Table(name = "fabrics")
public class FabricEntity {
    // Copy từ V1__init.sql
}
```

### 2. Repository
```java
@Repository
public interface FabricRepository extends JpaRepository<FabricEntity, Long> {
    Optional<FabricEntity> findByCode(String code);
    Page<FabricEntity> findByIsDeletedFalse(Pageable pageable);
}
```

### 3. DTOs
```java
public record FabricRequestDTO(...) {}
public record FabricResponseDTO(...) {}
```

### 4. Service
```java
@Service
public class FabricServiceImpl implements FabricService {
    // Implement methods
}
```

### 5. Controller
```java
@RestController
@RequestMapping("/api/v1/fabrics")
public class FabricController {
    // REST endpoints
}
```

### 6. Test
```bash
# Test với Postman
GET http://localhost:8080/api/v1/fabrics
```

---

## ✅ Next Steps

1. **Bắt đầu với Fabric Module** (ưu tiên cao)
2. **Follow template** cho mỗi module
3. **Test từng module** trước khi chuyển sang module khác
4. **Commit thường xuyên** (mỗi module xong)

---

## 📚 Resources

- Xem code mẫu: `OrderModule` và `UserModule`
- Database schema: `V1__init.sql`
- Frontend pages: `my-react-app/src/pages/`

**Bắt đầu từ Fabric Module!** 🚀


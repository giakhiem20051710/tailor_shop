# 🏗️ Quy Trình Thiết Kế Backend (Tư duy Senior - Ngắn gọn, hành động được)

## 0) Nguyên tắc cốt lõi
- Thiết kế theo **domain** (modules-by-feature), API hợp đồng rõ (DTO + validation + CommonResponse).
- **DB là nguồn sự thật**: thay đổi Entity phải có migration Flyway; `ddl-auto: validate`.
- **Security by default**: JWT + RBAC; trừ `/api/v1/auth/**` mọi thứ cần token; roles: ADMIN/STAFF/TAILOR/CUSTOMER.
- **Fail fast**: validate sớm, throw code/message rõ, log đủ traceId.
- **Performance**: pagination cho list, tránh N+1, index đúng cột filter, không trả data thừa.

## 1) Nhìn từ frontend → gom module nhanh
- Auth: login/register/forgot/reset
- User: customer/tailor/admin profile, listing
- Order: list/detail/create/update/status/tracking
- Fabric: inventory, hold, visit, stock movements
- Measurement: form, history
- Appointment: schedule, manage
- Billing: invoice, transaction, payment
- Product/Style/Favorite: catalog, style, favorite
- Promotion: promo code
- Review: product/order review
- Dashboard: stats cho admin/customer/tailor

## 2) Map sang modules & entities (từ V1__init.sql)
- user: users, roles
- order: orders
- measurement: measurements
- appointment: appointments
- fabric: fabrics, fabric_holds, fabric_visits, fabric_stock_movements
- billing: invoices, transactions
- product: products, styles, favorites
- promotion: promotions, order_promotions
- review: reviews
- support/optional: loyalty_profiles, referrals, working_slots, audit_log

## 3) Thiết kế API (REST + RBAC)
- Prefix: `/api/v1/...`
- List phải có pagination + filter (status, date range, keyword…)
- Soft-delete: mặc định filter is_deleted = false
- Ví dụ Order:
```
GET    /orders                (page, status, customerId, tailorId, date range)
GET    /orders/{id}
POST   /orders
PUT    /orders/{id}
PATCH  /orders/{id}/status
DELETE /orders/{id}
```
RBAC gợi ý: ADMIN/STAFF full; CUSTOMER chỉ order của mình; TAILOR chỉ order được assign.

## 4) DTO + Validation
- RequestDTO với @NotNull/@Positive/@Future..., ResponseDTO chỉ expose cần thiết.
- Response format dùng CommonResponse (requestTrace, responseStatus, responseData).
- Error code rõ: BUSINESS_ERROR, VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, FORBIDDEN.

## 5) Dòng chảy code
```
Controller (@Valid, RBAC) -> Service (@Transactional, business rules, mapping) -> Repository (query, filter is_deleted) -> DB
```
- Không logic ở Controller; không expose Entity; mapping thủ công ở Service.

## 6) Security & Auth (JWT + role)
- `/api/v1/auth/**` mở; còn lại cần Bearer token.
- CustomUserDetails map role code → ROLE_<CODE>.
- Có thể dùng @PreAuthorize hoặc cấu hình matcher.
- Secret 256-bit, lưu env; không hardcode.

## 7) Database & Migration
- Mọi thay đổi schema → tạo migration mới (không sửa V1).
- Index các cột lọc: status, due_date, customer_id, assigned_tailor_id, code.
- Soft-delete: is_deleted = false trong query mặc định.

## 8) Ưu tiên triển khai (roadmap ngắn)
1) Đã có: user, order, config, schema.
2) Tiếp: fabric → measurement → appointment (phụ thuộc order/user).
3) Sau: billing → product/style/favorite → promotion.
4) Cuối: review → dashboard → loyalty/referral (nếu cần).

## 9) Checklist cho mỗi module
- Entity: đúng schema, quan hệ, is_deleted.
- Repository: JpaRepository, filter is_deleted, pagination.
- DTO: Request + validation; Response đủ data cần.
- Service: business rules, exception code rõ, @Transactional.
- Controller: RESTful, @Valid, RBAC, pagination/filter.
- Tests: ít nhất Postman/manual happy + error; ưu tiên service unit test khi có thời gian.

## 10) Testing & Observability
- Test: happy path + edge cases (not found, deleted, invalid status, permission).
- Log: traceId, user, action, status.
- Swagger/OpenAPI cho contract (springdoc).

## 11) Deployment notes
- Chạy Flyway trước khi start.
- Env per profile: DB url, JWT secret, CORS origins.
- Healthcheck: `/actuator/health`.

## Quick start module mới (rút gọn)
1. Entity từ schema, thêm is_deleted, timestamps.
2. Repository: findByIsDeletedFalse(Pageable), custom query nếu cần.
3. DTO: Request + validation; Response.
4. Service: create/update/find/delete, business rules, mapping.
5. Controller: endpoints REST, @Valid, RBAC, pagination.
6. Test nhanh với Postman/Swagger.

**Bắt đầu ngay với Fabric module theo lộ trình ưu tiên.** 🚀
# 🏗️ Quy Trình Thiết Kế Backend - Từ Frontend & Database

## 📋 Tổng Quan

Hướng dẫn từng bước thiết kế backend Spring Boot dựa trên:
- ✅ Frontend React (đã có)
- ✅ Database Schema (đã có)
- ✅ Business Requirements (từ frontend)

---

## 🎯 BƯỚC 1: Phân Tích Frontend

### 1.1. Liệt Kê Tất Cả Pages/Features

Từ frontend, xác định các tính năng:

```
✅ Authentication
   - Login (admin/staff/tailor/customer): JWT stateless, account status/role check, lockout/rate-limit (tùy chọn).
   - Register: customer self-signup, email/phone unique, hash password, gán role CUSTOMER mặc định.
   - Forgot Password: phát hành OTP/token ngắn hạn (email/SMS), giới hạn tần suất gửi.
   - Reset Password: xác thực token/OTP, bắt buộc đổi password mới (khác cũ), revoke refresh (nếu dùng).

✅ User Management
   - Customer List
   - Tailor List
   - Profile Management

✅ Order Management
   - Order List: filter status/date/customer/tailor, pagination, sort by updated_at.
   - Order Detail: show items, measurements, timeline, payments, attachments.
   - Create Order: validate fabric availability, price calc, deposit rules, assign tailor.
   - Update Order Status: enforce state machine (draft -> confirmed -> in_progress -> fitting -> completed -> cancelled), audit trail.
   - Order Tracking: customer-facing timeline + ETA, push/email/SMS hooks (extensible).

### 📦 API Contract (Order)
```
GET    /api/v1/orders
  query: status, from_date, to_date, customer_id, tailor_id, page, size, sort=updatedAt,desc
  resp: Page<OrderListItem> (id, code, status, total, customer, tailor, updatedAt)

GET    /api/v1/orders/{id}
  resp: OrderDetail (items, measurements, payments, timeline, attachments)

POST   /api/v1/orders
  body: CreateOrderRequest {
    customerId, tailorId?, items[{productId, fabricId?, qty, unitPrice}],
    measurementsId?, // optional ref to saved measurements
    customMeasurements?, // inline measurements
    depositAmount?, note
  }
  rules: validate fabric stock, compute total, require deposit if > threshold, assign tailor
  resp: OrderDetail

PATCH  /api/v1/orders/{id}/status
  body: { status, note? }
  guard: state machine allows only:
    draft -> confirmed -> in_progress -> fitting -> completed
    draft -> cancelled, confirmed -> cancelled, in_progress -> fitting
  side effects: audit log, optional notifications

GET    /api/v1/orders/{id}/tracking
  resp: { timeline[], eta?, currentStatus }
```

### 🧩 Domain Model (tối giản)
```
Order { id, code, status, customer, tailor?, total, deposit, note, updatedAt, createdAt }
OrderItem { id, order, product, fabric?, qty, unitPrice, subtotal }
OrderTimeline { id, order, status, note, createdAt, createdBy }
OrderPayment { id, order, amount, method, status, txnRef, createdAt }
OrderAttachment { id, order, name, url, type }
```

### 🔒 Security & Roles
- Admin/Staff: full CRUD.
- Tailor: chỉ xem các đơn được assign, cập nhật trạng thái khi là owner.
- Customer: chỉ xem đơn của mình, xem tracking, không đổi trạng thái.

### ✅ Validation chính
- Fabric đủ tồn kho; ghi nhận stock movement khi confirm.
- Deposit >= min_deposit (config) khi tạo đơn có giá trị lớn.
- Không cho phép skip state machine hoặc revert completed -> others.

### 🧪 Test nhanh (Postman)
- Create order: thiếu stock -> 400 BusinessException.
- Status update: draft -> fitting (bỏ qua confirmed/in_progress) -> 400.
- Tracking: customer khác gọi -> 403.

✅ Fabric Management
   - Fabric List
   - Fabric Detail
   - Fabric Inventory
   - Fabric Hold/Visit Requests

✅ Measurement
   - Measurement Form: nhập số đo chuẩn (chest, waist, hip, shoulder, sleeve, inseam, outseam, neck, height, weight, fitPreference, note).
   - Measurement Display: xem chi tiết theo khách hàng, đơn hàng, và phiên bản gần nhất.
   - Measurement History: lưu version theo thời gian, cho phép rollback/version view.

### 📦 API Contract (Measurement)
```
GET    /api/v1/measurements?customerId&orderId&page&size
GET    /api/v1/measurements/{id}
POST   /api/v1/measurements            // create new set (admin/staff/tailor)
  body: { customerId, orderId?, chest, waist, hip, shoulder, sleeve, inseam, outseam, neck,
          height, weight, fitPreference, note }
PUT    /api/v1/measurements/{id}       // update -> tạo version mới
  body: same fields
GET    /api/v1/measurements/{id}/history   // list versions
GET    /api/v1/measurements/{id}/latest    // lấy bản mới nhất
```

### 🧩 Domain Model
```
Measurement {
  id, customer (User), order?, version, isLatest, fields..., note,
  createdAt, createdBy
}
```
- Mỗi update tạo bản ghi mới (version++), đánh dấu isLatest=true cho bản mới, bản cũ isLatest=false.
- Gắn `orderId` optional để lưu bộ số đo riêng cho đơn cụ thể (nếu có).

### 🔒 Security & Roles
- Admin/Staff/Tailor: tạo/cập nhật/xem tất cả.
- Customer: chỉ xem số đo của chính mình (list/detail/latest/history), không cập nhật.

### ✅ Validation chính
- Các số đo > 0 và trong khoảng hợp lý (ví dụ 20–300 cm).
- Bắt buộc `customerId`; `orderId` optional.
- Khi có `orderId`, kiểm tra order thuộc khách hàng đó.

### 🧪 Test nhanh (Postman)
- Create measurement với chest=0 -> 400.
- Customer khác gọi GET measurement của người khác -> 403.
- Update measurement: version tăng + isLatest cập nhật; bản cũ không còn isLatest.

✅ Appointment
   - Schedule Page: xem lịch theo ngày/tailor, filter status/type, hiển thị slots available/busy.
   - Appointment Manager: CRUD appointments (fitting/pickup/delivery), assign tailor, check conflicts, auto-notify.
   - Working Slots: quản lý khung giờ làm việc của tailor (ngày/tuần, start/end time, break time, available days).

### 📦 API Contract (Appointment)
```
GET    /api/v1/appointments?tailorId&date&status&type&page&size
GET    /api/v1/appointments/{id}
POST   /api/v1/appointments            // create (admin/staff/tailor)
  body: { orderId, customerId, tailorId?, type, appointmentDate, appointmentTime, notes }
PUT    /api/v1/appointments/{id}       // update
PATCH  /api/v1/appointments/{id}/status  // update status (scheduled/completed/cancelled)
DELETE /api/v1/appointments/{id}       // soft delete

GET    /api/v1/appointments/schedule?tailorId&date&type  // lấy lịch theo tailor/ngày
GET    /api/v1/appointments/available-slots?tailorId&date&duration  // slots còn trống

GET    /api/v1/working-slots?tailorId&date&page&size
GET    /api/v1/working-slots/{id}
POST   /api/v1/working-slots            // tạo khung giờ làm việc
PUT    /api/v1/working-slots/{id}
DELETE /api/v1/working-slots/{id}
```

### 🧩 Domain Model
```
Appointment {
  id, order (Order), customer (User), tailor (User?), type (fitting/pickup/delivery),
  appointmentDate, appointmentTime, status (scheduled/completed/cancelled),
  notes, createdAt, updatedAt
}

WorkingSlot {
  id, tailor (User), dayOfWeek (MON-SUN), startTime, endTime,
  breakStartTime?, breakEndTime?, isActive, effectiveFrom, effectiveTo,
  createdAt, updatedAt
}
```
- Appointment: liên kết với order, có thể assign tailor hoặc để null (chưa assign).
- WorkingSlot: quản lý khung giờ làm việc theo ngày trong tuần, có thể có nhiều slots cho cùng tailor (effectiveFrom/To để override).

### 🔒 Security & Roles
- Admin/Staff: full CRUD appointments + working slots.
- Tailor: xem appointments được assign, cập nhật status, quản lý working slots của mình.
- Customer: chỉ xem appointments của mình, không tạo/cập nhật.

### ✅ Validation chính
- Appointment: kiểm tra conflict với appointments khác (cùng tailor + date + time overlap).
- Appointment: appointmentDate >= today, appointmentTime trong khung giờ làm việc của tailor (nếu có).
- WorkingSlot: startTime < endTime, breakTime trong khoảng start-end nếu có.
- WorkingSlot: không overlap với slots khác của cùng tailor trong cùng dayOfWeek.

### 🧪 Test nhanh (Postman)
- Create appointment: conflict time với appointment khác -> 400.
- Create appointment: time ngoài working slot của tailor -> 400.
- Customer tạo appointment -> 403.
- Schedule: tailor không có working slot -> trả về empty.

✅ Billing
   - Invoice List
   - Invoice Detail
   - Transaction Management
   - Payment (VNPay, MoMo, ZaloPay...)

✅ Product/Catalog
   - Products Page
   - Product Detail
   - Style List
   - Favorites

✅ Promotion
   - Promotions Page
   - Apply Promo Code

✅ Review
   - Product Review
   - Order Review

✅ Dashboard
   - Admin Dashboard
   - Customer Dashboard
   - Tailor Dashboard
```

### 1.2. Xác Định API Endpoints Cần Thiết

Với mỗi page, xác định API cần:

```
Page: Order List
→ GET /api/v1/orders (list, filter, pagination)
→ GET /api/v1/orders/{id} (detail)
→ POST /api/v1/orders (create)
→ PUT /api/v1/orders/{id} (update)
→ PATCH /api/v1/orders/{id}/status (update status)
→ DELETE /api/v1/orders/{id} (soft delete)
```

---

## 🗄️ BƯỚC 2: Phân Tích Database Schema

### 2.1. Xác Định Entities Từ Database

Từ `V1__init.sql`, có 18 bảng:

```
Core Entities:
1. users + roles
2. orders
3. measurements
4. appointments

Product Entities:
5. products
6. styles
7. favorites
8. reviews

Fabric Entities:
9. fabrics
10. fabric_holds
11. fabric_visits
12. fabric_stock_movements

Billing Entities:
13. invoices
14. transactions

Marketing Entities:
15. promotions
16. order_promotions

Support Entities:
17. loyalty_profiles
18. referrals
19. working_slots
20. audit_log
```

### 2.2. Xác Định Relationships

```
users 1..N orders (customer)
users 1..N orders (assigned_tailor)
orders 1..N measurements
orders 1..N appointments
orders 1..1 invoices
invoices 1..N transactions
fabrics 1..N fabric_holds
fabrics 1..N fabric_visits
products 1..N favorites
products 1..N reviews
```

---

## 🏗️ BƯỚC 3: Thiết Kế Modules

### 3.1. Nhóm Entities Thành Modules

Dựa trên business domain:

```
Module: user
├─ Entity: UserEntity, RoleEntity
├─ Features: Authentication, User CRUD, Profile

Module: order
├─ Entity: OrderEntity
├─ Features: Order CRUD, Status Management, Tracking

Module: measurement
├─ Entity: MeasurementEntity
├─ Features: Measurements CRUD, History

Module: appointment
├─ Entity: AppointmentEntity
├─ Features: Schedule, Booking, Management

Module: fabric
├─ Entity: FabricEntity, FabricHoldEntity, FabricVisitEntity
├─ Features: Inventory, Hold/Visit Requests, Stock Management

Module: product
├─ Entity: ProductEntity, StyleEntity
├─ Features: Catalog, Favorites, Styles

Module: billing
├─ Entity: InvoiceEntity, TransactionEntity
├─ Features: Invoice CRUD, Payment Processing

Module: promotion
├─ Entity: PromotionEntity, OrderPromotionEntity
├─ Features: Promo Management, Apply Promo

Module: review
├─ Entity: ReviewEntity
├─ Features: Review CRUD, Rating

Module: loyalty (optional)
├─ Entity: LoyaltyProfileEntity, ReferralEntity
├─ Features: Points, Referrals
```

### 3.2. Xác Định Module Dependencies

```
order → user (customer, tailor)
order → fabric (fabric selection)
order → promotion (apply promo)
measurement → order
appointment → order, user
invoice → order
transaction → invoice
fabric_hold → fabric, user
fabric_visit → fabric, user
favorite → product, user
review → product, order, user
```

---

## 📝 BƯỚC 4: Thiết Kế API Endpoints

### 4.1. RESTful API Design

Cho mỗi module, thiết kế endpoints:

#### Module: Order

```
GET    /api/v1/orders              → List orders (with filter, pagination)
GET    /api/v1/orders/{id}         → Get order detail
POST   /api/v1/orders              → Create order
PUT    /api/v1/orders/{id}         → Update order
PATCH  /api/v1/orders/{id}/status  → Update status
DELETE /api/v1/orders/{id}         → Soft delete

GET    /api/v1/orders/customer/{customerId}  → Get orders by customer
GET    /api/v1/orders/tailor/{tailorId}      → Get orders by tailor
GET    /api/v1/orders/status/{status}        → Get orders by status
```

#### Module: User

```
GET    /api/v1/users                → List users
GET    /api/v1/users/{id}           → Get user detail
POST   /api/v1/users                → Create user
PUT    /api/v1/users/{id}           → Update user
DELETE /api/v1/users/{id}           → Soft delete

POST   /api/v1/auth/login           → Login
POST   /api/v1/auth/register        → Register
POST   /api/v1/auth/forgot-password → Forgot password
POST   /api/v1/auth/reset-password  → Reset password
```

### 4.2. Request/Response DTOs

Cho mỗi endpoint, thiết kế DTO:

```java
// OrderRequestDTO
record OrderRequestDTO(
    @NotNull Long customerId,
    @NotNull Long fabricId,
    @NotNull @FutureOrPresent LocalDate dueDate,
    @NotNull @Positive BigDecimal total,
    String notes
) {}

// OrderResponseDTO
record OrderResponseDTO(
    Long id,
    String code,
    Long customerId,
    String customerName,
    OrderStatus status,
    BigDecimal total,
    LocalDate dueDate,
    OffsetDateTime createdAt
) {}
```

---

## 🔧 BƯỚC 5: Implement Từng Module

### 5.1. Thứ Tự Implement (Quan Trọng!)

**Bước 1: Core Modules (Không phụ thuộc module khác)**
```
1. user (cần đầu tiên)
2. role (cần cho user)
```

**Bước 2: Independent Modules**
```
3. product
4. fabric
5. promotion
```

**Bước 3: Dependent Modules**
```
6. order (phụ thuộc: user, fabric, promotion)
7. measurement (phụ thuộc: order)
8. appointment (phụ thuộc: order, user)
9. billing (phụ thuộc: order)
10. review (phụ thuộc: product, order, user)
```

### 5.2. Template Cho Mỗi Module

```
module-name/
├─ controller/
│  └─ ModuleController.java
│     ├─ GET /api/v1/modules
│     ├─ GET /api/v1/modules/{id}
│     ├─ POST /api/v1/modules
│     ├─ PUT /api/v1/modules/{id}
│     └─ DELETE /api/v1/modules/{id}
│
├─ service/
│  ├─ ModuleService.java (interface)
│  └─ impl/
│     └─ ModuleServiceImpl.java
│        ├─ create()
│        ├─ update()
│        ├─ findById()
│        ├─ findAll()
│        └─ delete()
│
├─ repository/
│  └─ ModuleRepository.java
│     ├─ extends JpaRepository<ModuleEntity, Long>
│     └─ Custom queries nếu cần
│
├─ domain/
│  └─ ModuleEntity.java
│     ├─ @Entity
│     ├─ Fields từ database
│     └─ Relationships
│
└─ dto/
   ├─ ModuleRequestDTO.java
   │  ├─ Validation annotations
   │  └─ Fields cần thiết
   └─ ModuleResponseDTO.java
      └─ Fields trả về cho client
```

---

## 📋 BƯỚC 6: Checklist Implementation

### 6.1. Cho Mỗi Module

- [ ] **Entity**
  - [ ] Tạo Entity class
  - [ ] Map đúng với database schema
  - [ ] Relationships đúng
  - [ ] Soft delete (is_deleted)

- [ ] **Repository**
  - [ ] Extends JpaRepository
  - [ ] Custom queries nếu cần
  - [ ] Filter is_deleted = false

- [ ] **DTO**
  - [ ] RequestDTO với validation
  - [ ] ResponseDTO với đầy đủ thông tin
  - [ ] Mapping Entity ↔ DTO

- [ ] **Service**
  - [ ] Interface + Implementation
  - [ ] Business logic
  - [ ] Validation
  - [ ] Exception handling
  - [ ] @Transactional

- [ ] **Controller**
  - [ ] RESTful endpoints
  - [ ] @Valid validation
  - [ ] Pagination
  - [ ] Filtering
  - [ ] Error handling

- [ ] **Tests** (optional)
  - [ ] Unit tests
  - [ ] Integration tests

---

## 🎯 BƯỚC 7: Implementation Plan

### Phase 1: Foundation (Tuần 1)

```
✅ Đã có:
- user module
- order module
- config (Security, Exception)
- Database schema

📝 Cần làm:
- Test và fix bugs
- Hoàn thiện user/order modules
```

### Phase 2: Core Features (Tuần 2-3)

```
1. fabric module
   ├─ Fabric CRUD
   ├─ Fabric Hold/Visit
   └─ Stock Management

2. measurement module
   ├─ Measurement CRUD
   └─ History

3. appointment module
   ├─ Appointment CRUD
   └─ Schedule Management
```

### Phase 3: Business Features (Tuần 4-5)

```
4. billing module
   ├─ Invoice CRUD
   ├─ Transaction CRUD
   └─ Payment Integration

5. product module
   ├─ Product CRUD
   ├─ Style CRUD
   └─ Favorites

6. promotion module
   ├─ Promotion CRUD
   └─ Apply Promo
```

### Phase 4: Additional Features (Tuần 6+)

```
7. review module
8. loyalty module (optional)
9. Dashboard APIs
10. Reports/Statistics
```

---

## 📝 BƯỚC 8: API Documentation

### 8.1. Swagger/OpenAPI

Thêm Swagger để document API:

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.2.0</version>
</dependency>
```

```java
// SwaggerConfig.java
@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI tailorShopAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Tailor Shop API")
                .version("1.0.0")
                .description("API for My Hien Tailor Shop"));
    }
}
```

Access: `http://localhost:8080/swagger-ui.html`

---

## 🔍 BƯỚC 9: Testing Strategy

### 9.1. Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock
    private OrderRepository orderRepository;
    
    @InjectMocks
    private OrderServiceImpl orderService;
    
    @Test
    void shouldCreateOrder() {
        // Test logic
    }
}
```

### 9.2. Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void shouldCreateOrder() throws Exception {
        mockMvc.perform(post("/api/v1/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content(orderJson))
            .andExpect(status().isCreated());
    }
}
```

---

## ✅ BƯỚC 10: Deployment Checklist

### 10.1. Pre-Deployment

- [ ] All modules implemented
- [ ] All tests passing
- [ ] API documentation complete
- [ ] Database migrations ready
- [ ] Environment configs (dev/staging/prod)
- [ ] Security configured
- [ ] Logging configured
- [ ] Error handling complete

### 10.2. Deployment

- [ ] Database setup
- [ ] Run Flyway migrations
- [ ] Deploy application
- [ ] Health check
- [ ] API testing
- [ ] Monitoring setup

---

## 🎯 Quick Start Guide

### Bắt Đầu Implement Module Mới

1. **Tạo Entity**
```java
@Entity
@Table(name = "module_name")
public class ModuleEntity {
    // Fields từ database
}
```

2. **Tạo Repository**
```java
@Repository
public interface ModuleRepository extends JpaRepository<ModuleEntity, Long> {
    // Custom queries
}
```

3. **Tạo DTOs**
```java
public record ModuleRequestDTO(...) {}
public record ModuleResponseDTO(...) {}
```

4. **Tạo Service**
```java
@Service
public class ModuleServiceImpl implements ModuleService {
    // Business logic
}
```

5. **Tạo Controller**
```java
@RestController
@RequestMapping("/api/v1/modules")
public class ModuleController {
    // REST endpoints
}
```

6. **Test**
```bash
# Test với Postman
POST http://localhost:8080/api/v1/modules
```

---

## 📚 Tài Liệu Tham Khảo

- [Spring Boot Best Practices](https://spring.io/guides)
- [RESTful API Design](https://restfulapi.net/)
- [Database Design](https://www.postgresql.org/docs/current/ddl.html)

---

## ✅ Tóm Tắt

1. **Phân tích Frontend** → Xác định features
2. **Phân tích Database** → Xác định entities
3. **Thiết kế Modules** → Nhóm entities
4. **Thiết kế API** → RESTful endpoints
5. **Implement** → Theo thứ tự dependencies
6. **Test** → Unit + Integration
7. **Document** → Swagger
8. **Deploy** → Production ready

**Bắt đầu từ module đơn giản nhất, làm từng bước một!** 🚀


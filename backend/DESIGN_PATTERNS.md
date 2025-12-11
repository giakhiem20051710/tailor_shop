# 🎨 Design Patterns & Best Practices - Senior Level

## 🏗️ Architectural Patterns

### 1. **Layered Architecture** (Đang dùng)

```
Controller Layer
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database
```

**Nguyên tắc:**
- Controller chỉ nhận request, trả response
- Service chứa business logic
- Repository chỉ data access
- Không skip layer (Controller không gọi Repository trực tiếp)

---

### 2. **DTO Pattern** (Đang dùng)

**Tại sao dùng DTO?**
- ✅ Tách biệt Entity và API contract
- ✅ Bảo vệ internal structure
- ✅ Versioning API dễ dàng
- ✅ Validation ở DTO level

```java
// Entity (internal)
@Entity
public class OrderEntity {
    private String internalField; // Không expose ra API
}

// DTO (external)
public record OrderResponseDTO(
    Long id,
    String code,
    // Chỉ expose fields cần thiết
) {}
```

---

### 3. **Repository Pattern** (Đang dùng)

**Tại sao dùng Repository?**
- ✅ Tách biệt data access logic
- ✅ Dễ test (mock repository)
- ✅ Dễ thay đổi database
- ✅ Centralized queries

```java
@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    // Custom queries ở đây
    // Không có business logic
}
```

---

## 🔧 Design Patterns

### 1. **Service Layer Pattern**

**Interface + Implementation:**

```java
// Interface (contract)
public interface OrderService {
    OrderResponseDTO create(OrderRequestDTO request);
}

// Implementation (business logic)
@Service
public class OrderServiceImpl implements OrderService {
    // Implementation
}
```

**Lợi ích:**
- ✅ Dễ test (mock interface)
- ✅ Dễ thay đổi implementation
- ✅ Clear contract

---

### 2. **Builder Pattern** (với Lombok)

```java
// Entity với Builder
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderEntity {
    // ...
}

// Sử dụng
OrderEntity order = OrderEntity.builder()
    .code("ORD-001")
    .customer(customer)
    .total(BigDecimal.valueOf(1000000))
    .build();
```

---

### 3. **Strategy Pattern** (cho Payment)

```java
// Strategy interface
public interface PaymentStrategy {
    PaymentResult process(PaymentRequest request);
}

// Implementations
@Service
public class VNPayStrategy implements PaymentStrategy { ... }
@Service
public class MoMoStrategy implements PaymentStrategy { ... }
@Service
public class ZaloPayStrategy implements PaymentStrategy { ... }

// Service sử dụng
@Service
public class PaymentService {
    private final Map<String, PaymentStrategy> strategies;
    
    public PaymentResult process(String method, PaymentRequest request) {
        PaymentStrategy strategy = strategies.get(method);
        return strategy.process(request);
    }
}
```

---

## 🎯 Best Practices

### 1. **Exception Handling Strategy**

```java
// ✅ Senior: Phân loại exception rõ ràng
// Business exceptions → BusinessException
if (fabric.getQuantity() < requestedQuantity) {
    throw new BusinessException("INSUFFICIENT_STOCK", "Not enough stock");
}

// Not found → NotFoundException
UserEntity user = userRepository.findById(id)
    .orElseThrow(() -> new NotFoundException("User not found"));

// Validation → BadRequestException
if (request.total() < 0) {
    throw new BadRequestException("Total cannot be negative");
}
```

---

### 2. **Transaction Management**

```java
// ✅ Senior: Transaction ở Service layer
@Service
@Transactional  // Class level
public class OrderServiceImpl {
    
    @Transactional  // Method level (override class level)
    public OrderResponseDTO create(OrderRequestDTO request) {
        // Tất cả operations trong transaction
        OrderEntity order = createOrder(request);
        updateFabricStock(request);
        sendNotification(order);
        // Nếu lỗi → rollback tất cả
    }
    
    @Transactional(readOnly = true)  // Read-only transaction
    public OrderResponseDTO findById(Long id) {
        // Chỉ đọc, không cần write lock
    }
}
```

---

### 3. **Validation Strategy**

```java
// ✅ Senior: Validation ở nhiều layer

// 1. DTO level (Jakarta Bean Validation)
public record OrderRequestDTO(
    @NotNull @Positive Long customerId,
    @NotNull @FutureOrPresent LocalDate dueDate
) {}

// 2. Service level (Business rules)
private void validateRequest(OrderRequestDTO request) {
    if (request.dueDate().isBefore(LocalDate.now())) {
        throw new BadRequestException("Due date must be in the future");
    }
}

// 3. Repository level (Database constraints)
// Foreign keys, unique constraints, etc.
```

---

### 4. **Query Optimization**

```java
// ✅ Senior: Optimize queries

// 1. Use JOIN FETCH để tránh N+1
@Query("SELECT o FROM OrderEntity o " +
       "LEFT JOIN FETCH o.customer " +
       "LEFT JOIN FETCH o.assignedTailor " +
       "WHERE o.isDeleted = false")
List<OrderEntity> findAllWithRelations();

// 2. Use pagination
Page<OrderEntity> findByIsDeletedFalse(Pageable pageable);

// 3. Use projections cho large data
@Query("SELECT new com.myhien.tailor.dto.OrderSummaryDTO(" +
       "o.id, o.code, o.status, o.total) " +
       "FROM OrderEntity o WHERE o.isDeleted = false")
List<OrderSummaryDTO> findOrderSummaries();
```

---

## 🎨 Code Organization

### 1. **Package Structure**

```
com.myhien.tailor
├─ config/          # Global configurations
├─ common/          # Shared utilities
└─ modules/         # Feature modules
   └─ order/
      ├─ controller/ # API layer
      ├─ service/    # Business logic
      ├─ repository/ # Data access
      ├─ domain/     # Entities
      └─ dto/        # Data transfer objects
```

**Nguyên tắc:**
- ✅ Mỗi module độc lập
- ✅ Shared code ở common/
- ✅ Config ở config/

---

### 2. **Naming Conventions**

```java
// ✅ Senior: Consistent naming

// Entities: *Entity
UserEntity, OrderEntity

// Repositories: *Repository
UserRepository, OrderRepository

// Services: *Service (interface), *ServiceImpl (implementation)
UserService, UserServiceImpl

// Controllers: *Controller
UserController, OrderController

// DTOs: *RequestDTO, *ResponseDTO
UserRequestDTO, UserResponseDTO

// Exceptions: *Exception
BusinessException, NotFoundException
```

---

## 🔒 Security Patterns

### 1. **Input Validation**

```java
// ✅ Senior: Validate ở nhiều layer

// 1. DTO validation
public record OrderRequestDTO(
    @NotNull @Positive Long customerId
) {}

// 2. Controller validation
@PostMapping
public OrderResponseDTO create(@RequestBody @Valid OrderRequestDTO request) {
    // @Valid trigger validation
}

// 3. Service validation
private void validateRequest(OrderRequestDTO request) {
    // Business rules validation
}
```

---

### 2. **Authorization Pattern**

```java
// ✅ Senior: Check permissions

@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
@GetMapping("/orders")
public Page<OrderResponseDTO> getAllOrders(Pageable pageable) {
    return orderService.findAll(pageable);
}

@PreAuthorize("hasRole('CUSTOMER') and #customerId == authentication.principal.id")
@GetMapping("/orders/customer/{customerId}")
public Page<OrderResponseDTO> getCustomerOrders(
    @PathVariable Long customerId,
    Pageable pageable
) {
    return orderService.findByCustomerId(customerId, pageable);
}
```

---

## ⚡ Performance Patterns

### 1. **Lazy Loading Strategy**

```java
// ✅ Senior: Control lazy loading

@Entity
public class OrderEntity {
    @ManyToOne(fetch = FetchType.LAZY)  // Lazy by default
    private UserEntity customer;
    
    @OneToMany(fetch = FetchType.LAZY)
    private List<MeasurementEntity> measurements;
}

// Eager load khi cần
@Query("SELECT o FROM OrderEntity o " +
       "LEFT JOIN FETCH o.customer " +
       "WHERE o.id = :id")
Optional<OrderEntity> findByIdWithCustomer(@Param("id") Long id);
```

---

### 2. **Caching Strategy**

```java
// ✅ Senior: Cache khi cần

@Cacheable(value = "roles", key = "#id")
public RoleEntity findRoleById(Long id) {
    return roleRepository.findById(id).orElseThrow();
}

@CacheEvict(value = "roles", key = "#role.id")
public RoleEntity updateRole(RoleEntity role) {
    return roleRepository.save(role);
}
```

---

## 🧪 Testing Patterns

### 1. **Test Structure**

```java
// ✅ Senior: Test structure rõ ràng

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    
    @Mock
    private OrderRepository orderRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private OrderServiceImpl orderService;
    
    @Test
    void shouldCreateOrder() {
        // Given
        OrderRequestDTO request = new OrderRequestDTO(...);
        UserEntity customer = new UserEntity(...);
        
        when(userRepository.findById(any())).thenReturn(Optional.of(customer));
        when(orderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        
        // When
        OrderResponseDTO result = orderService.create(request);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.code()).isNotNull();
        verify(orderRepository).save(any());
    }
}
```

---

## 📚 Tóm Tắt Patterns

### Architectural Patterns
- ✅ Layered Architecture
- ✅ DTO Pattern
- ✅ Repository Pattern

### Design Patterns
- ✅ Service Layer Pattern
- ✅ Builder Pattern
- ✅ Strategy Pattern (cho payment)

### Best Practices
- ✅ Exception Handling Strategy
- ✅ Transaction Management
- ✅ Validation Strategy
- ✅ Query Optimization

**Nhớ: Patterns là tools, không phải goals. Dùng đúng chỗ!** 🎯


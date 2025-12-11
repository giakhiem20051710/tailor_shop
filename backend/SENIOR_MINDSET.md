# 🧠 Tư Duy Code & Thiết Kế - Senior Developer Mindset

## 🎯 Nguyên Tắc Cốt Lõi

### 1. **Think Before Code** (Suy Nghĩ Trước Khi Code)

**❌ Junior:**
```java
// Code ngay, fix sau
public void createOrder(OrderRequestDTO request) {
    OrderEntity order = new OrderEntity();
    order.setCustomerId(request.customerId());
    orderRepository.save(order);
    // Quên validate, quên check null, quên transaction
}
```

**✅ Senior:**
```java
// Suy nghĩ trước:
// 1. Validation cần gì?
// 2. Business rules là gì?
// 3. Error cases nào?
// 4. Transaction boundary?
// 5. Performance impact?

@Service
@Transactional
public class OrderServiceImpl implements OrderService {
    
    public OrderResponseDTO create(OrderRequestDTO request) {
        // 1. Validate input
        validateRequest(request);
        
        // 2. Check business rules
        checkBusinessRules(request);
        
        // 3. Create entity
        OrderEntity entity = buildEntity(request);
        
        // 4. Save with transaction
        OrderEntity saved = orderRepository.save(entity);
        
        // 5. Return response
        return toResponseDTO(saved);
    }
    
    private void validateRequest(OrderRequestDTO request) {
        // Validation logic
    }
    
    private void checkBusinessRules(OrderRequestDTO request) {
        // Business rules
    }
}
```

---

## 🏗️ Tư Duy Thiết Kế

### 1. **Domain-Driven Design (DDD) Thinking**

**Senior không chỉ code, mà hiểu business:**

```
❌ Junior: "Tôi cần tạo API để lấy danh sách orders"

✅ Senior: "Tôi cần hiểu:
- Ai sẽ dùng API này? (Admin, Customer, Tailor)
- Họ cần filter gì? (status, date, customer)
- Performance requirements? (bao nhiêu records?)
- Security? (ai được xem?)
- Business rules? (soft delete, permissions)"
```

**Ví dụ:**
```java
// ❌ Junior: Chỉ code đơn giản
@GetMapping("/orders")
public List<Order> getOrders() {
    return orderRepository.findAll();
}

// ✅ Senior: Suy nghĩ đầy đủ
@GetMapping("/orders")
public Page<OrderResponseDTO> getOrders(
    @RequestParam(required = false) OrderStatus status,
    @RequestParam(required = false) Long customerId,
    @RequestParam(required = false) LocalDate fromDate,
    @RequestParam(required = false) LocalDate toDate,
    @PageableDefault(size = 20) Pageable pageable,
    Authentication authentication
) {
    // 1. Check permissions
    checkPermissions(authentication);
    
    // 2. Build query based on filters
    Specification<OrderEntity> spec = buildSpecification(
        status, customerId, fromDate, toDate, authentication
    );
    
    // 3. Query with pagination
    Page<OrderEntity> orders = orderRepository.findAll(spec, pageable);
    
    // 4. Map to DTO
    return orders.map(this::toResponseDTO);
}
```

---

### 2. **Separation of Concerns** (Tách Biệt Trách Nhiệm)

**Senior luôn tách rõ:**

```
Controller → Chỉ nhận request, trả response
Service → Business logic
Repository → Data access
Entity → Domain model
DTO → Data transfer
```

**Ví dụ:**

```java
// ❌ Junior: Logic trong Controller
@PostMapping("/orders")
public OrderResponseDTO create(@RequestBody OrderRequestDTO request) {
    // Validation
    if (request.customerId() == null) {
        throw new Exception("Customer ID required");
    }
    
    // Business logic
    User customer = userRepository.findById(request.customerId());
    if (customer == null) {
        throw new Exception("Customer not found");
    }
    
    // Create entity
    OrderEntity order = new OrderEntity();
    order.setCustomer(customer);
    // ... 50 dòng code nữa
    
    return orderRepository.save(order);
}

// ✅ Senior: Tách rõ trách nhiệm
@PostMapping("/orders")
public OrderResponseDTO create(@RequestBody @Valid OrderRequestDTO request) {
    // Controller chỉ delegate
    return orderService.create(request);
}

@Service
public class OrderServiceImpl {
    public OrderResponseDTO create(OrderRequestDTO request) {
        // Service chứa business logic
        validateRequest(request);
        UserEntity customer = findCustomer(request.customerId());
        OrderEntity entity = buildOrderEntity(request, customer);
        return toResponseDTO(orderRepository.save(entity));
    }
}
```

---

### 3. **Fail Fast Principle** (Lỗi Sớm)

**Senior validate sớm, fail sớm:**

```java
// ❌ Junior: Validate cuối cùng
public OrderResponseDTO create(OrderRequestDTO request) {
    OrderEntity order = new OrderEntity();
    order.setCustomerId(request.customerId());
    order.setTotal(request.total());
    // ... nhiều code
    
    // Validate cuối cùng
    if (order.getTotal() < 0) {
        throw new Exception("Invalid");
    }
}

// ✅ Senior: Validate đầu tiên
public OrderResponseDTO create(OrderRequestDTO request) {
    // Validate ngay đầu
    validateRequest(request);
    
    // Sau đó mới xử lý
    // ...
}

private void validateRequest(OrderRequestDTO request) {
    if (request.customerId() == null) {
        throw new BadRequestException("Customer ID is required");
    }
    if (request.total() == null || request.total().compareTo(BigDecimal.ZERO) < 0) {
        throw new BadRequestException("Total must be positive");
    }
    // Validate tất cả ngay đầu
}
```

---

### 4. **Defensive Programming** (Lập Trình Phòng Thủ)

**Senior luôn nghĩ đến edge cases:**

```java
// ❌ Junior: Chỉ nghĩ happy path
public OrderResponseDTO findById(Long id) {
    OrderEntity order = orderRepository.findById(id).get();
    return toResponseDTO(order);
}

// ✅ Senior: Nghĩ đến mọi trường hợp
public OrderResponseDTO findById(Long id) {
    // 1. Check null
    if (id == null) {
        throw new BadRequestException("ID cannot be null");
    }
    
    // 2. Check exists
    OrderEntity order = orderRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Order not found"));
    
    // 3. Check soft delete
    if (order.getIsDeleted()) {
        throw new NotFoundException("Order has been deleted");
    }
    
    // 4. Check permissions (nếu cần)
    checkPermissions(order);
    
    return toResponseDTO(order);
}
```

---

### 5. **Single Responsibility Principle** (SRP)

**Senior: Mỗi class/method chỉ làm 1 việc:**

```java
// ❌ Junior: Method làm nhiều việc
public OrderResponseDTO createOrder(OrderRequestDTO request) {
    // Validate
    if (request.customerId() == null) throw new Exception();
    
    // Find customer
    User customer = userRepository.findById(request.customerId());
    
    // Check stock
    Fabric fabric = fabricRepository.findById(request.fabricId());
    if (fabric.getQuantity() < request.quantity()) throw new Exception();
    
    // Create order
    OrderEntity order = new OrderEntity();
    // ... 50 dòng code
    
    // Update stock
    fabric.setQuantity(fabric.getQuantity() - request.quantity());
    fabricRepository.save(fabric);
    
    // Send email
    emailService.sendOrderConfirmation(order);
    
    return toResponseDTO(order);
}

// ✅ Senior: Tách thành nhiều methods
public OrderResponseDTO create(OrderRequestDTO request) {
    validateRequest(request);
    UserEntity customer = findCustomer(request.customerId());
    FabricEntity fabric = findFabric(request.fabricId());
    checkStockAvailability(fabric, request.quantity());
    
    OrderEntity order = buildOrderEntity(request, customer, fabric);
    OrderEntity saved = orderRepository.save(order);
    
    updateFabricStock(fabric, request.quantity());
    sendOrderConfirmation(saved);
    
    return toResponseDTO(saved);
}

private void validateRequest(OrderRequestDTO request) { ... }
private UserEntity findCustomer(Long id) { ... }
private FabricEntity findFabric(Long id) { ... }
private void checkStockAvailability(FabricEntity fabric, int quantity) { ... }
private OrderEntity buildOrderEntity(...) { ... }
private void updateFabricStock(FabricEntity fabric, int quantity) { ... }
private void sendOrderConfirmation(OrderEntity order) { ... }
```

---

## 🎨 Tư Duy Code Quality

### 1. **Readable Code > Clever Code**

**Senior ưu tiên code dễ đọc:**

```java
// ❌ Junior: Code "clever" nhưng khó đọc
public boolean canUpdate(Order o) {
    return !o.getStatus().equals(OrderStatus.DONE) && 
           !o.getStatus().equals(OrderStatus.CANCELLED) &&
           !o.getIsDeleted() && 
           (o.getAssignedTailor() == null || 
            o.getAssignedTailor().getId().equals(getCurrentUserId()));
}

// ✅ Senior: Code rõ ràng, dễ hiểu
public boolean canUpdate(OrderEntity order) {
    if (order.getIsDeleted()) {
        return false;
    }
    
    if (isOrderCompleted(order)) {
        return false;
    }
    
    if (isOrderCancelled(order)) {
        return false;
    }
    
    if (isAssignedToOtherTailor(order)) {
        return false;
    }
    
    return true;
}

private boolean isOrderCompleted(OrderEntity order) {
    return order.getStatus() == OrderStatus.DONE;
}

private boolean isOrderCancelled(OrderEntity order) {
    return order.getStatus() == OrderStatus.CANCELLED;
}

private boolean isAssignedToOtherTailor(OrderEntity order) {
    if (order.getAssignedTailor() == null) {
        return false;
    }
    Long currentUserId = getCurrentUserId();
    return !order.getAssignedTailor().getId().equals(currentUserId);
}
```

---

### 2. **Meaningful Names** (Tên Có Ý Nghĩa)

**Senior đặt tên rõ ràng:**

```java
// ❌ Junior: Tên không rõ ràng
public void proc(OrderDTO o) {
    User u = usrRepo.findById(o.cId());
    if (u == null) return;
    OrderEntity e = new OrderEntity();
    e.setC(u);
    repo.save(e);
}

// ✅ Senior: Tên có ý nghĩa
public OrderResponseDTO createOrder(OrderRequestDTO request) {
    UserEntity customer = findCustomerById(request.customerId());
    if (customer == null) {
        throw new NotFoundException("Customer not found");
    }
    
    OrderEntity order = buildOrderEntity(request, customer);
    OrderEntity saved = orderRepository.save(order);
    
    return toOrderResponseDTO(saved);
}
```

---

### 3. **DRY Principle** (Don't Repeat Yourself)

**Senior tránh lặp code:**

```java
// ❌ Junior: Lặp code
public OrderResponseDTO createOrder(OrderRequestDTO request) {
    OrderEntity order = orderRepository.findById(request.orderId())
        .orElseThrow(() -> new NotFoundException("Order not found"));
    if (order.getIsDeleted()) {
        throw new NotFoundException("Order deleted");
    }
    // ...
}

public OrderResponseDTO updateOrder(OrderRequestDTO request) {
    OrderEntity order = orderRepository.findById(request.orderId())
        .orElseThrow(() -> new NotFoundException("Order not found"));
    if (order.getIsDeleted()) {
        throw new NotFoundException("Order deleted");
    }
    // ...
}

// ✅ Senior: Extract common logic
public OrderResponseDTO createOrder(OrderRequestDTO request) {
    // ...
}

public OrderResponseDTO updateOrder(OrderRequestDTO request) {
    OrderEntity order = findActiveOrderById(request.orderId());
    // ...
}

private OrderEntity findActiveOrderById(Long id) {
    OrderEntity order = orderRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Order not found"));
    
    if (order.getIsDeleted()) {
        throw new NotFoundException("Order has been deleted");
    }
    
    return order;
}
```

---

## 🔒 Tư Duy Security

### 1. **Never Trust Input**

**Senior luôn validate input:**

```java
// ❌ Junior: Tin tưởng input
@GetMapping("/orders/{id}")
public OrderResponseDTO getOrder(@PathVariable String id) {
    Long orderId = Long.parseLong(id);
    return orderService.findById(orderId);
}

// ✅ Senior: Validate mọi input
@GetMapping("/orders/{id}")
public OrderResponseDTO getOrder(@PathVariable @Valid @Min(1) Long id) {
    return orderService.findById(id);
}

// Hoặc trong Service
public OrderResponseDTO findById(Long id) {
    if (id == null || id <= 0) {
        throw new BadRequestException("Invalid order ID");
    }
    // ...
}
```

---

### 2. **Authorization Checks**

**Senior luôn check permissions:**

```java
// ❌ Junior: Không check permissions
@GetMapping("/orders/{id}")
public OrderResponseDTO getOrder(@PathVariable Long id) {
    return orderService.findById(id);
}

// ✅ Senior: Check permissions
@GetMapping("/orders/{id}")
public OrderResponseDTO getOrder(
    @PathVariable Long id,
    Authentication authentication
) {
    OrderResponseDTO order = orderService.findById(id);
    
    // Check if user can access this order
    if (!canAccessOrder(order, authentication)) {
        throw new AccessDeniedException("You don't have permission");
    }
    
    return order;
}

private boolean canAccessOrder(OrderResponseDTO order, Authentication auth) {
    String userRole = auth.getAuthorities().iterator().next().getAuthority();
    
    // Admin/Staff can access all
    if (userRole.equals("ROLE_ADMIN") || userRole.equals("ROLE_STAFF")) {
        return true;
    }
    
    // Customer can only access their own orders
    if (userRole.equals("ROLE_CUSTOMER")) {
        Long currentUserId = getCurrentUserId(auth);
        return order.customerId().equals(currentUserId);
    }
    
    // Tailor can access assigned orders
    if (userRole.equals("ROLE_TAILOR")) {
        Long currentUserId = getCurrentUserId(auth);
        return order.assignedTailorId() != null && 
               order.assignedTailorId().equals(currentUserId);
    }
    
    return false;
}
```

---

## ⚡ Tư Duy Performance

### 1. **N+1 Query Problem**

**Senior tránh N+1 queries:**

```java
// ❌ Junior: N+1 queries
public List<OrderResponseDTO> getOrders() {
    List<OrderEntity> orders = orderRepository.findAll();
    return orders.stream()
        .map(order -> {
            // Query customer (N queries)
            UserEntity customer = userRepository.findById(order.getCustomerId());
            // Query tailor (N queries)
            UserEntity tailor = userRepository.findById(order.getAssignedTailorId());
            return toResponseDTO(order, customer, tailor);
        })
        .toList();
}
// Total: 1 + N + N = 2N + 1 queries

// ✅ Senior: Use JOIN FETCH
@Query("SELECT o FROM OrderEntity o " +
       "LEFT JOIN FETCH o.customer " +
       "LEFT JOIN FETCH o.assignedTailor " +
       "WHERE o.isDeleted = false")
List<OrderEntity> findAllWithRelations();

// Total: 1 query
```

---

### 2. **Pagination**

**Senior luôn dùng pagination:**

```java
// ❌ Junior: Load tất cả
@GetMapping("/orders")
public List<OrderResponseDTO> getOrders() {
    List<OrderEntity> orders = orderRepository.findAll();
    return orders.stream().map(this::toResponseDTO).toList();
}
// Vấn đề: Nếu có 10,000 orders → Load hết vào memory

// ✅ Senior: Pagination
@GetMapping("/orders")
public Page<OrderResponseDTO> getOrders(
    @PageableDefault(size = 20) Pageable pageable
) {
    return orderRepository.findByIsDeletedFalse(pageable)
        .map(this::toResponseDTO);
}
// Chỉ load 20 records mỗi lần
```

---

## 🧪 Tư Duy Testing

### 1. **Testable Code**

**Senior viết code dễ test:**

```java
// ❌ Junior: Khó test (hard dependencies)
@Service
public class OrderService {
    private OrderRepository orderRepository = new OrderRepositoryImpl();
    private EmailService emailService = new EmailServiceImpl();
    
    public void createOrder(OrderRequestDTO request) {
        // Hard to test - can't mock dependencies
    }
}

// ✅ Senior: Dễ test (dependency injection)
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final EmailService emailService;
    
    public OrderService(
        OrderRepository orderRepository,
        EmailService emailService
    ) {
        this.orderRepository = orderRepository;
        this.emailService = emailService;
    }
    
    // Easy to test - can inject mocks
}
```

---

### 2. **Edge Cases**

**Senior test edge cases:**

```java
// ✅ Senior nghĩ đến:
@Test
void shouldCreateOrder() { ... }

@Test
void shouldThrowExceptionWhenCustomerNotFound() { ... }

@Test
void shouldThrowExceptionWhenFabricOutOfStock() { ... }

@Test
void shouldThrowExceptionWhenTotalIsNegative() { ... }

@Test
void shouldThrowExceptionWhenDueDateIsPast() { ... }
```

---

## 📚 Tư Duy Maintainability

### 1. **Code Comments**

**Senior comment "WHY", không comment "WHAT":**

```java
// ❌ Junior: Comment "what"
// Get order by ID
public OrderResponseDTO getOrder(Long id) {
    // Find order in repository
    OrderEntity order = orderRepository.findById(id).get();
    // Return order
    return toResponseDTO(order);
}

// ✅ Senior: Comment "why"
public OrderResponseDTO getOrder(Long id) {
    // We check soft delete here because deleted orders should not be
    // accessible through normal API, but still exist in database for audit
    OrderEntity order = findActiveOrderById(id);
    return toResponseDTO(order);
}
```

---

### 2. **Configuration Over Code**

**Senior dùng config, không hardcode:**

```java
// ❌ Junior: Hardcode
public void sendEmail(OrderEntity order) {
    String email = "admin@tailorshop.com";
    String subject = "New Order";
    // ...
}

// ✅ Senior: Config
@Value("${app.email.admin}")
private String adminEmail;

@Value("${app.email.order.subject}")
private String orderEmailSubject;

public void sendEmail(OrderEntity order) {
    emailService.send(adminEmail, orderEmailSubject, ...);
}
```

---

## 🎯 Tư Duy Problem Solving

### 1. **Understand Problem First**

**Senior hiểu vấn đề trước khi giải quyết:**

```
❌ Junior: "Tôi cần tạo API để lấy orders"
→ Code ngay

✅ Senior: "Tôi cần hiểu:
- Ai sẽ dùng API này?
- Họ cần filter gì?
- Performance requirements?
- Security requirements?
- Business rules?"
→ Sau đó mới code
```

---

### 2. **Think About Future**

**Senior nghĩ đến tương lai:**

```java
// ❌ Junior: Chỉ nghĩ hiện tại
public OrderResponseDTO createOrder(OrderRequestDTO request) {
    // Code đơn giản, không nghĩ đến mở rộng
}

// ✅ Senior: Nghĩ đến mở rộng
public OrderResponseDTO create(OrderRequestDTO request) {
    // 1. Validate
    validateRequest(request);
    
    // 2. Business rules (có thể thêm rules sau)
    applyBusinessRules(request);
    
    // 3. Create (có thể thêm hooks sau)
    OrderEntity entity = buildOrderEntity(request);
    OrderEntity saved = orderRepository.save(entity);
    
    // 4. Post-processing (có thể thêm events sau)
    publishOrderCreatedEvent(saved);
    
    return toResponseDTO(saved);
}
```

---

## 💡 Best Practices Summary

### 1. **Code Organization**
- ✅ Tách rõ layers (Controller → Service → Repository)
- ✅ Mỗi class/method 1 trách nhiệm
- ✅ Tên có ý nghĩa
- ✅ Code dễ đọc

### 2. **Error Handling**
- ✅ Validate sớm, fail sớm
- ✅ Exception có ý nghĩa
- ✅ Logging đầy đủ
- ✅ User-friendly messages

### 3. **Security**
- ✅ Validate mọi input
- ✅ Check permissions
- ✅ Không expose sensitive data
- ✅ Use parameterized queries

### 4. **Performance**
- ✅ Tránh N+1 queries
- ✅ Dùng pagination
- ✅ Cache khi cần
- ✅ Optimize database queries

### 5. **Maintainability**
- ✅ DRY principle
- ✅ Configuration over code
- ✅ Comments "why" not "what"
- ✅ Testable code

---

## 🎓 Mindset Checklist

Khi code, tự hỏi:

- [ ] Tôi đã hiểu rõ requirements chưa?
- [ ] Code này dễ đọc không?
- [ ] Có edge cases nào không?
- [ ] Security đã đủ chưa?
- [ ] Performance có vấn đề gì không?
- [ ] Code này dễ test không?
- [ ] Code này dễ maintain không?
- [ ] Có thể mở rộng sau không?

---

## 🚀 Tóm Tắt

**Senior Developer:**
1. ✅ **Think before code** - Suy nghĩ trước khi code
2. ✅ **Understand business** - Hiểu business domain
3. ✅ **Write readable code** - Code dễ đọc > clever
4. ✅ **Defensive programming** - Nghĩ đến edge cases
5. ✅ **Security first** - Validate, authorize
6. ✅ **Performance aware** - Tránh N+1, dùng pagination
7. ✅ **Testable code** - Dễ test
8. ✅ **Maintainable** - Dễ maintain, dễ mở rộng

**Nhớ: Code is read 10x more than it's written!** 📖


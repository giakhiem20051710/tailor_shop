# 📚 Hướng Dẫn Học Exception Handling trong Spring Boot

## 🎯 Mục tiêu
Hiểu và vận dụng được hệ thống exception handling trong project Tailor Shop.

---

## 📖 BƯỚC 1: Hiểu Cơ Bản Spring Exception Handling

### 1.1. Exception là gì?
```java
// Exception = Lỗi xảy ra khi chạy chương trình
try {
    int result = 10 / 0; // ❌ Lỗi: chia cho 0
} catch (ArithmeticException e) {
    // Xử lý lỗi ở đây
}
```

### 1.2. @RestControllerAdvice là gì?
```java
@RestControllerAdvice  // = "Bắt tất cả exception từ controllers"
public class GlobalExceptionHandler {
    // Xử lý exception ở đây
}
```

**Ví dụ đơn giản:**
```java
// Controller
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) {
    return userService.findById(id); // Có thể throw NotFoundException
}

// GlobalExceptionHandler tự động bắt NotFoundException
// Không cần try-catch trong controller!
```

---

## 📖 BƯỚC 2: Học Từng Loại Exception

### 2.1. Custom Exceptions (Dễ nhất - Bắt đầu từ đây)

#### BadRequestException
**Khi nào dùng:** Input không hợp lệ

**Ví dụ thực tế:**
```java
// Service
public OrderResponseDTO createOrder(OrderRequestDTO request) {
    if (request.total() < 0) {
        throw new BadRequestException("Total cannot be negative");
    }
    // ...
}
```

**Thực hành:**
1. Tạo endpoint test:
```java
@GetMapping("/test/bad-request")
public void testBadRequest() {
    throw new BadRequestException("This is a test error");
}
```

2. Gọi API: `GET /test/bad-request`
3. Xem response → Hiểu cách hoạt động

#### NotFoundException
**Khi nào dùng:** Không tìm thấy resource

**Ví dụ thực tế:**
```java
// Service
public UserResponseDTO findUser(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("User not found with id: " + id));
    return toDTO(user);
}
```

**Thực hành:**
1. Tạo endpoint: `GET /users/99999` (id không tồn tại)
2. Xem response → Hiểu cách hoạt động

---

### 2.2. Validation Exceptions (Quan trọng nhất)

#### MethodArgumentNotValidException
**Khi nào:** DTO validation thất bại

**Ví dụ:**
```java
// DTO
public record OrderRequestDTO(
    @NotNull(message = "Customer ID is required")
    Long customerId,
    
    @Positive(message = "Total must be positive")
    BigDecimal total
) {}

// Controller
@PostMapping("/orders")
public OrderResponseDTO create(@RequestBody @Valid OrderRequestDTO request) {
    // Nếu request.customerId = null
    // → MethodArgumentNotValidException tự động
}
```

**Thực hành:**
1. Gửi request với `customerId: null`
2. Xem response → Hiểu validation message format

---

### 2.3. Database Exceptions

#### DataIntegrityViolationException
**Khi nào:** Vi phạm database constraint

**Ví dụ:**
```java
// Tạo user với email đã tồn tại
User user = new User();
user.setEmail("existing@email.com"); // Email đã có trong DB
userRepository.save(user); // ❌ Throw DataIntegrityViolationException
```

**Thực hành:**
1. Tạo 2 users với cùng email
2. Xem exception được xử lý như thế nào

---

## 📖 BƯỚC 3: Thực Hành Từng Bước

### 3.1. Tạo Test Controller
Tạo file `TestExceptionController.java` để test từng loại exception:

```java
@RestController
@RequestMapping("/test/exceptions")
public class TestExceptionController {
    
    @GetMapping("/bad-request")
    public void testBadRequest() {
        throw new BadRequestException("Test bad request");
    }
    
    @GetMapping("/not-found")
    public void testNotFound() {
        throw new NotFoundException("Test not found");
    }
    
    @GetMapping("/validation")
    public void testValidation(@Valid @RequestParam @NotNull String name) {
        // Gọi: GET /test/exceptions/validation (không có param name)
        // → ConstraintViolationException
    }
    
    @PostMapping("/dto-validation")
    public void testDtoValidation(@RequestBody @Valid OrderRequestDTO dto) {
        // Gửi dto với field null → MethodArgumentNotValidException
    }
}
```

### 3.2. Test Từng Exception
1. Chạy ứng dụng
2. Dùng Postman/curl test từng endpoint
3. Xem response → Hiểu cách hoạt động

---

## 📖 BƯỚC 4: Đọc Code Thực Tế

### 4.1. Đọc OrderService
Xem cách throw exception trong service:

```java
// OrderServiceImpl.java
public OrderResponseDTO findById(Long id) {
    OrderEntity entity = orderRepository.findById(id)
        .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "Order not found"));
    // ...
}
```

**Câu hỏi tự đặt:**
- Tại sao dùng `BusinessException` thay vì `NotFoundException`?
- ErrorCode "ORDER_NOT_FOUND" dùng để làm gì?

### 4.2. Đọc GlobalExceptionHandler
Xem cách xử lý từng exception:

```java
@ExceptionHandler(BusinessException.class)
public ResponseEntity<CommonResponse<Object>> handleBusinessException(...) {
    // Tại sao dùng TraceIdUtil?
    // Tại sao dùng ResponseUtil.error()?
    // Response format như thế nào?
}
```

---

## 📖 BƯỚC 5: Debug và Trace

### 5.1. Thêm Logging
Thêm log để hiểu flow:

```java
@ExceptionHandler(BusinessException.class)
public ResponseEntity<CommonResponse<Object>> handleBusinessException(BusinessException ex) {
    log.info("Handling BusinessException: code={}, message={}", 
        ex.getErrorCode(), ex.getMessage()); // ← Thêm log
    
    String traceId = TraceIdUtil.getOrCreateTraceId();
    log.debug("Trace ID: {}", traceId); // ← Thêm log
    
    return ResponseEntity.badRequest()
        .body(ResponseUtil.error(traceId, ex.getErrorCode(), ex.getMessage()));
}
```

### 5.2. Đặt Breakpoint
1. Đặt breakpoint trong `GlobalExceptionHandler`
2. Trigger exception
3. Xem step-by-step code chạy như thế nào

---

## 📖 BƯỚC 6: Thực Hành Viết Code

### 6.1. Bài tập 1: Tạo Custom Exception
Tạo `InsufficientStockException`:

```java
// 1. Tạo exception class
public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
}

// 2. Thêm handler trong GlobalExceptionHandler
@ExceptionHandler(InsufficientStockException.class)
public ResponseEntity<CommonResponse<Object>> handleInsufficientStock(...) {
    // Implement handler
}

// 3. Sử dụng trong FabricService
if (fabric.getQuantity() < requestedQuantity) {
    throw new InsufficientStockException("Not enough fabric in stock");
}
```

### 6.2. Bài tập 2: Cải thiện Validation Message
Cải thiện message trong `handleValidation`:

```java
// Hiện tại: "name: must not be null; email: must be a valid email"
// Cải thiện: "Tên không được để trống; Email không hợp lệ"
```

---

## 📖 BƯỚC 7: Hiểu CommonResponse Format

### 7.1. Response Structure
```json
{
  "requestTrace": "uuid-123",        // ← Trace ID để tracking
  "responseDateTime": "2025-01-15...", // ← Thời gian response
  "responseStatus": {
    "responseCode": "400",            // ← HTTP status code
    "responseMessage": "Error message" // ← Message cho user
  },
  "responseData": null                // ← Data (null nếu error)
}
```

### 7.2. Tại sao cần format này?
- **requestTrace**: Tracking request qua logs
- **responseStatus**: Client biết lỗi gì
- **responseData**: Data thực tế (null nếu error)

---

## 📖 BƯỚC 8: Tài Liệu Tham Khảo

### 8.1. Spring Official Docs
- [Exception Handling in Spring](https://spring.io/guides/gs/rest-service/)
- [@RestControllerAdvice](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html)

### 8.2. Jakarta Bean Validation
- [Validation Annotations](https://jakarta.ee/specifications/bean-validation/3.0/jakarta-bean-validation-spec-3.0.html#builtinconstraints)

### 8.3. Code trong Project
- `GlobalExceptionHandler.java` - Xem cách xử lý
- `OrderServiceImpl.java` - Xem cách throw exception
- `OrderController.java` - Xem cách dùng @Valid

---

## ✅ Checklist Kiểm Tra Hiểu Biết

- [ ] Hiểu @RestControllerAdvice làm gì
- [ ] Biết khi nào dùng BadRequestException vs NotFoundException
- [ ] Hiểu MethodArgumentNotValidException xảy ra khi nào
- [ ] Biết cách throw exception trong Service
- [ ] Hiểu CommonResponse format
- [ ] Biết cách test exception với Postman
- [ ] Có thể tạo custom exception mới
- [ ] Có thể debug exception flow

---

## 🎯 Tips Học Hiệu Quả

1. **Đọc code thực tế** > Đọc lý thuyết
2. **Viết code test** > Chỉ đọc code
3. **Debug step-by-step** > Đoán mò
4. **Đặt câu hỏi** > Chấp nhận mọi thứ
5. **Thực hành nhiều** > Học thuộc lòng

---

## 🚀 Bắt Đầu Ngay

1. Tạo `TestExceptionController.java`
2. Test từng exception type
3. Đọc code trong `OrderService` và `GlobalExceptionHandler`
4. Viết custom exception mới
5. Debug và trace flow

**Nhớ:** Học bằng cách làm, không phải chỉ đọc! 🎓


# 🏋️ Bài Tập Thực Hành Exception Handling

## 📝 Bài Tập 1: Hiểu Flow Cơ Bản

### Mục tiêu
Hiểu cách exception được xử lý từ Controller → Service → Handler

### Yêu cầu
1. Tạo endpoint test:
```java
@GetMapping("/test/flow")
public String testFlow() {
    throw new BadRequestException("Test error");
}
```

2. Gọi API và trả lời:
   - Response status code là gì?
   - Response body format như thế nào?
   - Trace ID có giá trị gì?

### Đáp án
- Status: 400
- Body: CommonResponse format với responseCode="400"
- Trace ID: UUID được generate tự động

---

## 📝 Bài Tập 2: Tạo Custom Exception

### Mục tiêu
Tạo exception mới cho nghiệp vụ cụ thể

### Yêu cầu
1. Tạo `InsufficientStockException` cho Fabric module
2. Thêm handler trong `GlobalExceptionHandler`
3. Sử dụng trong `FabricService` khi hết hàng

### Code mẫu
```java
// 1. Tạo exception
public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
}

// 2. Thêm handler
@ExceptionHandler(InsufficientStockException.class)
public ResponseEntity<CommonResponse<Object>> handleInsufficientStock(
    InsufficientStockException ex
) {
    String traceId = TraceIdUtil.getOrCreateTraceId();
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ResponseUtil.error(traceId, "INSUFFICIENT_STOCK", ex.getMessage()));
}

// 3. Sử dụng
if (fabric.getQuantity() < requestedQuantity) {
    throw new InsufficientStockException(
        "Not enough stock. Available: " + fabric.getQuantity() + 
        ", Requested: " + requestedQuantity
    );
}
```

---

## 📝 Bài Tập 3: Cải Thiện Validation Message

### Mục tiêu
Làm validation message dễ hiểu hơn

### Yêu cầu
1. Thay đổi message trong `handleValidation` để:
   - Tiếng Việt
   - Dễ hiểu hơn
   - Format đẹp hơn

### Code mẫu
```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<CommonResponse<Object>> handleValidation(
    MethodArgumentNotValidException ex
) {
    // Map field name sang tiếng Việt
    Map<String, String> fieldNames = Map.of(
        "customerId", "Mã khách hàng",
        "total", "Tổng tiền",
        "email", "Email"
    );
    
    String msg = ex.getBindingResult().getFieldErrors().stream()
        .map(e -> {
            String fieldName = fieldNames.getOrDefault(e.getField(), e.getField());
            return fieldName + ": " + e.getDefaultMessage();
        })
        .collect(Collectors.joining("; "));
    
    String traceId = TraceIdUtil.getOrCreateTraceId();
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ResponseUtil.error(traceId, "400", msg));
}
```

---

## 📝 Bài Tập 4: Xử Lý Exception Có Data

### Mục tiêu
Trả về error response có kèm data (như CsvBatchException)

### Yêu cầu
1. Tạo `ValidationErrorResponse` exception
2. Exception chứa Map<String, String> fieldErrors
3. Handler trả về fieldErrors trong responseData

### Code mẫu
```java
// Exception
@Getter
public class ValidationErrorResponse extends RuntimeException {
    private final Map<String, String> fieldErrors;
    
    public ValidationErrorResponse(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
}

// Handler
@ExceptionHandler(ValidationErrorResponse.class)
public ResponseEntity<CommonResponse<Map<String, String>>> handleValidationError(
    ValidationErrorResponse ex
) {
    String traceId = TraceIdUtil.getOrCreateTraceId();
    CommonResponse<Map<String, String>> response = ResponseUtil.error(
        traceId, "VALIDATION_ERROR", ex.getMessage()
    );
    response.setResponseData(ex.getFieldErrors());
    return ResponseEntity.badRequest().body(response);
}
```

---

## 📝 Bài Tập 5: Logging và Monitoring

### Mục tiêu
Thêm logging để debug và monitor

### Yêu cầu
1. Thêm log cho mỗi exception handler
2. Log level phù hợp (ERROR cho lỗi nghiêm trọng, WARN cho validation)
3. Log kèm trace ID

### Code mẫu
```java
@ExceptionHandler(BusinessException.class)
public ResponseEntity<CommonResponse<Object>> handleBusinessException(
    BusinessException ex
) {
    String traceId = TraceIdUtil.getOrCreateTraceId();
    
    // Log với trace ID để dễ tracking
    log.error("BusinessException [traceId={}]: code={}, message={}", 
        traceId, ex.getErrorCode(), ex.getMessage());
    
    return ResponseEntity.badRequest()
        .body(ResponseUtil.error(traceId, ex.getErrorCode(), ex.getMessage()));
}
```

---

## 📝 Bài Tập 6: Error Code Enum

### Mục tiêu
Tạo ErrorCode enum để quản lý error codes tập trung

### Yêu cầu
1. Tạo enum `ErrorCode` với các error codes
2. Sử dụng trong AppException
3. Dễ maintain và mở rộng

### Code mẫu
```java
public enum ErrorCode implements AppException.ErrorCode {
    USER_NOT_FOUND(404, "User not found", HttpStatus.NOT_FOUND),
    ORDER_NOT_FOUND(404, "Order not found", HttpStatus.NOT_FOUND),
    INSUFFICIENT_STOCK(400, "Insufficient stock", HttpStatus.BAD_REQUEST),
    INVALID_STATUS(400, "Invalid status", HttpStatus.BAD_REQUEST);
    
    private final int code;
    private final String message;
    private final HttpStatus statusCode;
    
    ErrorCode(int code, String message, HttpStatus statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
    
    // Getters...
}

// Sử dụng
throw new AppException(ErrorCode.USER_NOT_FOUND);
```

---

## ✅ Checklist Hoàn Thành

- [ ] Bài tập 1: Hiểu flow cơ bản
- [ ] Bài tập 2: Tạo custom exception
- [ ] Bài tập 3: Cải thiện validation message
- [ ] Bài tập 4: Exception có data
- [ ] Bài tập 5: Logging và monitoring
- [ ] Bài tập 6: Error code enum

---

## 🎯 Tips

1. **Làm từng bài một** - Đừng nhảy cóc
2. **Test kỹ** - Dùng Postman test từng case
3. **Đọc log** - Xem log để hiểu flow
4. **Đặt câu hỏi** - Tại sao làm như vậy?
5. **Refactor** - Cải thiện code sau khi làm xong

---

## 📚 Tài Liệu Tham Khảo

- Xem code trong `GlobalExceptionHandler.java`
- Xem code trong `OrderServiceImpl.java`
- Test với `TestExceptionController.java`


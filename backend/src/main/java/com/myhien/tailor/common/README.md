# Common Response/Request Utilities

## 📦 Classes

### 1. CommonResponse<T>
Wrapper class cho tất cả API responses, đảm bảo format nhất quán.

**Structure:**
```json
{
  "requestTrace": "uuid-trace-id",
  "responseDateTime": "2025-01-15T10:30:00+07:00",
  "responseStatus": {
    "responseCode": "200",
    "responseMessage": "SUCCESS"
  },
  "responseData": { ... }
}
```

### 2. CommonRequest<T>
Wrapper class cho request parameters (tùy chọn sử dụng).

### 3. ResponseUtil
Utility class để tạo CommonResponse dễ dàng.

**Methods:**
- `success(traceId, data)` - Success response với trace ID
- `success(data)` - Success response (auto generate trace ID)
- `error(traceId, code, message)` - Error response với trace ID
- `error(code, message)` - Error response (auto generate trace ID)

### 4. TraceIdUtil
Utility để quản lý trace ID cho request tracking.

**Methods:**
- `getOrCreateTraceId()` - Lấy từ header `X-Trace-Id` hoặc generate mới
- `getTraceId()` - Lấy trace ID hiện tại

### 5. ResponseAdvice
Tự động wrap tất cả responses từ controllers thành CommonResponse format.

## 🚀 Usage

### Trong Controller (Manual)

```java
@GetMapping("/{id}")
public CommonResponse<OrderResponseDTO> findById(@PathVariable Long id) {
    String traceId = TraceIdUtil.getOrCreateTraceId();
    OrderResponseDTO data = orderService.findById(id);
    return ResponseUtil.success(traceId, data);
}
```

### Trong Controller (Auto-wrap)

```java
@GetMapping("/{id}")
public OrderResponseDTO findById(@PathVariable Long id) {
    // ResponseAdvice sẽ tự động wrap thành CommonResponse
    return orderService.findById(id);
}
```

### Error Response

```java
@ExceptionHandler(BusinessException.class)
public ResponseEntity<CommonResponse<Object>> handleException(BusinessException ex) {
    String traceId = TraceIdUtil.getOrCreateTraceId();
    return ResponseEntity.badRequest()
        .body(ResponseUtil.error(traceId, ex.getErrorCode(), ex.getMessage()));
}
```

## 📝 Notes

- ResponseAdvice tự động wrap responses từ `com.myhien.tailor.modules` package
- Trace ID được lấy từ header `X-Trace-Id` hoặc auto-generate
- Format datetime: ISO 8601 với timezone (yyyy-MM-dd'T'HH:mm:ssXXX)


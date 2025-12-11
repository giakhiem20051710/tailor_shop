# 🤔 Tại Sao Dùng BusinessException Thay Vì NotFoundException?

## 📊 So Sánh 2 Loại Exception

### BusinessException
```java
// Có ErrorCode chi tiết
throw new BusinessException("ORDER_NOT_FOUND", "Order not found");
// → HTTP 400 (BAD_REQUEST)
// → responseCode: "ORDER_NOT_FOUND"
```

### NotFoundException
```java
// Chỉ có message
throw new NotFoundException("Order not found");
// → HTTP 404 (NOT_FOUND)
// → responseCode: "404"
```

---

## 🔍 Sự Khác Biệt Chính

| Tiêu chí | BusinessException | NotFoundException |
|----------|-------------------|-------------------|
| **HTTP Status** | 400 (BAD_REQUEST) | 404 (NOT_FOUND) |
| **ErrorCode** | ✅ Có (chi tiết) | ❌ Không (chỉ "404") |
| **Mục đích** | Lỗi nghiệp vụ | Resource không tồn tại |
| **Client xử lý** | Dựa vào errorCode | Dựa vào HTTP status |

---

## 💡 Khi Nào Dùng Cái Nào?

### ✅ Dùng BusinessException Khi:

1. **Lỗi nghiệp vụ có nhiều loại**
```java
// Cùng là "not found" nhưng có nhiều loại:
throw new BusinessException("ORDER_NOT_FOUND", "Order not found");
throw new BusinessException("ORDER_DELETED", "Order has been deleted");
throw new BusinessException("ORDER_CANCELLED", "Order has been cancelled");

// Client có thể xử lý khác nhau dựa vào errorCode
if (errorCode == "ORDER_DELETED") {
    // Hiển thị: "Đơn hàng đã bị xóa"
} else if (errorCode == "ORDER_CANCELLED") {
    // Hiển thị: "Đơn hàng đã bị hủy"
}
```

2. **Cần phân biệt nhiều trường hợp**
```java
// BusinessException với errorCode rõ ràng
throw new BusinessException("INSUFFICIENT_STOCK", "Not enough fabric");
throw new BusinessException("FABRIC_NOT_AVAILABLE", "Fabric is not available");
throw new BusinessException("FABRIC_OUT_OF_STOCK", "Fabric is out of stock");

// Client biết chính xác lỗi gì để xử lý phù hợp
```

3. **Cần tracking/logging theo errorCode**
```java
// Dễ dàng track lỗi theo errorCode
log.error("Business error [code={}]: {}", ex.getErrorCode(), ex.getMessage());

// Có thể thống kê: "ORDER_NOT_FOUND" xảy ra bao nhiêu lần
```

### ✅ Dùng NotFoundException Khi:

1. **Resource thực sự không tồn tại (RESTful)**
```java
// RESTful API chuẩn: Resource không tồn tại → 404
@GetMapping("/users/{id}")
public UserResponseDTO getUser(@PathVariable Long id) {
    return userService.findById(id)
        .orElseThrow(() -> new NotFoundException("User not found"));
}
// → HTTP 404 (chuẩn REST)
```

2. **Lỗi đơn giản, không cần phân loại**
```java
// Chỉ cần biết "không tìm thấy", không cần biết lý do
throw new NotFoundException("Product not found");
```

3. **Theo chuẩn HTTP**
```java
// HTTP 404 = Resource không tồn tại
// Phù hợp với RESTful API design
```

---

## 🎯 Vấn Đề Trong Code Hiện Tại

### ❌ Code hiện tại (chưa tối ưu):
```java
// OrderServiceImpl.java
OrderEntity entity = orderRepository.findById(id)
    .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "Order not found"));
// → HTTP 400, nhưng thực ra nên là 404
```

### ✅ Nên sửa thành:
```java
// Option 1: Dùng NotFoundException (RESTful)
OrderEntity entity = orderRepository.findById(id)
    .orElseThrow(() -> new NotFoundException("Order not found"));
// → HTTP 404 (chuẩn REST)

// Option 2: Dùng BusinessException nếu cần errorCode chi tiết
OrderEntity entity = orderRepository.findById(id)
    .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "Order not found"));
// → HTTP 400 với errorCode "ORDER_NOT_FOUND"
```

---

## 📋 Best Practices

### 1. RESTful API → Dùng NotFoundException
```java
// GET /users/{id} → User không tồn tại
throw new NotFoundException("User not found");
// → HTTP 404 (chuẩn REST)
```

### 2. Business Logic → Dùng BusinessException
```java
// Lỗi nghiệp vụ phức tạp
if (order.getStatus() == OrderStatus.CANCELLED) {
    throw new BusinessException("ORDER_ALREADY_CANCELLED", 
        "Cannot update cancelled order");
}
// → HTTP 400 với errorCode chi tiết
```

### 3. Kết Hợp Cả 2
```java
public OrderResponseDTO findById(Long id) {
    // NotFoundException cho RESTful
    OrderEntity entity = orderRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Order not found"));
    
    // BusinessException cho business rules
    if (entity.getIsDeleted()) {
        throw new BusinessException("ORDER_DELETED", 
            "Order has been deleted");
    }
    
    return toResponseDTO(entity);
}
```

---

## 🔧 Cải Thiện Code

### Option 1: Tách rõ ràng (Khuyến nghị)
```java
// Repository layer → NotFoundException
public OrderEntity findById(Long id) {
    return orderRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Order not found"));
}

// Service layer → BusinessException cho business rules
public OrderResponseDTO getOrder(Long id) {
    OrderEntity entity = findById(id); // Có thể throw NotFoundException
    
    // Business rules
    if (entity.getIsDeleted()) {
        throw new BusinessException("ORDER_DELETED", "Order has been deleted");
    }
    
    if (entity.getStatus() == OrderStatus.CANCELLED) {
        throw new BusinessException("ORDER_CANCELLED", "Order is cancelled");
    }
    
    return toResponseDTO(entity);
}
```

### Option 2: Dùng BusinessException cho tất cả (Hiện tại)
```java
// Tất cả đều dùng BusinessException với errorCode
throw new BusinessException("ORDER_NOT_FOUND", "Order not found");
throw new BusinessException("ORDER_DELETED", "Order has been deleted");
// → Dễ tracking, nhưng không RESTful (HTTP 400 thay vì 404)
```

---

## 🎓 Kết Luận

### Khi nào dùng BusinessException?
- ✅ Lỗi nghiệp vụ phức tạp
- ✅ Cần errorCode chi tiết
- ✅ Client cần phân biệt nhiều loại lỗi
- ✅ Cần tracking/logging theo errorCode

### Khi nào dùng NotFoundException?
- ✅ Resource không tồn tại (RESTful)
- ✅ Lỗi đơn giản, không cần phân loại
- ✅ Muốn theo chuẩn HTTP (404)

### Recommendation cho Project
**Kết hợp cả 2:**
- `NotFoundException` cho "không tìm thấy" (RESTful)
- `BusinessException` cho "lỗi nghiệp vụ" (business rules)

---

## 📝 Ví Dụ Thực Tế

### Scenario 1: Tìm Order
```java
// GET /orders/{id}
public OrderResponseDTO findById(Long id) {
    // NotFoundException (RESTful)
    OrderEntity entity = orderRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Order not found"));
    
    return toResponseDTO(entity);
}
```

### Scenario 2: Cập nhật Order
```java
// PUT /orders/{id}
public OrderResponseDTO update(Long id, OrderRequestDTO request) {
    // NotFoundException (RESTful)
    OrderEntity entity = orderRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Order not found"));
    
    // BusinessException (business rules)
    if (entity.getStatus() == OrderStatus.DONE) {
        throw new BusinessException("ORDER_ALREADY_DONE", 
            "Cannot update completed order");
    }
    
    // Update logic...
}
```

### Scenario 3: Xóa Order
```java
// DELETE /orders/{id}
public void delete(Long id) {
    // NotFoundException (RESTful)
    OrderEntity entity = orderRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Order not found"));
    
    // BusinessException (business rules)
    if (entity.getStatus() == OrderStatus.DONE) {
        throw new BusinessException("CANNOT_DELETE_DONE_ORDER", 
            "Cannot delete completed order");
    }
    
    entity.setIsDeleted(true);
    orderRepository.save(entity);
}
```

---

## ✅ Tóm Tắt

| Tình huống | Exception | HTTP Status | Lý do |
|-----------|-----------|-------------|-------|
| Order không tồn tại | NotFoundException | 404 | RESTful |
| Order đã bị xóa | BusinessException | 400 | Business rule |
| Order đã hoàn thành | BusinessException | 400 | Business rule |
| Không đủ vải | BusinessException | 400 | Business rule |
| User không tồn tại | NotFoundException | 404 | RESTful |

**Rule of thumb:**
- **404** = Resource không tồn tại (RESTful)
- **400** = Lỗi nghiệp vụ (Business rules)


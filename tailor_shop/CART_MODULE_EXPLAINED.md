# Cart Module - Tài liệu chi tiết

## 1. Tổng quan

**Cart Module** là module riêng biệt quản lý giỏ hàng của khách hàng, được thiết kế để tái sử dụng cho nhiều loại sản phẩm (Product, Fabric, Service, ...). Module này tuân theo nguyên tắc **Single Responsibility** và **Domain-Driven Design**.

### 1.1. Lý do tách Cart thành module riêng

1. **Tái sử dụng**: Cart có thể chứa nhiều loại sản phẩm khác nhau
2. **Domain riêng**: Cart có lifecycle và business logic riêng biệt
3. **Mở rộng**: Dễ dàng thêm tính năng như save for later, wishlist, ...
4. **Maintainability**: Code dễ bảo trì và test hơn

### 1.2. Kiến trúc

```
Cart Module
├── Domain Layer
│   ├── CartItemEntity (generic: item_type + item_id)
│   └── CartItemType (PRODUCT, FABRIC, SERVICE)
├── DTO Layer
│   ├── AddToCartRequest (generic)
│   ├── CartItemResponse (generic)
│   └── CartSummaryResponse
├── Repository Layer
│   └── CartItemRepository
├── Service Layer
│   ├── CartService (interface)
│   └── CartServiceImpl (implementation)
└── Controller Layer
    └── CartController
```

## 2. Data Model

### 2.1. CartItemEntity

```java
@Entity
@Table(name = "cart_items")
public class CartItemEntity {
    private Long id;
    private UserEntity user;
    private CartItemType itemType;  // PRODUCT, FABRIC, SERVICE
    private Long itemId;            // ID của sản phẩm
    private BigDecimal quantity;
    private OffsetDateTime addedAt;
    private OffsetDateTime updatedAt;
}
```

**Đặc điểm**:
- **Generic design**: Sử dụng `item_type` + `item_id` thay vì foreign key trực tiếp
- **Unique constraint**: `(user_id, item_type, item_id)` - mỗi user chỉ có 1 cart item cho mỗi sản phẩm
- **Soft delete**: Không có `is_deleted` (xóa trực tiếp khi remove)

### 2.2. CartItemType Enum

```java
public enum CartItemType {
    PRODUCT,  // Sản phẩm từ Product module
    FABRIC,   // Vải từ Fabric module
    SERVICE   // Dịch vụ (có thể mở rộng sau)
}
```

## 3. API Endpoints

### 3.1. Thêm vào giỏ hàng

**Endpoint**: `POST /api/v1/cart`

**Request**:
```json
{
  "itemType": "FABRIC",
  "itemId": 1,
  "quantity": 5.0
}
```

**Response**:
```json
{
  "traceId": "xxx",
  "success": true,
  "data": {
    "id": 1,
    "itemType": "FABRIC",
    "itemId": 1,
    "itemName": "Vải Cotton",
    "itemCode": "FAB-001",
    "itemImage": "https://...",
    "itemPrice": 100000,
    "quantity": 5.0,
    "subtotal": 500000,
    "availableQuantity": 100.0,
    "isAvailable": true,
    "addedAt": "2024-01-01T10:00:00Z"
  }
}
```

**Validation**:
- `itemType` phải là một trong: PRODUCT, FABRIC, SERVICE
- `itemId` phải tồn tại và sản phẩm phải available
- `quantity` phải > 0 và <= available quantity

### 3.2. Xem giỏ hàng

**Endpoint**: `GET /api/v1/cart`

**Response**:
```json
{
  "traceId": "xxx",
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "itemType": "FABRIC",
        "itemId": 1,
        "itemName": "Vải Cotton",
        "itemCode": "FAB-001",
        "itemPrice": 100000,
        "quantity": 5.0,
        "subtotal": 500000,
        "availableQuantity": 100.0,
        "isAvailable": true
      }
    ],
    "itemCount": 1,
    "subtotal": 500000,
    "discountAmount": 0,
    "shippingFee": 0,
    "total": 500000,
    "hasAvailableItems": true
  }
}
```

### 3.3. Cập nhật số lượng

**Endpoint**: `PUT /api/v1/cart/{id}?quantity=10.0`

**Validation**:
- `quantity` phải > 0
- Nếu `quantity` = 0, item sẽ bị xóa khỏi giỏ hàng
- `quantity` không được vượt quá available quantity

### 3.4. Xóa khỏi giỏ hàng

**Endpoint**: `DELETE /api/v1/cart/{id}`

### 3.5. Xóa toàn bộ giỏ hàng

**Endpoint**: `DELETE /api/v1/cart`

## 4. Service Logic

### 4.1. AddToCart Flow

```
1. Validate user exists
2. Validate item based on type:
   - FABRIC: Check fabric exists, available, quantity sufficient
   - PRODUCT: TODO (khi có ProductService)
   - SERVICE: TODO (khi có ServiceService)
3. Find existing cart item or create new
4. Update quantity (add to existing)
5. Save and return CartItemResponse
```

### 4.2. GetCart Flow

```
1. Get all cart items for user
2. Enrich each item with details:
   - FABRIC: Load fabric details, calculate subtotal
   - PRODUCT: TODO
   - SERVICE: TODO
3. Calculate totals:
   - subtotal = sum of all item subtotals
   - discountAmount = 0 (calculated at checkout)
   - shippingFee = 0 (calculated at checkout)
   - total = subtotal
4. Check if all items are available
5. Return CartSummaryResponse
```

### 4.3. Validation Logic

**Fabric Item Validation**:
```java
private void validateFabricItem(Long fabricId, BigDecimal quantity) {
    // 1. Check fabric exists and not deleted
    FabricEntity fabric = fabricRepository.findById(fabricId)
        .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
        .orElseThrow(() -> new NotFoundException("Fabric not found"));
    
    // 2. Check fabric is available
    if (!Boolean.TRUE.equals(fabric.getIsAvailable())) {
        throw new BadRequestException("Fabric is not available");
    }
    
    // 3. Check available quantity
    BigDecimal availableQuantity = fabricInventoryRepository
        .sumAvailableQuantityByFabricId(fabric.getId());
    if (quantity.compareTo(availableQuantity) > 0) {
        throw new BadRequestException("Insufficient quantity");
    }
}
```

## 5. Integration với các Module khác

### 5.1. Fabric Module

Cart module tích hợp với Fabric module để:
- Validate fabric availability
- Get fabric details (name, price, image, ...)
- Check available quantity

**Dependency Injection**:
```java
@Service
public class CartServiceImpl implements CartService {
    private final FabricRepository fabricRepository;
    private final FabricInventoryRepository fabricInventoryRepository;
    
    // Validate và enrich fabric items
}
```

### 5.2. FabricOrder Module

FabricOrder module sử dụng Cart module để:
- Lấy cart items khi checkout
- Xóa cart items sau khi checkout thành công

**Usage trong FabricOrderServiceImpl**:
```java
// Get cart items from Cart module (only FABRIC type)
List<CartItemEntity> cartItems = cartItemRepository.findAllById(request.getCartItemIds());

// Filter only FABRIC items
cartItems = cartItems.stream()
    .filter(item -> CartItemType.FABRIC.equals(item.getItemType()))
    .collect(Collectors.toList());
```

## 6. Database Schema

### 6.1. Migration: V14__cart_module_tables.sql

```sql
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_type VARCHAR(50) NOT NULL,  -- PRODUCT, FABRIC, SERVICE
    item_id BIGINT NOT NULL,          -- ID của sản phẩm
    quantity DECIMAL(10,2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_cart_user_item (user_id, item_type, item_id),
    INDEX idx_cart_items_user (user_id),
    INDEX idx_cart_items_type_id (item_type, item_id)
);
```

**Indexes**:
- `idx_cart_items_user`: Tối ưu query theo user
- `idx_cart_items_type_id`: Tối ưu query theo item type và ID
- `uk_cart_user_item`: Unique constraint để tránh duplicate

## 7. Best Practices

### 7.1. Generic Design

- Sử dụng `item_type` + `item_id` thay vì foreign key trực tiếp
- Dễ dàng mở rộng cho các loại sản phẩm mới
- Không cần thay đổi database schema khi thêm loại sản phẩm mới

### 7.2. Validation Strategy

- Validate item existence và availability trong CartService
- Mỗi loại sản phẩm có validation logic riêng
- Sử dụng Strategy Pattern để validate theo item type

### 7.3. Enrichment Pattern

- Load item details khi get cart (lazy loading)
- Cache item details nếu cần (có thể implement sau)
- Tính subtotal sau khi enrich item details

## 8. Future Enhancements

1. **Save for Later**: Lưu items để mua sau
2. **Wishlist**: Danh sách yêu thích
3. **Cart Expiry**: Tự động xóa cart sau X ngày
4. **Cart Sharing**: Chia sẻ giỏ hàng với người khác
5. **Bulk Operations**: Thêm/xóa nhiều items cùng lúc
6. **Cart Templates**: Lưu giỏ hàng mẫu
7. **Product Recommendations**: Gợi ý sản phẩm dựa trên cart

## 9. Testing

### 9.1. Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {
    @Mock
    private CartItemRepository cartItemRepository;
    
    @Mock
    private FabricRepository fabricRepository;
    
    @InjectMocks
    private CartServiceImpl cartService;
    
    @Test
    void testAddToCart_Success() {
        // Test add fabric to cart
    }
    
    @Test
    void testAddToCart_InsufficientQuantity() {
        // Test validation
    }
}
```

### 9.2. Integration Tests

- Test với real database
- Test integration với Fabric module
- Test checkout flow với Cart module

## 10. Error Handling

### 10.1. Common Errors

| Error | HTTP Status | Message |
|-------|-------------|---------|
| Item not found | 404 | "Fabric not found" |
| Item not available | 400 | "Fabric is not available" |
| Insufficient quantity | 400 | "Insufficient quantity. Available: X" |
| Invalid item type | 400 | "Unsupported item type: X" |
| Cart item not found | 404 | "Cart item not found" |

## 11. Performance Considerations

1. **Indexes**: Đã có indexes cho `user_id` và `(item_type, item_id)`
2. **Lazy Loading**: Item details được load khi cần
3. **Batch Operations**: Có thể optimize bằng batch queries
4. **Caching**: Có thể cache item details nếu cần

## 12. Security

- **Authentication**: Tất cả endpoints yêu cầu `ROLE_CUSTOMER`
- **Authorization**: User chỉ có thể xem/sửa cart của chính mình
- **Validation**: Validate ownership trước khi update/delete

---

**Tác giả**: AI Assistant  
**Ngày tạo**: 2024  
**Version**: 1.0


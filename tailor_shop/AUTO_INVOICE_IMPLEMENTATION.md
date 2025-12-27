# Tự động tạo hóa đơn sau khi tạo đơn hàng

## Tổng quan
Triển khai tính năng tự động tạo hóa đơn ngay sau khi customer hoặc staff/admin tạo đơn hàng thành công.

## Các file đã thay đổi

### 1. `OrderServiceImpl.java`

#### Thay đổi 1: Thêm imports và dependencies
```java
// Thêm imports
import com.example.tailor_shop.modules.billing.service.InvoiceService;
import com.example.tailor_shop.modules.billing.dto.InvoiceRequest;
import lombok.extern.slf4j.Slf4j;

// Thêm annotation
@Slf4j

// Thêm dependency vào constructor
private final InvoiceService invoiceService;

public OrderServiceImpl(..., InvoiceService invoiceService) {
    ...
    this.invoiceService = invoiceService;
}
```

#### Thay đổi 2: Cập nhật method `create()`
**Vị trí:** Dòng 98-192

**Thay đổi:**
- Thêm parameter `Long currentUserId` vào method signature
- Thêm logic tự động tạo hóa đơn sau khi tạo đơn hàng thành công

```java
@Override
public OrderResponse create(OrderResquest request, java.util.List<MultipartFile> files, Long currentUserId) {
    // ... existing code ...
    
    addTimeline(order, order.getStatus(), "Order created");

    // Tự động tạo hóa đơn sau khi tạo đơn hàng
    try {
        createInvoiceForOrder(order, currentUserId);
    } catch (Exception e) {
        log.error("Failed to create invoice for order {}: {}", order.getId(), e.getMessage(), e);
        // Không throw exception để không block việc tạo order
    }

    return mapToDetail(order);
}
```

#### Thay đổi 3: Cập nhật method `createWizard()`
**Vị trí:** Dòng 234-343

**Thay đổi:**
- Thêm parameter `Long currentUserId` vào method signature
- Thêm logic tự động tạo hóa đơn sau khi tạo đơn hàng thành công

```java
@Override
public OrderResponse createWizard(OrderWizardRequest request, Long currentUserId) {
    // ... existing code ...
    
    addTimeline(order, order.getStatus(), "Order created via wizard");
    
    // Tự động tạo hóa đơn sau khi tạo đơn hàng
    try {
        createInvoiceForOrder(order, currentUserId);
    } catch (Exception e) {
        log.error("Failed to create invoice for order {}: {}", order.getId(), e.getMessage(), e);
        // Không throw exception để không block việc tạo order
    }
    
    // ... existing appointment creation code ...
}
```

#### Thay đổi 4: Thêm method `createInvoiceForOrder()`
**Vị trí:** Dòng 625-642

**Mục đích:** Method chính để tự động tạo hóa đơn từ đơn hàng

```java
/**
 * Tự động tạo hóa đơn cho đơn hàng sau khi đơn hàng được tạo thành công.
 * 
 * @param order Đơn hàng đã được tạo
 * @param currentUserId ID của user hiện tại (có thể là null nếu tạo tự động)
 */
private void createInvoiceForOrder(OrderEntity order, Long currentUserId) {
    try {
        // Kiểm tra xem đơn hàng có items không
        java.util.List<OrderItemEntity> orderItems = orderItemRepository.findByOrder(order);
        if (orderItems == null || orderItems.isEmpty()) {
            log.debug("Skipping invoice creation for order {}: no items found", order.getId());
            return;
        }

        // Tìm staffId: ưu tiên tailorId, sau đó tìm staff mặc định
        Long staffId = findStaffIdForInvoice(order, currentUserId);
        if (staffId == null) {
            log.warn("Cannot create invoice for order {}: no staff found", order.getId());
            return;
        }

        // Tạo InvoiceRequest từ OrderEntity
        InvoiceRequest invoiceRequest = buildInvoiceRequestFromOrder(order, staffId);

        // Tạo hóa đơn
        invoiceService.create(invoiceRequest, currentUserId);
        log.info("Successfully created invoice for order {}", order.getId());
    } catch (Exception e) {
        log.error("Error creating invoice for order {}: {}", order.getId(), e.getMessage(), e);
        throw e;
    }
}
```

#### Thay đổi 5: Thêm method `findStaffIdForInvoice()`
**Vị trí:** Dòng 644-692

**Mục đích:** Tìm staffId phù hợp để tạo hóa đơn theo thứ tự ưu tiên

```java
/**
 * Tìm staffId để tạo hóa đơn.
 * Ưu tiên: 1) tailorId từ order, 2) currentUserId nếu là staff/admin, 3) staff mặc định
 */
private Long findStaffIdForInvoice(OrderEntity order, Long currentUserId) {
    // Ưu tiên 1: Sử dụng tailorId nếu có và tailor có role STAFF hoặc ADMIN
    if (order.getTailor() != null) {
        UserEntity tailor = order.getTailor();
        String roleCode = tailor.getRole() != null ? tailor.getRole().getCode() : null;
        if ("STAFF".equalsIgnoreCase(roleCode) || "ADMIN".equalsIgnoreCase(roleCode)) {
            log.debug("Using tailor {} as staff for invoice", tailor.getId());
            return tailor.getId();
        }
    }

    // Ưu tiên 2: Sử dụng currentUserId nếu là staff/admin
    if (currentUserId != null) {
        UserEntity currentUser = userRepository.findById(currentUserId).orElse(null);
        if (currentUser != null) {
            String roleCode = currentUser.getRole() != null ? currentUser.getRole().getCode() : null;
            if ("STAFF".equalsIgnoreCase(roleCode) || "ADMIN".equalsIgnoreCase(roleCode)) {
                log.debug("Using current user {} as staff for invoice", currentUserId);
                return currentUserId;
            }
        }
    }

    // Ưu tiên 3: Tìm staff mặc định (ưu tiên ADMIN, sau đó STAFF)
    Page<UserEntity> adminPage = userRepository.findByRole_CodeAndIsDeletedFalse("ADMIN", PageRequest.of(0, 1));
    if (!adminPage.isEmpty()) {
        Long adminId = adminPage.getContent().get(0).getId();
        log.debug("Using default admin {} as staff for invoice", adminId);
        return adminId;
    }

    Page<UserEntity> staffPage = userRepository.findByRole_CodeAndIsDeletedFalse("STAFF", PageRequest.of(0, 1));
    if (!staffPage.isEmpty()) {
        Long staffId = staffPage.getContent().get(0).getId();
        log.debug("Using default staff {} as staff for invoice", staffId);
        return staffId;
    }

    log.warn("No staff found for invoice creation");
    return null;
}
```

#### Thay đổi 6: Thêm method `buildInvoiceRequestFromOrder()`
**Vị trí:** Dòng 694-727

**Mục đích:** Chuyển đổi OrderEntity và OrderItems thành InvoiceRequest

```java
/**
 * Xây dựng InvoiceRequest từ OrderEntity
 */
private InvoiceRequest buildInvoiceRequestFromOrder(OrderEntity order, Long staffId) {
    InvoiceRequest request = new InvoiceRequest();
    request.setOrderId(order.getId());
    request.setCustomerId(order.getCustomer().getId());
    request.setStaffId(staffId);
    request.setCurrency("VND"); // Mặc định VND, có thể config sau
    request.setDiscountAmount(BigDecimal.ZERO);
    request.setTaxAmount(BigDecimal.ZERO);
    request.setDueDate(order.getDueDate() != null ? order.getDueDate() : 
                      java.time.LocalDate.now().plusDays(30)); // Mặc định 30 ngày
    request.setNotes("Hóa đơn tự động tạo từ đơn hàng " + order.getCode());

    // Chuyển đổi OrderItems thành InvoiceItems
    java.util.List<OrderItemEntity> orderItems = orderItemRepository.findByOrder(order);
    java.util.List<InvoiceRequest.ItemRequest> invoiceItems = orderItems.stream()
            .map(item -> {
                InvoiceRequest.ItemRequest invoiceItem = new InvoiceRequest.ItemRequest();
                invoiceItem.setName(item.getProductName() != null ? item.getProductName() : "Sản phẩm");
                invoiceItem.setQuantity(item.getQuantity());
                invoiceItem.setUnitPrice(item.getUnitPrice());
                invoiceItem.setDiscountAmount(BigDecimal.ZERO);
                invoiceItem.setTaxRate(BigDecimal.ZERO);
                return invoiceItem;
            })
            .collect(Collectors.toList());

    request.setItems(invoiceItems);
    return request;
}
```

---

### 2. `OrderController.java`

#### Thay đổi 1: Cập nhật method `create()`
**Vị trí:** Dòng 79-85

**Thay đổi:**
- Thêm parameter `@AuthenticationPrincipal CustomUserDetails principal`
- Truyền `currentUserId` vào `orderService.create()`

```java
@PostMapping(consumes = {"application/json"})
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public ResponseEntity<CommonResponse<OrderResponse>> create(
        @Valid @RequestBody OrderResquest request,
        @AuthenticationPrincipal CustomUserDetails principal) {
    OrderResponse data = orderService.create(request, null, principal != null ? principal.getId() : null);
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
}
```

#### Thay đổi 2: Cập nhật method `createWithFiles()`
**Vị trí:** Dòng 89-99

**Thay đổi:**
- Truyền `currentUserId` vào `orderService.create()`

```java
@PostMapping(consumes = {"multipart/form-data"})
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public ResponseEntity<CommonResponse<OrderResponse>> createWithFiles(
        @RequestPart("request") @Valid OrderResquest request,
        @RequestPart(value = "files", required = false) java.util.List<org.springframework.web.multipart.MultipartFile> files,
        @AuthenticationPrincipal CustomUserDetails principal
) {
    OrderResponse data = orderService.create(
            request, 
            files != null ? files : java.util.Collections.emptyList(),
            principal != null ? principal.getId() : null
    );
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
}
```

#### Thay đổi 3: Cập nhật method `createWizard()`
**Vị trí:** Dòng 101-118

**Thay đổi:**
- Truyền `currentUserId` vào `orderService.createWizard()`

```java
@PostMapping("/wizard")
@PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
public ResponseEntity<CommonResponse<OrderResponse>> createWizard(
        @Valid @RequestBody OrderWizardRequest request,
        @AuthenticationPrincipal CustomUserDetails principal
) {
    // ... existing validation code ...
    
    OrderResponse data = orderService.createWizard(request, principal != null ? principal.getId() : null);
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
}
```

---

## Luồng hoạt động

### Khi tạo đơn hàng:

1. **User tạo đơn hàng** (qua `create()` hoặc `createWizard()`)
2. **OrderService tạo đơn hàng** và lưu vào database
3. **Tự động gọi `createInvoiceForOrder()`**:
   - Kiểm tra đơn hàng có items không
   - Tìm staffId phù hợp (theo thứ tự ưu tiên)
   - Xây dựng InvoiceRequest từ OrderEntity
   - Gọi `invoiceService.create()` để tạo hóa đơn
4. **Trả về OrderResponse** (có hoặc không có hóa đơn)

### Thứ tự ưu tiên tìm staffId:

1. **Tailor của đơn hàng** (nếu có role STAFF/ADMIN)
2. **User hiện tại** (nếu là STAFF/ADMIN)
3. **Admin mặc định** (tìm trong database)
4. **Staff mặc định** (tìm trong database)

## Xử lý lỗi

- Nếu đơn hàng không có items → Bỏ qua, không tạo hóa đơn
- Nếu không tìm thấy staff → Log warning, bỏ qua (không block việc tạo đơn hàng)
- Nếu tạo hóa đơn thất bại → Log error, nhưng không throw exception (không block việc tạo đơn hàng)

## Cấu hình mặc định

- **Currency:** "VND" (có thể config sau)
- **Discount:** 0
- **Tax:** 0
- **Due Date:** 
  - Nếu order có `dueDate` → sử dụng `dueDate` của order
  - Nếu không → 30 ngày sau ngày hiện tại

## Logging

- **DEBUG:** Khi bỏ qua tạo hóa đơn (không có items, không tìm thấy staff)
- **INFO:** Khi tạo hóa đơn thành công
- **WARN:** Khi không tìm thấy staff
- **ERROR:** Khi có lỗi trong quá trình tạo hóa đơn

## Lưu ý

1. Hóa đơn chỉ được tạo khi đơn hàng có items
2. Việc tạo hóa đơn không block việc tạo đơn hàng (nếu thất bại, chỉ log error)
3. StaffId được tìm tự động theo thứ tự ưu tiên
4. Tất cả order items được chuyển đổi thành invoice items với cùng giá và số lượng


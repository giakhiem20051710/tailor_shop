# Best Practices: Khi Nào Dùng Event, Khi Nào Không

## ❌ KHÔNG DÙNG EVENT KHI:

### 1. Validate Promo Code
```java
// ❌ SAI - Không dùng event để validate
public void validatePromoCode(String code) {
    eventPublisher.publishEvent(new ValidatePromoCodeEvent(code));
    // ❌ Vấn đề: Validation phải synchronous, phải trả kết quả ngay
}

// ✅ ĐÚNG - Validate trực tiếp
public void validatePromoCode(String code) {
    PromotionEntity promotion = repository.findByCode(code)
        .orElseThrow(() -> new NotFoundException("Code not found"));
    
    if (!ACTIVE.equals(promotion.getStatus())) {
        throw new BadRequestException("Promotion not active");
    }
    // ✅ Synchronous validation, trả kết quả ngay
}
```

### 2. Calculate Discount
```java
// ❌ SAI - Không dùng event để calculate
public BigDecimal calculateDiscount(String code, BigDecimal amount) {
    eventPublisher.publishEvent(new CalculateDiscountEvent(code, amount));
    // ❌ Vấn đề: Calculation phải trả kết quả ngay, không thể async
}

// ✅ ĐÚNG - Calculate trực tiếp
public BigDecimal calculateDiscount(PromotionEntity promotion, BigDecimal orderAmount) {
    if (promotion.getType() == PERCENTAGE) {
        return orderAmount.multiply(promotion.getDiscountPercentage())
            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }
    // ✅ Synchronous calculation, trả kết quả ngay
}
```

### 3. Check Eligibility
```java
// ❌ SAI - Không dùng event để check eligibility
public boolean isEligible(String code, Long userId) {
    eventPublisher.publishEvent(new CheckEligibilityEvent(code, userId));
    // ❌ Vấn đề: Check phải trả kết quả ngay
}

// ✅ ĐÚNG - Check trực tiếp
public boolean isEligible(PromotionEntity promotion, Long userId, BigDecimal orderAmount) {
    // Check dates
    if (today.isBefore(promotion.getStartDate())) return false;
    if (today.isAfter(promotion.getEndDate())) return false;
    
    // Check min order value
    if (orderAmount.compareTo(promotion.getMinOrderValue()) < 0) return false;
    
    // ✅ Synchronous check, trả kết quả ngay
    return true;
}
```

### 4. Apply Promo Code (Business Logic Chính)
```java
// ❌ SAI - Publish event trong business logic chính
public ApplyPromoCodeResponse applyPromoCode(ApplyPromoCodeRequest request) {
    // Validate
    validatePromoCode(request.getCode());
    
    // Calculate
    BigDecimal discount = calculateDiscount(promotion, request.getOrderAmount());
    
    // ❌ SAI - Publish event ở đây
    eventPublisher.publishEvent(new PromotionAppliedEvent(...));
    
    return response;
    // ❌ Vấn đề: Event được publish trước khi thực sự apply (chưa lưu vào DB)
}

// ✅ ĐÚNG - Chỉ làm business logic, KHÔNG publish event
public ApplyPromoCodeResponse applyPromoCode(ApplyPromoCodeRequest request, Long userId) {
    // 1. Validate (synchronous)
    PromotionEntity promotion = validateAndFindPromotion(request.getCode());
    
    // 2. Check eligibility (synchronous)
    checkEligibility(promotion, userId, request.getOrderAmount());
    
    // 3. Calculate discount (synchronous)
    BigDecimal discount = calculateDiscount(promotion, request.getOrderAmount());
    BigDecimal finalAmount = request.getOrderAmount().subtract(discount);
    
    // 4. Return response (KHÔNG publish event ở đây)
    return ApplyPromoCodeResponse.builder()
        .promotionId(promotion.getId())
        .code(promotion.getCode())
        .discountAmount(discount)
        .finalAmount(finalAmount)
        .build();
    
    // ✅ Event chỉ được publish SAU KHI đã lưu vào database (khi tạo order/invoice)
}
```

---

## ✅ DÙNG EVENT KHI:

### 1. Side Effects (Tác Động Phụ)

**Sau khi business logic đã hoàn thành:**

```java
// ✅ ĐÚNG - Publish event SAU KHI đã lưu vào database
@Transactional
public void recordPromotionUsage(Long promotionId, Long userId, Long orderId, BigDecimal discount) {
    // 1. Business logic: Lưu vào database
    PromotionUsageEntity usage = PromotionUsageEntity.builder()
        .promotionId(promotionId)
        .userId(userId)
        .orderId(orderId)
        .discountAmount(discount)
        .build();
    repository.save(usage);
    
    // 2. Publish event SAU KHI đã lưu thành công
    PromotionAppliedEvent event = PromotionAppliedEvent.builder()
        .promotionId(promotionId)
        .userId(userId)
        .orderId(orderId)
        .discountAmount(discount)
        .appliedAt(OffsetDateTime.now())
        .build();
    eventPublisher.publishEvent(event);
    
    // ✅ Event được publish SAU KHI business logic đã hoàn thành
}
```

### 2. Notification (Thông Báo)

```java
@EventListener
@Async
public void handlePromotionApplied(PromotionAppliedEvent event) {
    // ✅ Gửi email notification (side effect)
    emailService.sendPromotionAppliedEmail(event.getUserId(), event);
}
```

### 3. Analytics (Phân Tích)

```java
@EventListener
@Async
public void handlePromotionApplied(PromotionAppliedEvent event) {
    // ✅ Track analytics (side effect)
    analyticsService.trackPromotionUsage(event);
}
```

### 4. Cache Invalidation (Xóa Cache)

```java
@EventListener
@Async
public void handlePromotionActivated(PromotionActivatedEvent event) {
    // ✅ Invalidate cache (side effect)
    cacheService.invalidatePromotionCache(event.getPromotionId());
}
```

---

## 📋 Quy Tắc Vàng

### ✅ DÙNG EVENT CHO:
1. **Side Effects** - Những việc không ảnh hưởng đến business logic chính
2. **Notifications** - Gửi email, SMS, push notification
3. **Analytics** - Track metrics, logging
4. **Cache** - Invalidate cache
5. **Audit Trail** - Log cho audit

### ❌ KHÔNG DÙNG EVENT CHO:
1. **Business Logic** - Validate, calculate, check eligibility
2. **Return Values** - Cần kết quả ngay lập tức
3. **Transaction Critical** - Phải đảm bảo đồng bộ
4. **Error Handling** - Xử lý lỗi phải synchronous

---

## 🔄 Flow Đúng

### Apply Promo Code Flow

```
1. User calls: POST /api/v1/promotions/apply
   ↓
2. Service.applyPromoCode() - SYNCHRONOUS
   ├─ Validate code (synchronous)
   ├─ Check eligibility (synchronous)
   ├─ Calculate discount (synchronous)
   └─ Return response (KHÔNG publish event)
   ↓
3. Response to user (ngay lập tức)
   ↓
4. [Later] When order is created and saved to DB
   ↓
5. recordPromotionUsage() - Lưu vào database
   ↓
6. Publish PromotionAppliedEvent - SAU KHI đã lưu
   ↓
7. [Background - Async]
   ├─ Notification Listener: Send email
   ├─ Analytics Listener: Track usage
   └─ Cache Listener: Update cache
```

---

## 📊 So Sánh

| Hành Động | Dùng Event? | Lý Do |
|-----------|-------------|-------|
| **Validate promo code** | ❌ KHÔNG | Cần kết quả ngay, phải synchronous |
| **Calculate discount** | ❌ KHÔNG | Cần kết quả ngay, phải synchronous |
| **Check eligibility** | ❌ KHÔNG | Cần kết quả ngay, phải synchronous |
| **Apply promo (business logic)** | ❌ KHÔNG | Phải trả response ngay |
| **Record usage (save to DB)** | ✅ CÓ | Sau khi save, publish event cho side effects |
| **Send notification** | ✅ CÓ | Side effect, có thể async |
| **Track analytics** | ✅ CÓ | Side effect, có thể async |
| **Invalidate cache** | ✅ CÓ | Side effect, có thể async |

---

## 💡 Ví Dụ Code Đúng

### applyPromoCode() - KHÔNG publish event

```java
@Override
@Transactional(readOnly = true)
public ApplyPromoCodeResponse applyPromoCode(ApplyPromoCodeRequest request, Long userId) {
    // 1. Validate (synchronous)
    PromotionEntity promotion = promotionRepository.findByCodeAndIsDeletedFalse(
        request.getCode().toUpperCase().trim()
    ).orElseThrow(() -> new NotFoundException("Promotion code not found"));

    // 2. Check eligibility (synchronous)
    if (!PromotionStatus.ACTIVE.equals(promotion.getStatus())) {
        throw new BadRequestException("Promotion is not active");
    }
    
    // Check dates, min order value, applicable products, usage limits
    // ... (tất cả synchronous)
    
    // 3. Calculate discount (synchronous)
    BigDecimal discountAmount = calculateDiscount(promotion, request.getOrderAmount());
    BigDecimal finalAmount = request.getOrderAmount().subtract(discountAmount);
    
    // 4. Return response (KHÔNG publish event ở đây)
    return ApplyPromoCodeResponse.builder()
        .promotionId(promotion.getId())
        .code(promotion.getCode())
        .name(promotion.getName())
        .type(promotion.getType())
        .originalAmount(request.getOrderAmount())
        .discountAmount(discountAmount)
        .finalAmount(finalAmount)
        .message(String.format("Applied promotion: %s", promotion.getName()))
        .build();
    
    // ✅ Event chỉ được publish SAU KHI đã lưu vào database
    // (Khi tạo order/invoice và record promotion usage)
}
```

### recordPromotionUsage() - CÓ publish event

```java
@Transactional
public void recordPromotionUsage(Long promotionId, Long userId, Long orderId, 
                                 BigDecimal originalAmount, BigDecimal discountAmount) {
    // 1. Business logic: Lưu vào database
    PromotionUsageEntity usage = PromotionUsageEntity.builder()
        .promotionId(promotionId)
        .userId(userId)
        .orderId(orderId)
        .originalAmount(originalAmount)
        .discountAmount(discountAmount)
        .finalAmount(originalAmount.subtract(discountAmount))
        .build();
    promotionUsageRepository.save(usage);
    
    // 2. Publish event SAU KHI đã lưu thành công
    PromotionAppliedEvent event = PromotionAppliedEvent.builder()
        .promotionId(promotionId)
        .userId(userId)
        .orderId(orderId)
        .originalAmount(originalAmount)
        .discountAmount(discountAmount)
        .finalAmount(originalAmount.subtract(discountAmount))
        .appliedAt(OffsetDateTime.now())
        .build();
    eventPublisher.publishEvent(event);
    
    // ✅ Event được publish cho side effects (notification, analytics, cache)
}
```

---

## 🎯 Tóm Tắt

### ❌ KHÔNG DÙNG EVENT:
- Validate, Calculate, Check Eligibility → Phải synchronous
- Apply promo code (business logic chính) → Phải trả response ngay

### ✅ DÙNG EVENT:
- Sau khi business logic đã hoàn thành và lưu vào DB
- Cho side effects: notification, analytics, cache

### Quy Tắc:
**Event = Side Effect, KHÔNG phải Business Logic!**


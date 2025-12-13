# So Sánh Trước và Sau Khi Áp Dụng Event-Driven Architecture

## 📊 Tổng Quan

Tài liệu này so sánh **trước** và **sau** khi áp dụng Event-Driven Architecture vào Promotion module, giúp bạn hiểu rõ sự khác biệt và lợi ích.

---

## 🔴 TRƯỚC KHI ÁP DỤNG EVENT-DRIVEN

### Kiến Trúc Cũ (Tightly Coupled)

```
┌─────────────────┐
│  Controller     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service        │──┐
└────────┬────────┘  │
         │           │ Direct calls (tightly coupled)
         ▼           │
┌─────────────────┐ │
│  Repository     │ │
└─────────────────┘ │
                    │
         ┌──────────┘
         │
         ▼
┌─────────────────┐
│ Notification    │  ← Phải gọi trực tiếp
│ Analytics       │  ← Phải gọi trực tiếp
│ Cache Service   │  ← Phải gọi trực tiếp
└─────────────────┘
```

### Ví Dụ Code Cũ

```java
@Service
public class PromotionServiceImpl {
    
    private final NotificationService notificationService;  // ❌ Phụ thuộc trực tiếp
    private final AnalyticsService analyticsService;        // ❌ Phụ thuộc trực tiếp
    private final CacheService cacheService;                // ❌ Phụ thuộc trực tiếp
    
    public void activate(Long id) {
        // 1. Business logic
        PromotionEntity entity = findById(id);
        entity.setStatus(ACTIVE);
        repository.save(entity);
        
        // 2. Phải gọi trực tiếp các services khác
        notificationService.sendPromotionActivatedEmail(entity);  // ❌ Tight coupling
        analyticsService.trackPromotionActivation(entity);        // ❌ Tight coupling
        cacheService.invalidatePromotionCache(entity.getId());   // ❌ Tight coupling
        
        // ❌ Vấn đề: Nếu thêm service mới, phải sửa code ở đây
        // ❌ Vấn đề: Nếu một service lỗi, có thể ảnh hưởng toàn bộ
        // ❌ Vấn đề: Khó test vì phải mock nhiều dependencies
    }
}
```

### ❌ Vấn Đề Của Cách Cũ

1. **Tight Coupling (Liên kết chặt chẽ)**
   - PromotionService phải biết về NotificationService, AnalyticsService, CacheService
   - Thêm service mới → phải sửa PromotionService

2. **Khó Test**
   - Phải mock nhiều dependencies
   - Test phức tạp và dễ break

3. **Khó Mở Rộng**
   - Thêm tính năng mới → phải sửa code cũ
   - Vi phạm nguyên tắc Open/Closed

4. **Blocking Operations**
   - Gửi email mất thời gian → block main transaction
   - Analytics chậm → ảnh hưởng performance

5. **Error Propagation**
   - Nếu notification service lỗi → có thể rollback toàn bộ transaction
   - Không có cách xử lý lỗi độc lập

---

## 🟢 SAU KHI ÁP DỤNG EVENT-DRIVEN

### Kiến Trúc Mới (Loosely Coupled)

```
┌─────────────────┐
│  Controller     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service        │
└────────┬────────┘
         │
         │ publishEvent()
         ▼
┌─────────────────┐
│ Event Publisher │
└────────┬────────┘
         │
         │ Events (decoupled)
         ├──────────────────┬──────────────────┬──────────────────┐
         ▼                  ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Notification │  │  Analytics   │  │    Cache     │  │   Audit      │
│  Listener    │  │  Listener    │  │  Listener    │  │  Listener    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Ví Dụ Code Mới

```java
@Service
public class PromotionServiceImpl {
    
    private final ApplicationEventPublisher eventPublisher;  // ✅ Chỉ cần event publisher
    
    public void activate(Long id) {
        // 1. Business logic (chỉ tập trung vào business)
        PromotionEntity entity = findById(id);
        entity.setStatus(ACTIVE);
        repository.save(entity);
        
        // 2. Publish event (không cần biết ai sẽ xử lý)
        PromotionActivatedEvent event = PromotionActivatedEvent.builder()
                .promotionId(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .activatedAt(OffsetDateTime.now())
                .build();
        eventPublisher.publishEvent(event);  // ✅ Loose coupling
        
        // ✅ Ưu điểm: Không cần biết về NotificationService, AnalyticsService, etc.
        // ✅ Ưu điểm: Thêm service mới → chỉ cần thêm listener, không sửa code này
    }
}

// Các listeners độc lập, không ảnh hưởng lẫn nhau
@Component
public class NotificationEventListener {
    @EventListener
    @Async  // ✅ Xử lý async, không block
    public void handlePromotionActivated(PromotionActivatedEvent event) {
        // Chỉ xử lý notification
        emailService.sendPromotionActivatedEmail(event);
    }
}

@Component
public class AnalyticsEventListener {
    @EventListener
    @Async  // ✅ Xử lý async, không block
    public void handlePromotionActivated(PromotionActivatedEvent event) {
        // Chỉ xử lý analytics
        analyticsService.trackPromotionActivation(event);
    }
}
```

### ✅ Lợi Ích Của Cách Mới

1. **Loose Coupling (Liên kết lỏng lẻo)**
   - PromotionService không cần biết về các services khác
   - Chỉ cần publish event, ai muốn lắng nghe thì tự lắng nghe

2. **Dễ Test**
   - Test PromotionService: chỉ cần verify event được publish
   - Test Listeners: test độc lập, không cần mock nhiều

3. **Dễ Mở Rộng**
   - Thêm tính năng mới → chỉ cần tạo listener mới
   - Không cần sửa code cũ → tuân thủ Open/Closed Principle

4. **Non-Blocking Operations**
   - Events được xử lý async → không block main transaction
   - Performance tốt hơn

5. **Error Isolation**
   - Nếu notification listener lỗi → không ảnh hưởng analytics listener
   - Mỗi listener xử lý lỗi độc lập

---

## 📋 So Sánh Chi Tiết

### 1. Khi Activate Promotion

#### ❌ TRƯỚC (Tightly Coupled)

```java
public void activate(Long id) {
    // Business logic
    PromotionEntity entity = findById(id);
    entity.setStatus(ACTIVE);
    repository.save(entity);
    
    // Phải gọi trực tiếp - BLOCKING
    notificationService.sendEmail(entity);        // ⏱️ Mất 2-3 giây
    analyticsService.track(entity);               // ⏱️ Mất 1-2 giây
    cacheService.invalidate(entity.getId());      // ⏱️ Mất 0.5 giây
    
    // ❌ Tổng thời gian: ~4-5 giây
    // ❌ Nếu một service lỗi → rollback toàn bộ
    // ❌ Khó thêm service mới
}
```

#### ✅ SAU (Event-Driven)

```java
public void activate(Long id) {
    // Business logic
    PromotionEntity entity = findById(id);
    entity.setStatus(ACTIVE);
    repository.save(entity);
    
    // Publish event - NON-BLOCKING
    eventPublisher.publishEvent(new PromotionActivatedEvent(...));
    
    // ✅ Tổng thời gian: < 0.1 giây (chỉ publish event)
    // ✅ Các listeners xử lý async ở background
    // ✅ Nếu một listener lỗi → không ảnh hưởng listeners khác
    // ✅ Dễ thêm listener mới
}
```

### 2. Khi Apply Promotion

#### ❌ TRƯỚC

```java
public ApplyPromoCodeResponse applyPromoCode(ApplyPromoCodeRequest request) {
    // Validate và tính toán
    PromotionEntity promotion = findPromotion(request.getCode());
    BigDecimal discount = calculateDiscount(promotion, request.getOrderAmount());
    
    // Phải gọi trực tiếp
    analyticsService.trackPromotionUsage(promotion, request);  // ❌ Blocking
    emailService.sendConfirmation(request.getUserId(), discount);  // ❌ Blocking
    
    return response;
    // ❌ Customer phải đợi email gửi xong mới nhận được response
}
```

#### ✅ SAU

```java
public ApplyPromoCodeResponse applyPromoCode(ApplyPromoCodeRequest request) {
    // Validate và tính toán
    PromotionEntity promotion = findPromotion(request.getCode());
    BigDecimal discount = calculateDiscount(promotion, request.getOrderAmount());
    
    // Publish event - async
    eventPublisher.publishEvent(new PromotionAppliedEvent(...));
    
    return response;
    // ✅ Customer nhận response ngay lập tức
    // ✅ Email và analytics được xử lý ở background
}
```

### 3. Thêm Tính Năng Mới

#### ❌ TRƯỚC

```java
// Muốn thêm tính năng gửi SMS
public void activate(Long id) {
    // ... existing code ...
    
    notificationService.sendEmail(entity);     // Code cũ
    analyticsService.track(entity);            // Code cũ
    cacheService.invalidate(entity.getId());  // Code cũ
    
    smsService.sendSMS(entity);  // ❌ Phải sửa code ở đây
}
```

#### ✅ SAU

```java
// Muốn thêm tính năng gửi SMS
// Chỉ cần tạo listener mới, KHÔNG cần sửa code cũ

@Component
public class SMSNotificationListener {
    @EventListener
    @Async
    public void handlePromotionActivated(PromotionActivatedEvent event) {
        smsService.sendSMS(event);  // ✅ Chỉ thêm file mới
    }
}

// PromotionServiceImpl KHÔNG CẦN SỬA GÌ CẢ!
```

---

## 📊 Bảng So Sánh Tổng Quan

| Tiêu Chí | ❌ TRƯỚC | ✅ SAU |
|----------|-----------|--------|
| **Coupling** | Tight (chặt chẽ) | Loose (lỏng lẻo) |
| **Dependencies** | Nhiều (3-5 services) | Ít (chỉ 1 event publisher) |
| **Thời gian response** | Chậm (4-5 giây) | Nhanh (< 0.1 giây) |
| **Error handling** | 1 service lỗi → toàn bộ lỗi | Mỗi listener xử lý độc lập |
| **Test** | Khó (phải mock nhiều) | Dễ (chỉ verify event) |
| **Mở rộng** | Phải sửa code cũ | Chỉ thêm listener mới |
| **Performance** | Blocking | Non-blocking (async) |
| **Maintainability** | Khó maintain | Dễ maintain |

---

## 🎯 Ví Dụ Thực Tế

### Scenario: Activate Promotion và Gửi Thông Báo

#### ❌ TRƯỚC

```
User clicks "Activate" 
    ↓
Controller → Service.activate()
    ↓
Service: Save to DB (0.1s)
    ↓
Service: Send email (2s) ← BLOCKING
    ↓
Service: Track analytics (1s) ← BLOCKING
    ↓
Service: Update cache (0.5s) ← BLOCKING
    ↓
Response to user (sau 3.6s) ❌
```

#### ✅ SAU

```
User clicks "Activate"
    ↓
Controller → Service.activate()
    ↓
Service: Save to DB (0.1s)
    ↓
Service: Publish event (0.01s)
    ↓
Response to user (sau 0.11s) ✅
    ↓
[Background - Async]
    ├─ Email Listener: Send email (2s)
    ├─ Analytics Listener: Track (1s)
    └─ Cache Listener: Update cache (0.5s)
```

**Kết quả**: User nhận response nhanh hơn **32 lần**! 🚀

---

## 🔄 Flow Diagram

### ❌ TRƯỚC: Synchronous Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ Request
     ▼
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│Service  │────▶│Email    │────▶│Analytics│────▶│Cache    │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │              │                │                │
     └──────────────┴────────────────┴────────────────┘
                    │
                    ▼
              Response (sau 3.6s)
```

### ✅ SAU: Event-Driven Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ Request
     ▼
┌─────────┐
│Service  │───▶ Publish Event
└────┬────┘
     │
     ▼
Response (sau 0.11s) ✅

[Background - Async]
     │
     ├───▶ Email Listener
     ├───▶ Analytics Listener
     └───▶ Cache Listener
```

---

## 💡 Kết Luận

### Trước khi áp dụng Event-Driven:
- ❌ Code phụ thuộc chặt chẽ
- ❌ Khó test và maintain
- ❌ Performance chậm
- ❌ Khó mở rộng

### Sau khi áp dụng Event-Driven:
- ✅ Code độc lập, lỏng lẻo
- ✅ Dễ test và maintain
- ✅ Performance nhanh (async)
- ✅ Dễ mở rộng (chỉ thêm listener)

### Lợi ích chính:
1. **Tách biệt concerns**: Mỗi service chỉ lo việc của mình
2. **Performance tốt hơn**: Async processing không block
3. **Dễ mở rộng**: Thêm tính năng mới không cần sửa code cũ
4. **Dễ test**: Test từng phần độc lập
5. **Resilient**: Lỗi ở một listener không ảnh hưởng listeners khác

---

## 📚 Tài Liệu Tham Khảo

- Xem `PROMOTION_EVENT_DRIVEN.md` để biết cách sử dụng chi tiết
- Xem code trong `PromotionServiceImpl.java` để xem implementation
- Xem `PromotionEventListener.java` để xem cách tạo listeners


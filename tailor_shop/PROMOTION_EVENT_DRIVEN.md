# Event-Driven Architecture cho Promotion Module

## Tổng quan

Module Promotion đã được tích hợp **Event-Driven Architecture** sử dụng **Spring Events** để decouple các services và cho phép xử lý async.

## Lợi ích

1. **Decoupling**: Các services khác không cần biết về Promotion service, chỉ cần lắng nghe events
2. **Scalability**: Xử lý async, không block main transaction
3. **Extensibility**: Dễ dàng thêm các handlers mới mà không cần sửa code cũ
4. **Maintainability**: Code dễ maintain và test hơn
5. **Audit Trail**: Có thể log tất cả events để audit

## Events được publish

### 1. PromotionActivatedEvent
**Khi nào**: Khi promotion được activate thành công

**Thông tin**:
- `promotionId`: ID của promotion
- `code`: Mã promotion
- `name`: Tên promotion
- `startDate`, `endDate`: Ngày bắt đầu và kết thúc
- `activatedAt`: Thời gian activate
- `activatedBy`: User ID người activate (nếu có)

**Use cases**:
- Send notification đến customers về promotion mới
- Update cache
- Log analytics
- Update recommendation engine

### 2. PromotionDeactivatedEvent
**Khi nào**: Khi promotion được deactivate

**Thông tin**:
- `promotionId`, `code`, `name`
- `deactivatedAt`: Thời gian deactivate
- `deactivatedBy`: User ID người deactivate

**Use cases**:
- Update cache
- Log analytics
- Notify relevant stakeholders

### 3. PromotionAppliedEvent
**Khi nào**: Khi promotion được apply thành công (khi customer sử dụng mã giảm giá)

**Thông tin**:
- `promotionId`, `code`, `name`
- `userId`: ID của customer sử dụng
- `orderId`, `invoiceId`: ID của order/invoice (nếu có)
- `originalAmount`: Số tiền gốc
- `discountAmount`: Số tiền giảm
- `finalAmount`: Số tiền cuối cùng
- `appliedAt`: Thời gian apply

**Use cases**:
- Track usage metrics
- Update analytics
- Send confirmation to customer
- Log audit trail
- Update recommendation engine

### 4. PromotionExpiredEvent
**Khi nào**: Khi promotion hết hạn (có thể được trigger bởi scheduled task)

**Thông tin**:
- `promotionId`, `code`, `name`
- `endDate`: Ngày kết thúc
- `expiredAt`: Thời gian expire

**Use cases**:
- Auto-deactivate promotion
- Send notification to admin
- Update cache
- Generate report

### 5. PromotionUsageLimitReachedEvent
**Khi nào**: Khi promotion đạt giới hạn sử dụng

**Thông tin**:
- `promotionId`, `code`, `name`
- `totalUsages`: Tổng số lần sử dụng
- `maxUsageTotal`: Giới hạn tối đa
- `reachedAt`: Thời gian đạt giới hạn

**Use cases**:
- Auto-deactivate promotion
- Send alert to admin
- Update cache
- Generate report

## Cách sử dụng

### 1. Publish Event (đã implement trong PromotionServiceImpl)

```java
// Trong PromotionServiceImpl
@Autowired
private ApplicationEventPublisher eventPublisher;

public void activate(Long id) {
    // ... business logic ...
    
    // Publish event
    PromotionActivatedEvent event = PromotionActivatedEvent.builder()
            .promotionId(entity.getId())
            .code(entity.getCode())
            .name(entity.getName())
            .startDate(entity.getStartDate())
            .endDate(entity.getEndDate())
            .activatedAt(OffsetDateTime.now())
            .build();
    eventPublisher.publishEvent(event);
}
```

### 2. Listen to Events (đã implement trong PromotionEventListener)

```java
@Component
@Slf4j
public class PromotionEventListener {
    
    @EventListener
    @Async
    public void handlePromotionActivated(PromotionActivatedEvent event) {
        // Handle event asynchronously
        log.info("Promotion activated: {}", event.getCode());
        // ... your logic ...
    }
}
```

### 3. Tạo Custom Listener

Bạn có thể tạo các listeners khác trong các modules khác:

```java
// Trong NotificationService
@Component
@Slf4j
public class NotificationEventListener {
    
    @EventListener
    @Async
    public void sendPromotionNotification(PromotionActivatedEvent event) {
        // Send email/SMS to customers
        emailService.sendPromotionActivatedEmail(event);
    }
}
```

## Configuration

### AsyncConfig
File `AsyncConfig.java` đã được tạo để configure thread pool cho async event processing:

```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean(name = "eventTaskExecutor")
    public Executor eventTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        return executor;
    }
}
```

## Best Practices

1. **Async Processing**: Luôn sử dụng `@Async` cho event listeners để không block main transaction
2. **Error Handling**: Implement error handling trong listeners để tránh ảnh hưởng đến main flow
3. **Idempotency**: Đảm bảo event handlers là idempotent (có thể chạy nhiều lần mà không ảnh hưởng)
4. **Monitoring**: Log events để monitor và debug
5. **Transaction**: Events được publish sau khi transaction commit (nếu dùng `@TransactionalEventListener`)

## Nâng cấp lên Message Queue (RabbitMQ/Kafka)

Để scale hơn, có thể nâng cấp lên message queue:

### RabbitMQ
```java
@Configuration
public class RabbitMQConfig {
    @Bean
    public TopicExchange promotionExchange() {
        return new TopicExchange("promotion.events");
    }
    
    @Bean
    public Queue promotionActivatedQueue() {
        return new Queue("promotion.activated");
    }
}
```

### Kafka
```java
@Configuration
public class KafkaConfig {
    @Bean
    public ProducerFactory<String, PromotionActivatedEvent> producerFactory() {
        // Kafka producer config
    }
}
```

## Testing

### Unit Test Event Publishing
```java
@ExtendWith(MockitoExtension.class)
class PromotionServiceImplTest {
    @Mock
    private ApplicationEventPublisher eventPublisher;
    
    @Test
    void testActivatePublishesEvent() {
        // ... test code ...
        verify(eventPublisher).publishEvent(any(PromotionActivatedEvent.class));
    }
}
```

### Integration Test Event Listener
```java
@SpringBootTest
class PromotionEventListenerTest {
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    @Test
    void testEventListenerReceivesEvent() {
        PromotionActivatedEvent event = PromotionActivatedEvent.builder()
                .promotionId(1L)
                .code("TEST")
                .build();
        eventPublisher.publishEvent(event);
        // Verify listener was called
    }
}
```

## Tóm tắt

Event-Driven Architecture đã được tích hợp vào Promotion module với:
- ✅ 5 events được định nghĩa
- ✅ Event publishing trong service methods
- ✅ Event listener mẫu với async processing
- ✅ Configuration cho async processing
- ✅ Documentation đầy đủ

Các services khác có thể dễ dàng lắng nghe events từ Promotion module mà không cần biết về implementation details.


package com.example.tailor_shop.modules.promotion.listener;

import com.example.tailor_shop.modules.promotion.event.PromotionActivatedEvent;
import com.example.tailor_shop.modules.promotion.event.PromotionAppliedEvent;
import com.example.tailor_shop.modules.promotion.event.PromotionDeactivatedEvent;
import com.example.tailor_shop.modules.promotion.event.PromotionExpiredEvent;
import com.example.tailor_shop.modules.promotion.event.PromotionUsageLimitReachedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Event listener cho các events từ Promotion module
 * 
 * Các use cases có thể implement:
 * 1. Send notifications (email, SMS, push) khi promotion activated/deactivated
 * 2. Update analytics/metrics khi promotion được apply
 * 3. Send alerts khi promotion hết hạn hoặc đạt giới hạn
 * 4. Update cache khi promotion status thay đổi
 * 5. Log audit trail
 */
@Component
@Slf4j
public class PromotionEventListener {

    /**
     * Handle khi promotion được activate
     * Use cases:
     * - Send notification đến customers về promotion mới
     * - Update cache
     * - Log analytics
     */
    @EventListener
    @Async
    public void handlePromotionActivated(PromotionActivatedEvent event) {
        log.info("[Event] Promotion activated: {} - {}", event.getCode(), event.getName());
        
        // TODO: Implement các actions sau:
        // 1. Send notification to customers (if public promotion)
        // 2. Update cache
        // 3. Log to analytics service
        // 4. Send to message queue for async processing
        
        // Example: Send notification
        // notificationService.sendPromotionActivatedNotification(event);
    }

    /**
     * Handle khi promotion được deactivate
     */
    @EventListener
    @Async
    public void handlePromotionDeactivated(PromotionDeactivatedEvent event) {
        log.info("[Event] Promotion deactivated: {} - {}", event.getCode(), event.getName());
        
        // TODO: Implement các actions sau:
        // 1. Update cache
        // 2. Log to analytics
        // 3. Notify relevant stakeholders
    }

    /**
     * Handle khi promotion được apply
     * Use cases:
     * - Track usage metrics
     * - Update analytics
     * - Send confirmation to customer
     * - Update inventory if needed
     */
    @EventListener
    @Async
    public void handlePromotionApplied(PromotionAppliedEvent event) {
        log.info("[Event] Promotion applied: {} by user {} - Discount: {}", 
                event.getCode(), event.getUserId(), event.getDiscountAmount());
        
        // TODO: Implement các actions sau:
        // 1. Update analytics/metrics
        // 2. Send confirmation email/SMS to customer
        // 3. Log to audit trail
        // 4. Update recommendation engine
        
        // Example: Track metrics
        // analyticsService.trackPromotionUsage(event);
    }

    /**
     * Handle khi promotion hết hạn
     * Use cases:
     * - Auto-deactivate promotion
     * - Send notification to admin
     * - Update cache
     */
    @EventListener
    @Async
    public void handlePromotionExpired(PromotionExpiredEvent event) {
        log.warn("[Event] Promotion expired: {} - {}", event.getCode(), event.getName());
        
        // TODO: Implement các actions sau:
        // 1. Auto-deactivate promotion (if not already)
        // 2. Send notification to admin
        // 3. Update cache
        // 4. Generate report
        
        // Example: Auto-deactivate
        // promotionService.deactivate(event.getPromotionId());
    }

    /**
     * Handle khi promotion đạt giới hạn sử dụng
     * Use cases:
     * - Auto-deactivate promotion
     * - Send alert to admin
     * - Update cache
     */
    @EventListener
    @Async
    public void handlePromotionUsageLimitReached(PromotionUsageLimitReachedEvent event) {
        log.warn("[Event] Promotion usage limit reached: {} - {}/{}", 
                event.getCode(), event.getTotalUsages(), event.getMaxUsageTotal());
        
        // TODO: Implement các actions sau:
        // 1. Auto-deactivate promotion
        // 2. Send alert to admin
        // 3. Update cache
        // 4. Generate report
        
        // Example: Auto-deactivate
        // promotionService.deactivate(event.getPromotionId());
    }
}


package com.example.tailor_shop.modules.review.listener;

import com.example.tailor_shop.modules.review.event.ReviewApprovedEvent;
import com.example.tailor_shop.modules.review.event.ReviewCreatedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Event listener cho các events từ Review module
 * 
 * Use cases:
 * 1. Send notification khi review được tạo/approved
 * 2. Update analytics/metrics
 * 3. Update cache
 * 4. Log audit trail
 */
@Component
@Slf4j
public class ReviewEventListener {

    /**
     * Handle khi review được tạo
     */
    @EventListener
    @Async
    public void handleReviewCreated(ReviewCreatedEvent event) {
        log.info("[Event] Review created: id={}, type={}, rating={}", 
                event.getReviewId(), event.getType(), event.getRating());
        
        // TODO: Implement các actions sau:
        // 1. Send notification to shop owner (if product review)
        // 2. Update analytics
        // 3. Log to audit trail
        
        // Example: Send notification
        // notificationService.sendReviewCreatedNotification(event);
    }

    /**
     * Handle khi review được approve
     */
    @EventListener
    @Async
    public void handleReviewApproved(ReviewApprovedEvent event) {
        log.info("[Event] Review approved: id={}, type={}, rating={}", 
                event.getReviewId(), event.getType(), event.getRating());
        
        // TODO: Implement các actions sau:
        // 1. Send notification to reviewer
        // 2. Update product rating cache
        // 3. Update analytics
        // 4. Update recommendation engine
        
        // Example: Update cache
        // cacheService.invalidateProductRatingCache(event.getProductId());
    }
}


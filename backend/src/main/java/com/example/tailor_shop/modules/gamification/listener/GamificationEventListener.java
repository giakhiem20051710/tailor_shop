package com.example.tailor_shop.modules.gamification.listener;

import com.example.tailor_shop.modules.gamification.event.OrderCompletedForChallengeEvent;
import com.example.tailor_shop.modules.gamification.event.ReviewSubmittedForChallengeEvent;
import com.example.tailor_shop.modules.gamification.service.SeasonalChallengeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Gamification Event Listener
 * Listens to domain events and updates challenge progress automatically
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GamificationEventListener {

    private final SeasonalChallengeService challengeService;

    /**
     * Handle order completed event
     * Updates progress for ORDER_COUNT, ORDER_VALUE, and PRODUCT_CATEGORY
     * challenges
     */
    @EventListener
    @Async
    public void onOrderCompleted(OrderCompletedForChallengeEvent event) {
        log.info("Gamification: Processing order completed event for user {} order {}",
                event.getUserId(), event.getOrderId());
        try {
            challengeService.trackOrderProgress(
                    event.getUserId(),
                    event.getOrderValue().longValue(),
                    event.getProductCategory());
            log.debug("Gamification: Order progress tracked successfully");
        } catch (Exception e) {
            log.error("Gamification: Failed to track order progress for user {}",
                    event.getUserId(), e);
        }
    }

    /**
     * Handle review submitted event
     * Updates progress for REVIEW_COUNT challenges
     */
    @EventListener
    @Async
    public void onReviewSubmitted(ReviewSubmittedForChallengeEvent event) {
        log.info("Gamification: Processing review submitted event for user {}", event.getUserId());
        try {
            challengeService.trackReviewProgress(event.getUserId());
            log.debug("Gamification: Review progress tracked successfully");
        } catch (Exception e) {
            log.error("Gamification: Failed to track review progress for user {}",
                    event.getUserId(), e);
        }
    }
}

package com.example.tailor_shop.modules.gamification.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Review Submitted Event for Gamification
 * Dispatched when a user submits a review
 */
@Getter
public class ReviewSubmittedForChallengeEvent extends ApplicationEvent {

    private final Long userId;
    private final Long reviewId;
    private final Long productId;

    public ReviewSubmittedForChallengeEvent(
            Object source,
            Long userId,
            Long reviewId,
            Long productId) {
        super(source);
        this.userId = userId;
        this.reviewId = reviewId;
        this.productId = productId;
    }
}

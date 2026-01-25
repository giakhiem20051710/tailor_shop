package com.example.tailor_shop.modules.gamification.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.math.BigDecimal;

/**
 * Order Completed Event for Gamification
 * Dispatched when an order is successfully completed/delivered
 */
@Getter
public class OrderCompletedForChallengeEvent extends ApplicationEvent {

    private final Long userId;
    private final Long orderId;
    private final BigDecimal orderValue;
    private final String productCategory;

    public OrderCompletedForChallengeEvent(
            Object source,
            Long userId,
            Long orderId,
            BigDecimal orderValue,
            String productCategory) {
        super(source);
        this.userId = userId;
        this.orderId = orderId;
        this.orderValue = orderValue;
        this.productCategory = productCategory;
    }
}

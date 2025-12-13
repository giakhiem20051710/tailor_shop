package com.example.tailor_shop.modules.promotion.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Event được publish khi promotion được deactivate
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionDeactivatedEvent {
    private Long promotionId;
    private String code;
    private String name;
    private OffsetDateTime deactivatedAt;
    private Long deactivatedBy;
}


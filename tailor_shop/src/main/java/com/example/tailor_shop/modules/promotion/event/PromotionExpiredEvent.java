package com.example.tailor_shop.modules.promotion.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Event được publish khi promotion hết hạn
 * Có thể được trigger bởi scheduled task
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionExpiredEvent {
    private Long promotionId;
    private String code;
    private String name;
    private LocalDate endDate;
    private OffsetDateTime expiredAt;
}


package com.example.tailor_shop.modules.promotion.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Event được publish khi promotion đạt giới hạn sử dụng
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionUsageLimitReachedEvent {
    private Long promotionId;
    private String code;
    private String name;
    private Long totalUsages;
    private Long maxUsageTotal;
    private OffsetDateTime reachedAt;
}


package com.example.tailor_shop.modules.promotion.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Event được publish khi promotion được activate
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionActivatedEvent {
    private Long promotionId;
    private String code;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private OffsetDateTime activatedAt;
    private Long activatedBy;
}


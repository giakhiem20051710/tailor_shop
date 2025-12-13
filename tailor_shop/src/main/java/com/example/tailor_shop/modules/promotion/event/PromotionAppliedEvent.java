package com.example.tailor_shop.modules.promotion.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Event được publish khi promotion được apply thành công
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionAppliedEvent {
    private Long promotionId;
    private String code;
    private String name;
    private Long userId;
    private Long orderId;
    private Long invoiceId;
    private BigDecimal originalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private OffsetDateTime appliedAt;
}


package com.example.tailor_shop.modules.promotion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionUsageResponse {

    private Long id;
    private Long promotionId;
    private String promotionCode;
    private String promotionName;
    private Long orderId;
    private Long invoiceId;
    private BigDecimal discountAmount;
    private BigDecimal originalAmount;
    private BigDecimal finalAmount;
    private OffsetDateTime usedAt;
}


package com.example.tailor_shop.modules.promotion.dto;

import com.example.tailor_shop.modules.promotion.domain.PromotionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyPromoCodeResponse {

    private Long promotionId;
    private String code;
    private String name;
    private PromotionType type;
    private BigDecimal originalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String message;
}


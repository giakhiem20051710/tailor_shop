package com.example.tailor_shop.modules.gamification.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * Redeem Calculation DTO
 * Calculates how much discount user can get
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedeemCalculation {
    private Boolean canUse;
    private String reason; // If cannot use, why

    private Integer pointsRequested;
    private Integer pointsAllowed; // Max points allowed to use
    private Integer pointsAvailable; // User's current balance

    private BigDecimal orderTotal;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount; // orderTotal - discountAmount

    private Integer maxPercentAllowed; // e.g., 20
    private BigDecimal maxDiscountAllowed;

    // Config values used
    private Integer valuePerPoint; // 500
    private Integer minPoints; // 50
    private BigDecimal minOrderValue; // 500000
}

package com.example.tailor_shop.modules.fabric.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO cho apply promo code khi mua fabric
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyFabricPromoRequest {

    @NotNull(message = "Fabric ID is required")
    private Long fabricId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;

    @NotBlank(message = "Promo code is required")
    private String promoCode;

    private List<Long> categoryIds; // Fabric category IDs nếu có
}


package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Price DTO - Contains pricing information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceDTO {
    private BigDecimal basePrice; // Base price
    private String priceRange; // Price range string (e.g., "1.000.000 - 5.000.000")
    private String budget; // Budget category (e.g., "Luxury", "Economy", "Mid-range")
}


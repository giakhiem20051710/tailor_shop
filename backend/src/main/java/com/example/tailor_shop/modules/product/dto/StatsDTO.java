package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Stats DTO - Contains social proof and statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsDTO {
    private BigDecimal rating; // Average rating
    private Integer reviewCount; // Number of reviews
    private Integer sold; // Number of items sold
    private Boolean isFavorite; // Whether current user has favorited this product
}


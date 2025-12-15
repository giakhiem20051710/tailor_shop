package com.example.tailor_shop.modules.fabric.dto;

import com.example.tailor_shop.modules.fabric.domain.FabricCategory;
import com.example.tailor_shop.modules.fabric.domain.FabricPattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho filter fabrics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricFilterRequest {

    private FabricCategory category;
    private String color;
    private FabricPattern pattern;
    private String material;
    private String origin;
    private Boolean isAvailable;
    private Boolean isFeatured;
    private Boolean isLowStock; // Only fabrics with low stock
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String keyword; // Search in name, description, code
}


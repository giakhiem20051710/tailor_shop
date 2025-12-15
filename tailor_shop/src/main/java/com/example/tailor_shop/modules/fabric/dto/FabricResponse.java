package com.example.tailor_shop.modules.fabric.dto;

import com.example.tailor_shop.modules.fabric.domain.FabricCategory;
import com.example.tailor_shop.modules.fabric.domain.FabricPattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * DTO cho fabric response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricResponse {

    private Long id;
    private String code;
    private String name;
    private String slug;
    private String description;
    private FabricCategory category;
    private String material;
    private String color;
    private FabricPattern pattern;
    private BigDecimal width;
    private BigDecimal weight;
    private BigDecimal pricePerMeter;
    private String image;
    private List<String> gallery;
    private String origin;
    private String careInstructions;
    private Boolean isAvailable;
    private Boolean isFeatured;
    private Integer displayOrder;
    private Integer viewCount;
    private BigDecimal totalQuantity; // Total inventory quantity
    private BigDecimal availableQuantity; // Available quantity (total - reserved)
    private Boolean isLowStock; // Low stock alert
    private Long createdById;
    private String createdByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Product Detail Response - Structured according to Clean Code and DDD principles
 * Groups related properties into nested DTOs for better encapsulation and reusability
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {

    // 1. Basic identification information
    private Long id;
    private String key;
    private String name;
    private String slug;
    private String description;
    private String category;
    private String type;
    private String tag; // Product tag/category label

    // 2. Media (Images)
    private MediaDTO media;

    // 3. Pricing & Statistics
    private PriceDTO pricing;
    private StatsDTO stats;

    // 4. Tailoring Specifications (Core domain concept for Tailor Shop)
    private TailoringSpecDTO specifications;

    // 5. Additional metadata
    private List<String> tags; // Additional tags
    private List<String> occasions; // Suitable occasions
    private List<String> customerStyles; // Customer style preferences
    private List<String> careInstructions; // Care and maintenance instructions

    // 6. Relationships
    private List<ProductListItemResponse> relatedProducts;

    // 7. Timestamps
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


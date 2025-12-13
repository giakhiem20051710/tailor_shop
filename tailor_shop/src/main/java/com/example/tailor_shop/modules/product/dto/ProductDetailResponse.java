package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {

    private Long id;
    private String key;
    private String name;
    private String slug;
    private String description;
    private String tag;
    private BigDecimal price;
    private String priceRange;
    private String image;
    private List<String> gallery;
    private String occasion;
    private String category;
    private String budget;
    private String type;
    private BigDecimal rating;
    private Integer reviewCount;
    private Integer sold;
    private Boolean isFavorite;
    private List<ProductListItemResponse> relatedProducts;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListItemResponse {

    private Long id;
    private String key;
    private String name;
    private String slug;
    private String image;
    private BigDecimal price;
    private String priceRange;
    private String category;
    private String occasion;
    private String tag;
    private BigDecimal rating;
    private Integer sold;
    private Boolean isFavorite;
    private TailoringSpecDTO specifications; // Added field
}

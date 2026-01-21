package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StyleResponse {

    private Long id;
    private String name;
    private String category;
    private String image;
    private String description;
    private BigDecimal price;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


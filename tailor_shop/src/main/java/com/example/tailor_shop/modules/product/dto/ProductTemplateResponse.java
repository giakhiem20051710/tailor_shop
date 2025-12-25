package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * DTO cho ProductTemplate response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductTemplateResponse {

    private Long id;
    private String name;
    private String slug;
    private String category;
    private String description;
    private String baseImage;
    private Boolean isActive;
    private Integer displayOrder;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


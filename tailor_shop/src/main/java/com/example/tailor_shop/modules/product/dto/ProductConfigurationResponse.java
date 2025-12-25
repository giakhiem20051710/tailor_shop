package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * DTO cho response ProductConfiguration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductConfigurationResponse {

    private Long id;
    private Long templateId;
    private String templateName;
    private String templateImage;
    private Long fabricId;
    private String fabricName;
    private String fabricImage;
    private String fabricColor;
    private Long styleId;
    private String styleName;
    private String styleImage;
    private String generatedImage;
    private BigDecimal basePrice;
    private Boolean isAvailable;
    private Integer viewCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


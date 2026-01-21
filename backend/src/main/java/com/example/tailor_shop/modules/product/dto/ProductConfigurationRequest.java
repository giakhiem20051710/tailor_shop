package com.example.tailor_shop.modules.product.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho request tạo ProductConfiguration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductConfigurationRequest {

    @NotNull(message = "Template ID is required")
    private Long templateId;

    @NotNull(message = "Fabric ID is required")
    private Long fabricId;

    private Long styleId; // Optional - có thể không chọn style
}


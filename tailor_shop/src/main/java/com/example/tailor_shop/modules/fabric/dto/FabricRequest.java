package com.example.tailor_shop.modules.fabric.dto;

import com.example.tailor_shop.modules.fabric.domain.FabricCategory;
import com.example.tailor_shop.modules.fabric.domain.FabricPattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO cho tạo/cập nhật fabric
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricRequest {

    @NotBlank(message = "Fabric code is required")
    @Size(max = 50, message = "Code must not exceed 50 characters")
    private String code;

    @NotBlank(message = "Fabric name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @Size(max = 255, message = "Slug must not exceed 255 characters")
    private String slug;

    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    private FabricCategory category;

    @Size(max = 100, message = "Material must not exceed 100 characters")
    private String material;

    @Size(max = 100, message = "Color must not exceed 100 characters")
    private String color;

    private FabricPattern pattern;

    @Positive(message = "Width must be positive")
    private BigDecimal width;

    @Positive(message = "Weight must be positive")
    private BigDecimal weight;

    @NotNull(message = "Price per meter is required")
    @Positive(message = "Price must be positive")
    private BigDecimal pricePerMeter;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String image;

    @Size(max = 9, message = "Maximum 9 images allowed")
    private List<String> gallery; // Image URLs

    @Size(max = 100, message = "Origin must not exceed 100 characters")
    private String origin;

    @Size(max = 2000, message = "Care instructions must not exceed 2000 characters")
    private String careInstructions;

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Boolean isFeatured = false;

    @Builder.Default
    private Integer displayOrder = 0;
}


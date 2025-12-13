package com.example.tailor_shop.modules.product.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product key is required")
    @Size(max = 100, message = "Product key must be at most 100 characters")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Product key must contain only lowercase letters, numbers, and hyphens")
    private String key;

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name must be at most 200 characters")
    private String name;

    @Size(max = 200, message = "Slug must be at most 200 characters")
    private String slug;

    private String description;

    @Size(max = 100, message = "Tag must be at most 100 characters")
    private String tag;

    @Min(value = 0, message = "Price must be greater than or equal to 0")
    private BigDecimal price;

    @Size(max = 100, message = "Price range must be at most 100 characters")
    private String priceRange;

    @Size(max = 500, message = "Image URL must be at most 500 characters")
    private String image;

    private List<String> gallery;

    @Size(max = 80, message = "Occasion must be at most 80 characters")
    private String occasion;

    @Size(max = 80, message = "Category must be at most 80 characters")
    private String category;

    @Size(max = 50, message = "Budget must be at most 50 characters")
    private String budget;

    @Size(max = 50, message = "Type must be at most 50 characters")
    private String type;
}


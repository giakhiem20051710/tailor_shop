package com.example.tailor_shop.modules.product.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StyleRequest {

    @NotBlank(message = "Style name is required")
    @Size(max = 150, message = "Style name must be at most 150 characters")
    private String name;

    @Size(max = 80, message = "Category must be at most 80 characters")
    private String category;

    @Size(max = 500, message = "Image URL must be at most 500 characters")
    private String image;

    private String description;

    @Min(value = 0, message = "Price must be greater than or equal to 0")
    private BigDecimal price;
}


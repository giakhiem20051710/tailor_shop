package com.example.tailor_shop.modules.product.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class ProductFilterRequest {

    @Size(max = 80, message = "Category must be at most 80 characters")
    private String category;

    @Size(max = 80, message = "Occasion must be at most 80 characters")
    private String occasion;

    @Size(max = 50, message = "Budget must be at most 50 characters")
    private String budget;

    @Size(max = 100, message = "Tag must be at most 100 characters")
    private String tag;

    @Size(max = 200, message = "Keyword must be at most 200 characters")
    private String keyword;

    @Min(value = 0, message = "Min price must be greater than or equal to 0")
    private BigDecimal minPrice;

    @Min(value = 0, message = "Max price must be greater than or equal to 0")
    private BigDecimal maxPrice;

    @DecimalMin(value = "0.0", message = "Min rating must be between 0 and 5")
    @DecimalMax(value = "5.0", message = "Min rating must be between 0 and 5")
    private BigDecimal minRating;
}


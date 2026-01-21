package com.example.tailor_shop.modules.product.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StyleFilterRequest {

    @Size(max = 80, message = "Category must be at most 80 characters")
    private String category;

    @Size(max = 200, message = "Keyword must be at most 200 characters")
    private String keyword;
}


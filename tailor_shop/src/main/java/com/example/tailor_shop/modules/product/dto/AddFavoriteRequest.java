package com.example.tailor_shop.modules.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddFavoriteRequest {

    @NotBlank(message = "Product key is required")
    @Size(max = 100, message = "Product key must be at most 100 characters")
    private String productKey;
}


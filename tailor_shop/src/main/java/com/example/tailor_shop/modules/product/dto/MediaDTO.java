package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Media DTO - Contains product images and media assets
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaDTO {
    private String thumbnail; // Main product image
    private List<String> gallery; // Additional product images
}


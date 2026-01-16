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
    private String thumbnail; // Thumbnail URL (300x300px)
    private String url; // Medium/Original URL
    private String large; // Large URL (1200px width)
    private List<String> gallery; // Additional product images
}


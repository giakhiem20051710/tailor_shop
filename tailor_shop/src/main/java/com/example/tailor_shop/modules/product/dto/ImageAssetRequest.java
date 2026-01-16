package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageAssetRequest {
    private String s3Key;
    private String url;
    private String thumbnailUrl;
    private String largeUrl;
    private String category; // "template", "fabric", "style"
    private String type; // "ao_dai", "quan_tay", etc.
    private String gender; // "male", "female", "unisex"
    private List<String> tags;
    private Long productTemplateId;
    private Long fabricId;
    private Long styleId;

    // === AI ANALYSIS FIELDS ===
    private String description;
    private String occasion;
    private String season;
    private String styleCategory;
    private String silhouette;
    private String lengthInfo;
    private String lining;
    private String accessories;
    private String tailoringTime;
    private String fittingCount;
    private String warranty;
    private List<String> materials;
    private List<String> colors;
    private List<String> occasions;
    private List<String> customerStyles;
    private List<String> careInstructions;
    private Double confidence;
}

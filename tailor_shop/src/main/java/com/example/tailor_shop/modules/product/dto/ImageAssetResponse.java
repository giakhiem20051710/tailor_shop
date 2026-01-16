package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageAssetResponse {
    private Long id;
    private String s3Key;
    private String url;
    private String thumbnailUrl;
    private String largeUrl;
    private String category;
    private String type;
    private String gender;
    private List<String> tags;
    private Long productTemplateId;
    private Long fabricId;
    private Long styleId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

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

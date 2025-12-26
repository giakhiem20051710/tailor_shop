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
public class CategoryTemplateResponse {
    private Long id;
    private String categoryCode;
    private String categoryName;
    private String tailoringTime;
    private String fittingCount;
    private String warranty;
    private String silhouette;
    private List<String> materials;
    private List<String> colors;
    private String lengthInfo;
    private String lining;
    private String accessories;
    private List<String> occasions;
    private List<String> customerStyles;
    private List<String> careInstructions;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

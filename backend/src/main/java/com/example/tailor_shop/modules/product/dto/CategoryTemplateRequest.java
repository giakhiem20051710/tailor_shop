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
public class CategoryTemplateRequest {
    private String categoryCode;
    private String categoryName;
    private String tailoringTime;
    private String fittingCount;
    private String warranty;
    private String silhouette;

    // Using List<String> for API convenience, will convert to JSON in service
    private List<String> materials;
    private List<String> colors;
    private String lengthInfo;
    private String lining;
    private String accessories;
    private List<String> occasions;
    private List<String> customerStyles;
    private List<String> careInstructions;
}

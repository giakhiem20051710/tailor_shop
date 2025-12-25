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
    private String category;
    private String type;
    private String gender;
    private List<String> tags;
    private Long productTemplateId;
    private Long fabricId;
    private Long styleId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


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
    private String category; // "template", "fabric", "style"
    private String type; // "ao_dai", "quan_tay", etc.
    private String gender; // "male", "female", "unisex"
    private List<String> tags;
    private Long productTemplateId;
    private Long fabricId;
    private Long styleId;
}


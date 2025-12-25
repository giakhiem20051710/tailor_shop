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
public class PreSignedUrlResponse {
    private String jobId;
    private List<PreSignedUrlInfo> urls;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreSignedUrlInfo {
        private String fileName;
        private String presignedUrl;
        private String s3Key;
        private String s3Url;
        private Boolean isDuplicate;
    }
}


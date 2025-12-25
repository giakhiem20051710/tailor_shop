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
public class BulkUploadSubmitRequest {
    private String jobId;
    private List<String> s3Urls;
    private List<String> fileNames;
    private List<String> checksums;
}


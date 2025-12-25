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
public class JobStatusResponse {
    private String jobId;
    private String status;
    private Integer totalFiles;
    private Integer processedFiles;
    private Integer successCount;
    private Integer failedCount;
    private String errorMessage;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime completedAt;
    private List<FileStatusInfo> fileStatuses;
    private Double progressPercentage; // 0.0 - 100.0

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileStatusInfo {
        private String fileName;
        private String status;
        private Long productId;
        private Long imageAssetId;
        private String errorMessage;
    }
}


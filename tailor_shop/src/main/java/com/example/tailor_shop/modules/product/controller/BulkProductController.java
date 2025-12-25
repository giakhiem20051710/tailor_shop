package com.example.tailor_shop.modules.product.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.config.storage.S3PreSignedUrlService;
import com.example.tailor_shop.modules.product.domain.BulkUploadJobEntity;
import com.example.tailor_shop.modules.product.domain.BulkUploadJobFileEntity;
import com.example.tailor_shop.modules.product.dto.*;
import com.example.tailor_shop.modules.product.repository.BulkUploadJobFileRepository;
import com.example.tailor_shop.modules.product.service.BulkProductService;
import com.example.tailor_shop.modules.product.service.DuplicateCheckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller cho bulk upload và tự động tạo sản phẩm
 */
@RestController
@RequestMapping("/api/v1/products/bulk-upload")
@RequiredArgsConstructor
@Slf4j
public class BulkProductController {

    private final BulkProductService bulkProductService;
    private final S3PreSignedUrlService s3PreSignedUrlService;
    private final DuplicateCheckService duplicateCheckService;
    private final BulkUploadJobFileRepository jobFileRepository;

    /**
     * Endpoint 1: Request pre-signed URLs
     * Tạo Job ngay tại đây (status: PENDING)
     */
    @PostMapping("/presigned-urls")
    public ResponseEntity<CommonResponse<PreSignedUrlResponse>> getPresignedUrls(
            @Valid @RequestBody PreSignedUrlRequest request) {
        
        try {
            log.info("Requesting pre-signed URLs for {} files", request.getFileNames().size());
            
            // Validate input
            if (request.getFileNames() == null || request.getFileNames().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "File names cannot be empty"));
            }
            
            int fileCount = request.getFileNames().size();
            if (request.getContentTypes() != null && request.getContentTypes().size() != fileCount) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "ContentTypes count must match fileNames count"));
            }
            
            // 1. Tạo Job ngay tại đây (status: PENDING)
            BulkUploadJobEntity job = bulkProductService.createJob(
                request.getFileNames(),
                request.getChecksums() != null ? request.getChecksums() : new ArrayList<>()
            );
            
            // 2. Check duplicates bằng checksum
            Map<String, Boolean> duplicateMap = Collections.emptyMap();
            
            if (request.getChecksums() != null && !request.getChecksums().isEmpty()) {
                duplicateMap = duplicateCheckService.checkDuplicates(request.getChecksums());
            }
            
            // 3. Generate pre-signed URLs
            List<S3PreSignedUrlService.FileInfo> fileInfos = new ArrayList<>();
            for (int i = 0; i < request.getFileNames().size(); i++) {
                String fileName = request.getFileNames().get(i);
                String contentType = (request.getContentTypes() != null && i < request.getContentTypes().size())
                    ? request.getContentTypes().get(i)
                    : "image/jpeg";
                
                fileInfos.add(S3PreSignedUrlService.FileInfo.builder()
                        .fileName(fileName)
                        .contentType(contentType)
                        .build());
            }
            
            List<S3PreSignedUrlService.PreSignedUrlInfo> presignedUrls = 
                s3PreSignedUrlService.generatePresignedUploadUrls(fileInfos);
            
            // 4. Build response với duplicate flags
            List<PreSignedUrlResponse.PreSignedUrlInfo> urlInfos = new ArrayList<>();
            for (int i = 0; i < presignedUrls.size(); i++) {
                S3PreSignedUrlService.PreSignedUrlInfo presigned = presignedUrls.get(i);
                String checksum = (request.getChecksums() != null && i < request.getChecksums().size())
                    ? request.getChecksums().get(i)
                    : null;
                
                boolean isDuplicate = checksum != null && duplicateMap.getOrDefault(checksum, false);
                
                urlInfos.add(PreSignedUrlResponse.PreSignedUrlInfo.builder()
                        .fileName(presigned.getFileName())
                        .presignedUrl(presigned.getPresignedUrl())
                        .s3Key(presigned.getS3Key())
                        .s3Url(presigned.getS3Url())
                        .isDuplicate(isDuplicate)
                        .build());
            }
            
            PreSignedUrlResponse response = PreSignedUrlResponse.builder()
                    .jobId(job.getJobId())
                    .urls(urlInfos)
                    .build();
            
            log.info("Generated {} pre-signed URLs for job: {}", urlInfos.size(), job.getJobId());
            
            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
            
        } catch (Exception e) {
            log.error("Error generating pre-signed URLs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500", 
                        "Failed to generate pre-signed URLs: " + e.getMessage()));
        }
    }

    /**
     * Endpoint 2: Submit job với list S3 URLs
     */
    @PostMapping("/submit")
    public ResponseEntity<CommonResponse<BulkUploadJobResponse>> submitBulkUpload(
            @Valid @RequestBody BulkUploadSubmitRequest request) {
        
        try {
            log.info("Submitting bulk upload job: {} with {} URLs", request.getJobId(), request.getS3Urls().size());
            
            // Validate
            if (request.getJobId() == null || request.getJobId().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "JobId is required"));
            }
            
            if (request.getS3Urls() == null || request.getS3Urls().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "S3 URLs cannot be empty"));
            }
            
            // Submit job (saves data in transaction)
            bulkProductService.submitJob(
                request.getJobId(),
                request.getS3Urls(),
                request.getFileNames() != null ? request.getFileNames() : new ArrayList<>(),
                request.getChecksums() != null ? request.getChecksums() : new ArrayList<>()
            );
            
            // Trigger async processing AFTER transaction commits
            // This prevents "Transaction silently rolled back" error
            bulkProductService.triggerAsyncProcessing(request.getJobId());
            
            // Return job status
            BulkUploadJobResponse response = getJobStatusInternal(request.getJobId());
            
            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
            
        } catch (Exception e) {
            log.error("Error submitting bulk upload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500", 
                        "Failed to submit bulk upload: " + e.getMessage()));
        }
    }

    /**
     * Endpoint 3: Get job status
     */
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<CommonResponse<JobStatusResponse>> getJobStatus(@PathVariable String jobId) {
        try {
            JobStatusResponse response = getJobStatusResponse(jobId);
            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
        } catch (Exception e) {
            log.error("Error getting job status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500", 
                        "Failed to get job status: " + e.getMessage()));
        }
    }

    /**
     * Helper method để build JobStatusResponse
     */
    private JobStatusResponse getJobStatusResponse(String jobId) {
        BulkUploadJobEntity job = bulkProductService.getJob(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
        
        List<BulkUploadJobFileEntity> jobFiles = jobFileRepository.findByJobId(jobId);
        
        List<JobStatusResponse.FileStatusInfo> fileStatuses = jobFiles.stream()
                .map(file -> JobStatusResponse.FileStatusInfo.builder()
                        .fileName(file.getFileName())
                        .status(file.getStatus().name())
                        .productId(file.getProductId())
                        .imageAssetId(file.getImageAssetId())
                        .errorMessage(file.getErrorMessage())
                        .build())
                .collect(Collectors.toList());
        
        double progressPercentage = job.getTotalFiles() > 0
            ? (double) job.getProcessedFiles() / job.getTotalFiles() * 100.0
            : 0.0;
        
        return JobStatusResponse.builder()
                .jobId(job.getJobId())
                .status(job.getStatus().name())
                .totalFiles(job.getTotalFiles())
                .processedFiles(job.getProcessedFiles())
                .successCount(job.getSuccessCount())
                .failedCount(job.getFailedCount())
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .completedAt(job.getCompletedAt())
                .fileStatuses(fileStatuses)
                .progressPercentage(progressPercentage)
                .build();
    }

    /**
     * Helper method để build BulkUploadJobResponse
     */
    private BulkUploadJobResponse getJobStatusInternal(String jobId) {
        BulkUploadJobEntity job = bulkProductService.getJob(jobId)
                .orElseThrow(() -> new NotFoundException("Job not found: " + jobId));
        
        List<BulkUploadJobFileEntity> jobFiles = jobFileRepository.findByJobId(jobId);
        
        List<BulkUploadJobResponse.FileResult> results = jobFiles.stream()
                .map(file -> BulkUploadJobResponse.FileResult.builder()
                        .fileName(file.getFileName())
                        .status(file.getStatus().name())
                        .productId(file.getProductId())
                        .imageAssetId(file.getImageAssetId())
                        .errorMessage(file.getErrorMessage())
                        .build())
                .collect(Collectors.toList());
        
        return BulkUploadJobResponse.builder()
                .jobId(job.getJobId())
                .status(job.getStatus().name())
                .totalFiles(job.getTotalFiles())
                .processedFiles(job.getProcessedFiles())
                .successCount(job.getSuccessCount())
                .failedCount(job.getFailedCount())
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .completedAt(job.getCompletedAt())
                .results(results)
                .build();
    }
}


package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.config.storage.ImageDownloadService;
import com.example.tailor_shop.config.storage.S3PreSignedUrlService;
import com.example.tailor_shop.config.storage.S3StorageService;
import com.example.tailor_shop.modules.product.domain.BulkUploadJobEntity;
import com.example.tailor_shop.modules.product.domain.BulkUploadJobFileEntity;
import com.example.tailor_shop.modules.product.dto.ImageAssetRequest;
import com.example.tailor_shop.modules.product.dto.ImageAssetResponse;
import com.example.tailor_shop.modules.product.dto.ProductRequest;
import com.example.tailor_shop.modules.product.dto.ProductDetailResponse;
import com.example.tailor_shop.modules.product.repository.BulkUploadJobFileRepository;
import com.example.tailor_shop.modules.product.repository.BulkUploadJobRepository;
import com.example.tailor_shop.modules.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * Service để xử lý bulk upload và tự động tạo sản phẩm từ ảnh
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BulkProductService {

    private final BulkUploadJobRepository jobRepository;
    private final BulkUploadJobFileRepository jobFileRepository;
    private final ImageAssetService imageAssetService;
    private final ProductService productService;
    private final ProductRepository productRepository;
    private final FilenameParserService filenameParserService;
    private final ImageClassificationService imageClassificationService;
    private final AIVisionService aiVisionService;
    private final AIRateLimiter aiRateLimiter;
    private final DuplicateCheckService duplicateCheckService;
    private final ImageDownloadService imageDownloadService;
    private final S3PreSignedUrlService s3PreSignedUrlService;
    private final S3StorageService s3StorageService;

    @Value("${bulk-upload.ai-vision.enabled:false}")
    private boolean useAIVision;

    /**
     * Get job by jobId
     */
    public Optional<BulkUploadJobEntity> getJob(String jobId) {
        return jobRepository.findByJobId(jobId);
    }

    /**
     * Tạo job ngay từ bước request pre-signed URLs
     */
    @Transactional
    public BulkUploadJobEntity createJob(List<String> fileNames, List<String> checksums) {
        String jobId = UUID.randomUUID().toString();
        
        BulkUploadJobEntity job = BulkUploadJobEntity.builder()
                .jobId(jobId)
                .status(BulkUploadJobEntity.JobStatus.PENDING)
                .totalFiles(fileNames.size())
                .processedFiles(0)
                .successCount(0)
                .failedCount(0)
                .build();
        
        job = jobRepository.save(job);
        log.info("Created bulk upload job: {} with {} files", jobId, fileNames.size());
        
        return job;
    }

    /**
     * Submit job với list S3 URLs (sau khi upload xong)
     * Lưu ý: Không dùng @Transactional vì async method không thể tham gia transaction
     */
    @Transactional
    public void submitJob(String jobId, List<String> s3Urls, List<String> fileNames, List<String> checksums) {
        BulkUploadJobEntity job = jobRepository.findByJobId(jobId)
                .orElseThrow(() -> new NotFoundException("Job not found: " + jobId));
        
        if (job.getStatus() != BulkUploadJobEntity.JobStatus.PENDING) {
            throw new IllegalStateException("Job is not in PENDING status");
        }
        
        // Create job file entities
        List<BulkUploadJobFileEntity> jobFiles = new ArrayList<>();
        for (int i = 0; i < s3Urls.size(); i++) {
            String s3Url = s3Urls.get(i);
            String fileName = i < fileNames.size() ? fileNames.get(i) : extractFileNameFromUrl(s3Url);
            String checksum = i < checksums.size() ? checksums.get(i) : null;
            String s3Key = s3PreSignedUrlService.extractS3KeyFromUrl(s3Url);
            
            BulkUploadJobFileEntity jobFile = BulkUploadJobFileEntity.builder()
                    .jobId(jobId)
                    .s3Url(s3Url)
                    .s3Key(s3Key != null ? s3Key : extractKeyFromUrl(s3Url))
                    .fileName(fileName)
                    .checksum(checksum)
                    .status(BulkUploadJobFileEntity.FileStatus.PENDING)
                    .build();
            
            jobFiles.add(jobFile);
        }
        
        jobFileRepository.saveAll(jobFiles);
        
        // Update job status
        job.setStatus(BulkUploadJobEntity.JobStatus.READY);
        job.setTotalFiles(s3Urls.size());
        jobRepository.save(job);
        
        log.info("Submitted job: {} with {} files", jobId, s3Urls.size());
        
        // Transaction sẽ commit ở đây trước khi trigger async
        // Sau đó trigger async processing (chạy trong thread riêng, không trong transaction)
    }
    
    /**
     * Trigger async processing sau khi transaction đã commit
     * Method này được gọi từ controller sau khi submitJob() hoàn thành
     */
    public void triggerAsyncProcessing(String jobId) {
        // Trigger async processing sau khi transaction đã commit
        processJobAsync(jobId);
    }

    /**
     * Process job asynchronously với rate limiting
     */
    @Async("bulkUploadExecutor")
    public void processJobAsync(String jobId) {
        BulkUploadJobEntity job = jobRepository.findByJobId(jobId)
                .orElseThrow(() -> new NotFoundException("Job not found: " + jobId));
        
        job.setStatus(BulkUploadJobEntity.JobStatus.PROCESSING);
        jobRepository.save(job);
        
        List<BulkUploadJobFileEntity> jobFiles = jobFileRepository.findByJobId(jobId);
        int total = jobFiles.size();
        int success = 0;
        int failed = 0;
        
        log.info("Starting to process job: {} with {} files", jobId, total);
        
        for (int i = 0; i < total; i++) {
            BulkUploadJobFileEntity jobFile = jobFiles.get(i);
            
            // Process each file in separate transaction
            try {
                processSingleFile(jobFile, jobId);
                jobFile.setStatus(BulkUploadJobFileEntity.FileStatus.SUCCESS);
                success++;
                log.debug("Successfully processed file {}: {}", i + 1, jobFile.getFileName());
            } catch (Exception e) {
                log.error("Failed to process file {}: {}", jobFile.getS3Url(), e.getMessage(), e);
                jobFile.setStatus(BulkUploadJobFileEntity.FileStatus.FAILED);
                jobFile.setErrorMessage(e.getMessage());
                failed++;
            } finally {
                jobFileRepository.save(jobFile);
            }
            
            // Update job progress (batch update every 10 files)
            if ((i + 1) % 10 == 0 || i == total - 1) {
                job.setProcessedFiles(i + 1);
                job.setSuccessCount(success);
                job.setFailedCount(failed);
                jobRepository.save(job);
                log.info("Job {} progress: {}/{} (success: {}, failed: {})", 
                    jobId, i + 1, total, success, failed);
            }
        }
        
        // Final status update
        job.setStatus(failed == total ? BulkUploadJobEntity.JobStatus.FAILED : BulkUploadJobEntity.JobStatus.COMPLETED);
        job.setCompletedAt(OffsetDateTime.now());
        if (failed > 0 && success == 0) {
            job.setErrorMessage("All files failed to process");
        }
        jobRepository.save(job);
        
        log.info("Completed job: {} (success: {}, failed: {})", jobId, success, failed);
    }

    /**
     * Process single file trong transaction riêng
     */
    @Transactional(rollbackFor = Exception.class)
    private void processSingleFile(BulkUploadJobFileEntity jobFile, String jobId) {
        String s3Url = jobFile.getS3Url();
        String fileName = jobFile.getFileName();
        
        log.debug("Processing file: {} from job: {}", fileName, jobId);
        
        // 1. Download from S3 using S3 SDK (không cần public read)
        // Retry logic với exponential backoff để đợi file được upload xong
        byte[] imageData;
        try {
            // Extract S3 key từ URL
            String s3Key = s3StorageService.extractS3KeyFromUrl(s3Url);
            if (s3Key == null || s3Key.isBlank()) {
                // Fallback: dùng key từ jobFile nếu có
                s3Key = jobFile.getS3Key();
            }
            if (s3Key == null || s3Key.isBlank()) {
                throw new IllegalArgumentException("Cannot extract S3 key from URL: " + s3Url);
            }
            
            // Retry logic: Đợi file được upload xong (có thể có delay)
            int maxRetries = 5;
            int retryDelayMs = 1000; // Bắt đầu với 1 giây
            boolean downloaded = false;
            IOException lastException = null;
            
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // Kiểm tra file tồn tại trước
                    if (s3StorageService.objectExists(s3Key)) {
                        // Download từ S3 bằng SDK (không cần public read)
                        imageData = s3StorageService.downloadObject(s3Key);
                        log.debug("Downloaded image from S3: {} ({} bytes) using SDK (attempt {})", 
                                s3Key, imageData.length, attempt);
                        downloaded = true;
                        break;
                    } else {
                        log.warn("Object not found in S3: {} (attempt {}/{})", s3Key, attempt, maxRetries);
                        if (attempt < maxRetries) {
                            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                            log.info("Waiting {}ms before retry...", retryDelayMs);
                            Thread.sleep(retryDelayMs);
                            retryDelayMs *= 2;
                        }
                    }
                } catch (IOException e) {
                    lastException = e;
                    if (attempt < maxRetries) {
                        log.debug("Failed to download from S3: {} (attempt {}/{}), retrying...", 
                                s3Key, attempt, maxRetries);
                        Thread.sleep(retryDelayMs);
                        retryDelayMs *= 2;
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Download interrupted", e);
                }
            }
            
            if (!downloaded) {
                String errorMsg = String.format(
                    "Failed to download image from S3 after %d attempts (total wait time: ~%ds). Key: %s, URL: %s. " +
                    "Possible causes: 1) File was not uploaded successfully, 2) S3 eventual consistency delay, 3) Wrong S3 key.",
                    maxRetries, (1000 + 2000 + 4000 + 8000 + 16000) / 1000, s3Key, s3Url
                );
                log.error(errorMsg);
                if (lastException != null) {
                    throw new RuntimeException(errorMsg, lastException);
                } else {
                    throw new RuntimeException(errorMsg + " Object does not exist in S3 after all retries.");
                }
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to download image from S3: " + e.getMessage(), e);
        }
        
        // 2. Parse filename (Tier 1)
        FilenameParserService.ProductInfo filenameInfo = filenameParserService.parseFilename(fileName);
        
        // 3. AI Vision (Tier 2) - WITH RATE LIMITING
        FilenameParserService.ProductInfo productInfo = filenameInfo;
        if (useAIVision) {
            try {
                AIVisionService.AIVisionResult aiResult = aiRateLimiter.executeWithRateLimit(() -> 
                    aiVisionService.analyzeImage(s3Url)
                );
                if (aiResult != null) {
                    productInfo = aiVisionService.mergeInfo(filenameInfo, aiResult);
                    log.debug("AI Vision analysis completed for: {}", fileName);
                }
            } catch (Exception e) {
                log.warn("AI Vision analysis failed for {}: {}, using filename info only", fileName, e.getMessage());
                // Continue with filename info only
            }
        }
        
        // 4. Classify image
        String description = productInfo.getDescription() != null ? productInfo.getDescription() : fileName;
        ImageClassificationService.ImageClassificationResult classification = 
            imageClassificationService.classify(description, fileName);
        
        // 5. Create ImageAsset (trong transaction)
        String s3Key = jobFile.getS3Key();
        ImageAssetRequest imageAssetRequest = ImageAssetRequest.builder()
                .s3Key(s3Key)
                .url(s3Url)
                .category(classification.getCategory())
                .type(classification.getType())
                .gender(classification.getGender())
                .tags(classification.getTags())
                .build();
        
        ImageAssetResponse imageAsset = imageAssetService.create(imageAssetRequest);
        jobFile.setImageAssetId(imageAsset.getId());
        log.debug("Created ImageAsset: {} for file: {}", imageAsset.getId(), fileName);
        
        // 6. Create Product (trong transaction)
        // Nếu lỗi ở đây, toàn bộ transaction rollback → ImageAsset cũng không được tạo
        String productKey = generateProductKey(productInfo.getName(), fileName);
        
        // Ensure unique key
        int suffix = 0;
        String finalKey = productKey;
        while (productRepository.existsByKeyAndIsDeletedFalse(finalKey)) {
            finalKey = productKey + "-" + (++suffix);
        }
        
        ProductRequest productRequest = ProductRequest.builder()
                .key(finalKey)
                .name(productInfo.getName() != null ? productInfo.getName() : fileName)
                .description(productInfo.getDescription())
                .price(productInfo.getPrice() != null ? productInfo.getPrice() : BigDecimal.valueOf(500000))
                .category(productInfo.getCategory() != null ? productInfo.getCategory() : classification.getCategory())
                .image(s3Url)
                .gallery(Collections.singletonList(s3Url))
                .tag(productInfo.getCategory() != null ? productInfo.getCategory() : "collection")
                .budget(calculateBudget(productInfo.getPrice()))
                .type("collection")
                .occasion(getDefaultOccasion(productInfo.getCategory()))
                .build();
        
        ProductDetailResponse product = productService.create(productRequest);
        jobFile.setProductId(product.getId());
        log.debug("Created Product: {} (key: {}) for file: {}", product.getId(), finalKey, fileName);
        
        // 7. Save checksum for de-duplication
        if (jobFile.getChecksum() != null && !jobFile.getChecksum().isEmpty()) {
            duplicateCheckService.saveChecksum(
                jobFile.getChecksum(),
                imageAsset.getId(),
                product.getId(),
                s3Url
            );
        }
        
        // Nếu đến đây không có exception → commit transaction
        // Nếu có exception → rollback tất cả (ImageAsset + Product đều không được tạo)
    }

    private String generateProductKey(String name, String fileName) {
        if (name != null && !name.isEmpty()) {
            return name.toLowerCase()
                    .replaceAll("[^a-z0-9\\s-]", "")
                    .replaceAll("\\s+", "-")
                    .replaceAll("-+", "-")
                    .replaceAll("^-|-$", "");
        }
        
        // Fallback to filename
        String nameWithoutExt = fileName.replaceAll("\\.[^.]+$", "");
        return nameWithoutExt.toLowerCase()
                .replaceAll("[^a-z0-9-]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private String calculateBudget(BigDecimal price) {
        if (price == null) {
            return "mid";
        }
        double priceValue = price.doubleValue();
        if (priceValue > 3_000_000) {
            return "high";
        } else if (priceValue > 2_000_000) {
            return "mid";
        } else {
            return "low";
        }
    }

    private String getDefaultOccasion(String category) {
        if (category == null) {
            return "daily";
        }
        return switch (category.toLowerCase()) {
            case "ao-dai" -> "wedding";
            case "vest" -> "office";
            case "dam" -> "party";
            default -> "daily";
        };
    }

    private String extractFileNameFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "unknown.jpg";
        }
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < url.length() - 1) {
            return url.substring(lastSlash + 1);
        }
        return "unknown.jpg";
    }

    private String extractKeyFromUrl(String url) {
        String key = s3PreSignedUrlService.extractS3KeyFromUrl(url);
        if (key != null) {
            return key;
        }
        // Fallback: extract from URL
        int index = url.indexOf(".amazonaws.com/");
        if (index > 0) {
            return url.substring(index + ".amazonaws.com/".length());
        }
        return "images/" + UUID.randomUUID() + ".jpg";
    }
}


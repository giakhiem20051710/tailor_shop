package com.example.tailor_shop.modules.product.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.storage.ImageProcessingService;
import com.example.tailor_shop.config.storage.S3StorageService;
import com.example.tailor_shop.modules.product.dto.ImageAssetRequest;
import com.example.tailor_shop.modules.product.dto.ImageAssetResponse;
import com.example.tailor_shop.modules.product.dto.ProductAnalysisResult;
import com.example.tailor_shop.modules.product.service.ImageAssetService;
import com.example.tailor_shop.modules.product.service.ImageClassificationService;
import com.example.tailor_shop.modules.product.service.GeminiVisionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/v1/image-assets")
@RequiredArgsConstructor
@Slf4j
public class ImageAssetController {

    private final ImageAssetService imageAssetService;
    private final S3StorageService s3StorageService;
    private final ImageClassificationService classificationService;
    private final ImageProcessingService imageProcessingService;
    private final GeminiVisionService geminiVisionService;

    @Value("${image-processing.enabled:true}")
    private boolean imageProcessingEnabled;

    @Value("${image-processing.target-width:800}")
    private int targetWidth;

    @Value("${image-processing.target-height:1200}")
    private int targetHeight;

    @Value("${image-processing.smart-crop:true}")
    private boolean smartCropEnabled;

    @PostMapping
    public ResponseEntity<CommonResponse<ImageAssetResponse>> create(
            @Valid @RequestBody ImageAssetRequest request) {
        ImageAssetResponse response = imageAssetService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    /**
     * Upload ảnh và phân tích với Gemini AI
     * Trả về kết quả phân tích chi tiết + URL ảnh đã upload
     */
    @PostMapping("/analyze")
    public ResponseEntity<CommonResponse<ProductAnalysisResult>> analyzeWithAI(
            @RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "File không được để trống"));
            }

            String fileName = file.getOriginalFilename();
            log.info("🤖 Analyzing image with AI: {}", fileName);

            // 1. Đọc dữ liệu ảnh
            byte[] imageData = file.getBytes();
            String contentType = file.getContentType();

            // 2. Gọi Gemini AI để phân tích
            ProductAnalysisResult analysisResult = geminiVisionService.analyzeImage(imageData, contentType);
            log.info("✅ AI Analysis complete: category={}, type={}, gender={}",
                    analysisResult.getCategory(), analysisResult.getType(), analysisResult.getGender());

            // 3. Xử lý ảnh (resize, smart crop)
            if (imageProcessingEnabled) {
                try {
                    Optional<ImageProcessingService.BoundingBox> boundingBox = Optional.empty();

                    if (smartCropEnabled) {
                        try {
                            java.awt.image.BufferedImage image = javax.imageio.ImageIO.read(
                                    new java.io.ByteArrayInputStream(imageData));
                            if (image != null) {
                                Optional<ImageProcessingService.BoundingBox> detectedBox = imageProcessingService
                                        .detectContentBounds(image);
                                if (detectedBox.isPresent()) {
                                    boundingBox = detectedBox;
                                    log.info("🔍 Detected content bounds for AI analysis");
                                }
                            }
                        } catch (Exception e) {
                            log.warn("⚠️ Failed to detect content bounds: {}", e.getMessage());
                        }
                    }

                    imageData = imageProcessingService.processImage(
                            imageData, targetWidth, targetHeight, boundingBox, false);
                    log.info("📦 Image processed: {}KB", imageData.length / 1024);
                } catch (IOException e) {
                    log.warn("⚠️ Failed to process image, using original: {}", e.getMessage());
                }
            }

            // 4. Tạo thumbnail và large version
            String thumbnailUrl = null;
            String largeUrl = null;

            try {
                byte[] thumbnailData = imageProcessingService.createThumbnail(file.getBytes());
                String thumbnailFileName = "thumb_" + fileName;
                thumbnailUrl = s3StorageService.uploadImage("images/thumbnails", thumbnailData, thumbnailFileName,
                        contentType);
                log.info("📷 Thumbnail uploaded: {}", thumbnailUrl);
            } catch (Exception e) {
                log.warn("Failed to create thumbnail: {}", e.getMessage());
            }

            try {
                byte[] largeData = imageProcessingService.createLargeVersion(file.getBytes());
                String largeFileName = "large_" + fileName;
                largeUrl = s3StorageService.uploadImage("images/large", largeData, largeFileName, contentType);
                log.info("📷 Large version uploaded: {}", largeUrl);
            } catch (Exception e) {
                log.warn("Failed to create large version: {}", e.getMessage());
            }

            // 5. Upload ảnh gốc đã xử lý lên S3
            String s3Url = s3StorageService.uploadImage("images", imageData, fileName, contentType);
            log.info("📤 Uploaded to S3: {}", s3Url);

            // 6. Tạo ImageAsset với metadata từ AI
            ImageAssetRequest request = ImageAssetRequest.builder()
                    .s3Key(extractS3KeyFromUrl(s3Url))
                    .url(s3Url)
                    .thumbnailUrl(thumbnailUrl)
                    .largeUrl(largeUrl)
                    .category(analysisResult.getCategory())
                    .type(analysisResult.getType())
                    .gender(analysisResult.getGender())
                    .tags(analysisResult.getTags())
                    .build();

            ImageAssetResponse savedAsset = imageAssetService.create(request);
            log.info(" Created ImageAsset with ID: {}", savedAsset.getId());

            // 7. Thêm thông tin ảnh vào kết quả phân tích
            analysisResult.setImageUrl(s3Url);
            analysisResult.setThumbnailUrl(thumbnailUrl);
            analysisResult.setLargeUrl(largeUrl);
            analysisResult.setImageAssetId(savedAsset.getId());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), analysisResult));

        } catch (Exception e) {
            log.error("❌ Error analyzing image: {}", e.getMessage(), e);

            String errorMessage = "Lỗi phân tích ảnh";
            if (e.getMessage() != null) {
                errorMessage = "Lỗi: " + e.getMessage();
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500", errorMessage));
        }
    }

    /**
     * Chỉ phân tích ảnh với AI, không upload (dùng cho preview trước khi lưu)
     */
    @PostMapping("/analyze-only")
    public ResponseEntity<CommonResponse<ProductAnalysisResult>> analyzeOnly(
            @RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "File không được để trống"));
            }

            log.info("🤖 Analyzing image only (no upload): {}", file.getOriginalFilename());

            // Gọi Gemini AI để phân tích
            ProductAnalysisResult analysisResult = geminiVisionService.analyzeImage(
                    file.getBytes(),
                    file.getContentType());

            log.info("✅ AI Analysis complete: category={}, type={}, gender={}",
                    analysisResult.getCategory(), analysisResult.getType(), analysisResult.getGender());

            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), analysisResult));

        } catch (Exception e) {
            log.error("❌ Error analyzing image: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500",
                            "Lỗi phân tích ảnh: " + e.getMessage()));
        }
    }

    /**
     * Lưu ảnh với metadata đã được user chỉnh sửa
     */
    @PostMapping("/save-with-metadata")
    public ResponseEntity<CommonResponse<ProductAnalysisResult>> saveWithMetadata(
            @RequestParam("file") MultipartFile file,
            @RequestParam("metadata") String metadataJson) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "File không được để trống"));
            }

            // Parse metadata JSON
            ObjectMapper objectMapper = new ObjectMapper();
            ProductAnalysisResult editedResult = objectMapper.readValue(metadataJson, ProductAnalysisResult.class);

            log.info("💾 Saving image with edited metadata: {}, category={}, type={}",
                    file.getOriginalFilename(), editedResult.getCategory(), editedResult.getType());

            String fileName = file.getOriginalFilename();

            byte[] imageData = file.getBytes();
            String contentType = file.getContentType();

            // 1. Xử lý ảnh
            if (imageProcessingEnabled) {
                try {
                    imageData = imageProcessingService.processImage(
                            imageData, targetWidth, targetHeight, Optional.empty(), false);
                } catch (IOException e) {
                    log.warn("⚠️ Failed to process image: {}", e.getMessage());
                }
            }

            // 2. Upload ảnh
            String s3Url = s3StorageService.uploadImage("images", imageData, fileName, contentType);

            String thumbnailUrl = null;
            String largeUrl = null;
            try {
                byte[] thumbnailData = imageProcessingService.createThumbnail(file.getBytes());
                thumbnailUrl = s3StorageService.uploadImage("images/thumbnails", thumbnailData, "thumb_" + fileName,
                        contentType);
            } catch (Exception e) {
                log.warn("Failed to create thumbnail: {}", e.getMessage());
            }

            try {
                byte[] largeData = imageProcessingService.createLargeVersion(file.getBytes());
                largeUrl = s3StorageService.uploadImage("images/large", largeData, "large_" + fileName, contentType);
            } catch (Exception e) {
                log.warn("Failed to create large version: {}", e.getMessage());
            }

            // 3. Tạo ImageAsset với metadata từ user (bao gồm AI analysis)
            ImageAssetRequest request = ImageAssetRequest.builder()
                    .s3Key(extractS3KeyFromUrl(s3Url))
                    .url(s3Url)
                    .thumbnailUrl(thumbnailUrl)
                    .largeUrl(largeUrl)
                    .category(editedResult.getCategory())
                    .type(editedResult.getType())
                    .gender(editedResult.getGender())
                    .tags(editedResult.getTags())
                    // AI Analysis Fields
                    .description(editedResult.getDescription())
                    .occasion(editedResult.getOccasion())
                    .season(editedResult.getSeason())
                    .styleCategory(editedResult.getStyle())
                    .silhouette(editedResult.getSilhouette())
                    .lengthInfo(editedResult.getLengthInfo())
                    .lining(editedResult.getLining())
                    .accessories(editedResult.getAccessories())
                    .tailoringTime(editedResult.getTailoringTime())
                    .fittingCount(editedResult.getFittingCount())
                    .warranty(editedResult.getWarranty())
                    .materials(editedResult.getMaterials())
                    .colors(editedResult.getColors())
                    .occasions(editedResult.getOccasions())
                    .customerStyles(editedResult.getCustomerStyles())
                    .careInstructions(editedResult.getCareInstructions())
                    .confidence(editedResult.getConfidence())
                    .build();

            ImageAssetResponse savedAsset = imageAssetService.create(request);
            log.info("✅ Saved ImageAsset with ID: {}", savedAsset.getId());

            // 4. Cập nhật kết quả với thông tin ảnh
            editedResult.setImageUrl(s3Url);
            editedResult.setThumbnailUrl(thumbnailUrl);
            editedResult.setLargeUrl(largeUrl);
            editedResult.setImageAssetId(savedAsset.getId());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), editedResult));

        } catch (Exception e) {
            log.error("❌ Error saving image with metadata: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500",
                            "Lỗi lưu ảnh: " + e.getMessage()));
        }
    }

    /**
     * Phân tích nhiều ảnh với AI cùng lúc (Bulk Analyze)
     * 
     * @param files Danh sách file ảnh
     * @return Danh sách kết quả phân tích
     */
    @PostMapping("/analyze-bulk")
    public ResponseEntity<CommonResponse<List<ProductAnalysisResult>>> analyzeBulkWithAI(
            @RequestParam("files") List<MultipartFile> files) {
        try {
            if (files == null || files.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400",
                                "Không có file nào được chọn"));
            }

            log.info("🤖 Bulk analyzing {} images with AI", files.size());

            List<ProductAnalysisResult> results = new java.util.ArrayList<>();
            int successCount = 0;
            int failCount = 0;

            for (int i = 0; i < files.size(); i++) {
                MultipartFile file = files.get(i);
                String fileName = file.getOriginalFilename();

                try {
                    log.info("🔄 Processing [{}/{}]: {}", i + 1, files.size(), fileName);

                    // 1. Phân tích với AI
                    ProductAnalysisResult analysisResult = geminiVisionService.analyzeImage(
                            file.getBytes(),
                            file.getContentType());

                    // Log chi tiết kết quả AI để debug
                    log.info("🤖 AI Result for {}: category={}, type={}, desc={}",
                            fileName,
                            analysisResult.getCategory(),
                            analysisResult.getType(),
                            analysisResult.getDescription() != null ? analysisResult.getDescription().substring(0,
                                    Math.min(50, analysisResult.getDescription().length())) : "null");

                    // 2. Xử lý ảnh
                    byte[] imageData = file.getBytes();
                    String contentType = file.getContentType();

                    if (imageProcessingEnabled) {
                        try {
                            imageData = imageProcessingService.processImage(
                                    imageData, targetWidth, targetHeight, Optional.empty(), false);
                        } catch (IOException e) {
                            log.warn("⚠️ Failed to process image {}: {}", fileName, e.getMessage());
                        }
                    }

                    // 3. Upload lên S3
                    String s3Url = s3StorageService.uploadImage("images", imageData, fileName, contentType);

                    String thumbnailUrl = null;
                    String largeUrl = null;
                    try {
                        byte[] thumbnailData = imageProcessingService.createThumbnail(file.getBytes());
                        thumbnailUrl = s3StorageService.uploadImage("images/thumbnails", thumbnailData,
                                "thumb_" + fileName, contentType);
                    } catch (Exception e) {
                        log.warn("Failed to create thumbnail for {}: {}", fileName, e.getMessage());
                    }

                    try {
                        byte[] largeData = imageProcessingService.createLargeVersion(file.getBytes());
                        largeUrl = s3StorageService.uploadImage("images/large", largeData, "large_" + fileName,
                                contentType);
                    } catch (Exception e) {
                        log.warn("Failed to create large version for {}: {}", fileName, e.getMessage());
                    }

                    // 4. Tạo ImageAsset với tất cả AI fields (giống /save-with-metadata)
                    ImageAssetRequest request = ImageAssetRequest.builder()
                            .s3Key(extractS3KeyFromUrl(s3Url))
                            .url(s3Url)
                            .thumbnailUrl(thumbnailUrl)
                            .largeUrl(largeUrl)
                            // Basic fields
                            .category(analysisResult.getCategory())
                            .type(analysisResult.getType())
                            .gender(analysisResult.getGender())
                            .tags(analysisResult.getTags())
                            // AI Analysis Fields (đầy đủ như /save-with-metadata)
                            .description(analysisResult.getDescription())
                            .occasion(analysisResult.getOccasion())
                            .season(analysisResult.getSeason())
                            .styleCategory(analysisResult.getStyle())
                            .silhouette(analysisResult.getSilhouette())
                            .lengthInfo(analysisResult.getLengthInfo())
                            .lining(analysisResult.getLining())
                            .accessories(analysisResult.getAccessories())
                            .tailoringTime(analysisResult.getTailoringTime())
                            .fittingCount(analysisResult.getFittingCount())
                            .warranty(analysisResult.getWarranty())
                            .materials(analysisResult.getMaterials())
                            .colors(analysisResult.getColors())
                            .occasions(analysisResult.getOccasions())
                            .customerStyles(analysisResult.getCustomerStyles())
                            .careInstructions(analysisResult.getCareInstructions())
                            .confidence(analysisResult.getConfidence())
                            .build();

                    ImageAssetResponse savedAsset = imageAssetService.create(request);

                    // 5. Cập nhật kết quả
                    analysisResult.setImageUrl(s3Url);
                    analysisResult.setThumbnailUrl(thumbnailUrl);
                    analysisResult.setLargeUrl(largeUrl);
                    analysisResult.setImageAssetId(savedAsset.getId());

                    results.add(analysisResult);
                    successCount++;

                    log.info("✅ [{}/{}] Processed: {} -> category={}, type={}",
                            i + 1, files.size(), fileName,
                            analysisResult.getCategory(), analysisResult.getType());

                    // ⏳ DELAY giữa các request để tránh rate limiting của Gemini API
                    // Gemini có rate limit ~60 requests/minute, nên delay 2 giây giữa mỗi request
                    if (i < files.size() - 1) {
                        log.debug("⏳ Waiting 2s before next API call to avoid rate limiting...");
                        Thread.sleep(2000);
                    }

                } catch (Exception e) {
                    log.error("❌ Error processing {}: {}", fileName, e.getMessage());
                    failCount++;

                    // Thêm kết quả lỗi
                    ProductAnalysisResult errorResult = ProductAnalysisResult.builder()
                            .description("Lỗi xử lý: " + e.getMessage())
                            .confidence(0.0)
                            .build();
                    results.add(errorResult);
                }
            }

            log.info("📊 Bulk analysis complete: {} success, {} failed", successCount, failCount);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), results));

        } catch (Exception e) {
            log.error("❌ Error in bulk analyze: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500",
                            "Lỗi phân tích hàng loạt: " + e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<CommonResponse<ImageAssetResponse>> uploadAndClassify(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "File không được để trống"));
            }

            String fileName = file.getOriginalFilename();
            log.info("📁 Uploading file: {}", fileName);

            // 1. Xử lý ảnh chất lượng cao (nếu enabled)
            byte[] imageData = file.getBytes();
            String contentType = file.getContentType();

            if (imageProcessingEnabled) {
                try {
                    Optional<ImageProcessingService.BoundingBox> boundingBox = Optional.empty();

                    // Smart Cropping: Tự động phát hiện và cắt bỏ khoảng trống
                    if (smartCropEnabled) {
                        try {
                            java.awt.image.BufferedImage image = javax.imageio.ImageIO.read(
                                    new java.io.ByteArrayInputStream(imageData));
                            if (image != null) {
                                Optional<ImageProcessingService.BoundingBox> detectedBox = imageProcessingService
                                        .detectContentBounds(image);
                                if (detectedBox.isPresent()) {
                                    boundingBox = detectedBox;
                                    log.info("🔍 Detected content bounds: {}x{} at ({}, {})",
                                            detectedBox.get().width, detectedBox.get().height,
                                            detectedBox.get().x, detectedBox.get().y);
                                }
                            }
                        } catch (Exception e) {
                            log.warn("⚠️ Failed to detect content bounds, using original image: {}", e.getMessage());
                        }
                    }

                    // Xử lý ảnh với tất cả các tính năng tối ưu
                    imageData = imageProcessingService.processImage(
                            imageData,
                            targetWidth,
                            targetHeight,
                            boundingBox,
                            false // Chưa hỗ trợ WebP conversion trong controller
                    );

                    log.info(" Image processed: size={}KB, targetSize={}x{} (Retina: {}x{})",
                            imageData.length / 1024, targetWidth, targetHeight,
                            targetWidth * 2, targetHeight * 2);
                } catch (IOException e) {
                    log.warn(" Failed to process image, using original: {}", e.getMessage());
                    // Fallback: sử dụng ảnh gốc nếu xử lý thất bại
                }
            }

            // 2. Tạo thumbnail và large version
            byte[] thumbnailData = null;
            byte[] largeData = null;
            String thumbnailUrl = null;
            String largeUrl = null;

            try {
                // Tạo thumbnail (300x300, 70% quality)
                thumbnailData = imageProcessingService.createThumbnail(file.getBytes());
                String thumbnailFileName = "thumb_" + fileName;
                thumbnailUrl = s3StorageService.uploadImage("images/thumbnails", thumbnailData, thumbnailFileName,
                        contentType);
                log.info(" Thumbnail uploaded: {}", thumbnailUrl);
            } catch (Exception e) {
                log.warn("Failed to create thumbnail: {}", e.getMessage());
            }

            try {
                // Tạo large version (1200px width, 90% quality)
                largeData = imageProcessingService.createLargeVersion(file.getBytes());
                String largeFileName = "large_" + fileName;
                largeUrl = s3StorageService.uploadImage("images/large", largeData, largeFileName, contentType);
                log.info(" Large version uploaded: {}", largeUrl);
            } catch (Exception e) {
                log.warn(" Failed to create large version: {}", e.getMessage());
            }

            // 3. Upload file đã xử lý lên S3 (medium/original)
            // Tạm thời dùng prefix "images" - sau này có thể dựa vào classification để chọn
            // prefix
            String s3Url = s3StorageService.uploadImage("images", imageData, fileName, contentType);
            log.info(" Uploaded to S3: {}", s3Url);

            // 2. Tự động phân loại dựa trên tên file và mô tả
            // Nếu không có description, dùng tên file làm description
            String descriptionToUse = description != null && !description.trim().isEmpty()
                    ? description
                    : fileName != null ? fileName.replaceAll("[._-]", " ") : "";

            ImageClassificationService.ImageClassificationResult classification = classificationService
                    .classify(descriptionToUse, fileName);

            log.info("🔍 Classification result: category={}, type={}, gender={}, tags={}",
                    classification.getCategory(), classification.getType(),
                    classification.getGender(), classification.getTags());

            // 4. Tạo ImageAsset với metadata đã phân loại
            ImageAssetRequest request = ImageAssetRequest.builder()
                    .s3Key(extractS3KeyFromUrl(s3Url))
                    .url(s3Url)
                    .thumbnailUrl(thumbnailUrl)
                    .largeUrl(largeUrl)
                    .category(classification.getCategory())
                    .type(classification.getType())
                    .gender(classification.getGender())
                    .tags(classification.getTags())
                    .build();

            ImageAssetResponse response = imageAssetService.create(request);

            log.info("✅ Created ImageAsset with ID: {}", response.getId());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));

        } catch (Exception e) {
            log.error("❌ Error uploading image: {}", e.getMessage(), e);

            // Hiển thị lỗi chi tiết hơn cho user
            String errorMessage = "Lỗi khi upload ảnh";
            if (e.getMessage() != null) {
                if (e.getMessage().contains("Access Denied") || e.getMessage().contains("AccessDenied")) {
                    errorMessage = "Lỗi quyền truy cập S3. Vui lòng kiểm tra AWS credentials và IAM permissions.";
                } else if (e.getMessage().contains("bucket")) {
                    errorMessage = "Lỗi S3 bucket. Vui lòng kiểm tra bucket name và region.";
                } else {
                    errorMessage = "Lỗi: " + e.getMessage();
                }
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500", errorMessage));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<ImageAssetResponse>> getById(@PathVariable Long id) {
        ImageAssetResponse response = imageAssetService.getById(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    @GetMapping
    public ResponseEntity<CommonResponse<Page<ImageAssetResponse>>> getAll(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ImageAssetResponse> response = imageAssetService.getAll(pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<CommonResponse<Page<ImageAssetResponse>>> getByCategory(
            @PathVariable String category,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ImageAssetResponse> response = imageAssetService.getByCategory(category, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    @GetMapping("/category/{category}/type/{type}")
    public ResponseEntity<CommonResponse<Page<ImageAssetResponse>>> getByCategoryAndType(
            @PathVariable String category,
            @PathVariable String type,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ImageAssetResponse> response = imageAssetService.getByCategoryAndType(category, type, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    @GetMapping("/filter")
    public ResponseEntity<CommonResponse<Page<ImageAssetResponse>>> filter(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String gender,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ImageAssetResponse> response;
        if (category != null && type != null && gender != null) {
            response = imageAssetService.getByCategoryTypeAndGender(category, type, gender, pageable);
        } else if (category != null && type != null) {
            response = imageAssetService.getByCategoryAndType(category, type, pageable);
        } else if (category != null) {
            response = imageAssetService.getByCategory(category, pageable);
        } else {
            response = imageAssetService.getAll(pageable);
        }
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    @GetMapping("/template/{templateId}")
    public ResponseEntity<CommonResponse<java.util.List<ImageAssetResponse>>> getByTemplateId(
            @PathVariable Long templateId) {
        java.util.List<ImageAssetResponse> response = imageAssetService.getByTemplateId(templateId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<CommonResponse<Void>> delete(@PathVariable Long id) {
        try {
            // 1. Lấy thông tin ImageAsset trước khi xóa
            ImageAssetResponse imageAsset = imageAssetService.getById(id);

            log.info("🗑️ Deleting ImageAsset ID: {}, S3Key: {}", id, imageAsset.getS3Key());

            // 2. Xóa files từ S3 (original, thumbnail, large)
            int deletedCount = 0;

            // Xóa original/medium file
            if (imageAsset.getS3Key() != null && !imageAsset.getS3Key().isBlank()) {
                try {
                    boolean deleted = s3StorageService.deleteFile(imageAsset.getS3Key());
                    if (deleted) {
                        deletedCount++;
                        log.info(" Deleted S3 file: {}", imageAsset.getS3Key());
                    } else {
                        log.warn(" S3 file not found (may already be deleted): {}", imageAsset.getS3Key());
                    }
                } catch (Exception e) {
                    log.error(" Failed to delete S3 file {}: {}", imageAsset.getS3Key(), e.getMessage());
                    // Tiếp tục xóa các file khác và database record
                }
            }

            // Xóa thumbnail file
            if (imageAsset.getThumbnailUrl() != null && !imageAsset.getThumbnailUrl().isBlank()) {
                try {
                    String thumbnailKey = s3StorageService.extractS3KeyFromUrl(imageAsset.getThumbnailUrl());
                    if (thumbnailKey != null) {
                        boolean deleted = s3StorageService.deleteFile(thumbnailKey);
                        if (deleted) {
                            deletedCount++;
                            log.info(" Deleted thumbnail: {}", thumbnailKey);
                        }
                    }
                } catch (Exception e) {
                    log.error(" Failed to delete thumbnail {}: {}", imageAsset.getThumbnailUrl(), e.getMessage());
                }
            }

            // Xóa large file
            if (imageAsset.getLargeUrl() != null && !imageAsset.getLargeUrl().isBlank()) {
                try {
                    String largeKey = s3StorageService.extractS3KeyFromUrl(imageAsset.getLargeUrl());
                    if (largeKey != null) {
                        boolean deleted = s3StorageService.deleteFile(largeKey);
                        if (deleted) {
                            deletedCount++;
                            log.info("✅ Deleted large version: {}", largeKey);
                        }
                    }
                } catch (Exception e) {
                    log.error("❌ Failed to delete large version {}: {}", imageAsset.getLargeUrl(), e.getMessage());
                }
            }

            // 3. Xóa record từ database
            imageAssetService.delete(id);

            log.info("✅ Successfully deleted ImageAsset ID: {} (deleted {} S3 files)", id, deletedCount);

            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));

        } catch (RuntimeException e) {
            log.error("❌ Error deleting ImageAsset ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "404",
                            e.getMessage() != null ? e.getMessage() : "Image asset not found"));
        } catch (Exception e) {
            log.error("❌ Unexpected error deleting ImageAsset ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500",
                            "Error deleting image asset: " + e.getMessage()));
        }
    }

    /**
     * Extract S3 key from URL
     * Ví dụ: "https://bucket.s3.region.amazonaws.com/images/uuid.jpg" ->
     * "images/uuid.jpg"
     */
    private String extractS3KeyFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        // Tìm phần sau domain
        int index = url.indexOf(".amazonaws.com/");
        if (index > 0) {
            return url.substring(index + ".amazonaws.com/".length());
        }
        // Nếu dùng custom base URL
        int lastSlash = url.lastIndexOf("/");
        if (lastSlash > 0) {
            return url.substring(lastSlash + 1);
        }
        return url;
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<CommonResponse<java.util.Map<String, Object>>> bulkDelete(
            @RequestBody java.util.List<Long> ids) {
        try {
            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400",
                                "Danh sách ID không được để trống"));
            }

            log.info("🗑️ Bulk deleting {} ImageAssets", ids.size());

            int successCount = 0;
            int failedCount = 0;
            java.util.List<String> failedIds = new java.util.ArrayList<>();
            java.util.List<String> successIds = new java.util.ArrayList<>();

            for (Long id : ids) {
                try {
                    // 1. Lấy thông tin ImageAsset trước khi xóa
                    ImageAssetResponse imageAsset = imageAssetService.getById(id);

                    // 2. Xóa files từ S3
                    int deletedFilesCount = 0;

                    // Xóa original/medium file
                    if (imageAsset.getS3Key() != null && !imageAsset.getS3Key().isBlank()) {
                        try {
                            boolean deleted = s3StorageService.deleteFile(imageAsset.getS3Key());
                            if (deleted) {
                                deletedFilesCount++;
                            }
                        } catch (Exception e) {
                            log.warn("⚠️ Failed to delete S3 file {}: {}", imageAsset.getS3Key(), e.getMessage());
                        }
                    }

                    // Xóa thumbnail file
                    if (imageAsset.getThumbnailUrl() != null && !imageAsset.getThumbnailUrl().isBlank()) {
                        try {
                            String thumbnailKey = s3StorageService.extractS3KeyFromUrl(imageAsset.getThumbnailUrl());
                            if (thumbnailKey != null) {
                                boolean deleted = s3StorageService.deleteFile(thumbnailKey);
                                if (deleted) {
                                    deletedFilesCount++;
                                }
                            }
                        } catch (Exception e) {
                            log.warn("⚠️ Failed to delete thumbnail {}: {}", imageAsset.getThumbnailUrl(),
                                    e.getMessage());
                        }
                    }

                    // Xóa large file
                    if (imageAsset.getLargeUrl() != null && !imageAsset.getLargeUrl().isBlank()) {
                        try {
                            String largeKey = s3StorageService.extractS3KeyFromUrl(imageAsset.getLargeUrl());
                            if (largeKey != null) {
                                boolean deleted = s3StorageService.deleteFile(largeKey);
                                if (deleted) {
                                    deletedFilesCount++;
                                }
                            }
                        } catch (Exception e) {
                            log.warn("⚠️ Failed to delete large version {}: {}", imageAsset.getLargeUrl(),
                                    e.getMessage());
                        }
                    }

                    // 3. Xóa record từ database
                    imageAssetService.delete(id);

                    successCount++;
                    successIds.add(id.toString());
                    log.info("✅ Successfully deleted ImageAsset ID: {} (deleted {} S3 files)", id, deletedFilesCount);

                } catch (RuntimeException e) {
                    failedCount++;
                    failedIds.add(id.toString());
                    log.error("❌ Failed to delete ImageAsset ID {}: {}", id, e.getMessage());
                } catch (Exception e) {
                    failedCount++;
                    failedIds.add(id.toString());
                    log.error("❌ Unexpected error deleting ImageAsset ID {}: {}", id, e.getMessage());
                }
            }

            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("total", ids.size());
            result.put("successCount", successCount);
            result.put("failedCount", failedCount);
            result.put("successIds", successIds);
            result.put("failedIds", failedIds);

            log.info("Bulk delete completed: {} success, {} failed", successCount, failedCount);

            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), result));

        } catch (Exception e) {
            log.error(" Error in bulk delete: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500",
                            "Error in bulk delete: " + e.getMessage()));
        }
    }

    /**
     * Cleanup các checksum orphan (không có ImageAsset tương ứng)
     * Endpoint này dùng để xử lý các checksum còn sót lại sau khi xóa ImageAsset
     * trước khi có code tự động cleanup
     * 
     * @return Số lượng checksum đã xóa
     */
    @PostMapping("/cleanup-orphan-checksums")
    public ResponseEntity<CommonResponse<java.util.Map<String, Object>>> cleanupOrphanChecksums() {
        try {
            log.info("🧹 Starting orphan checksum cleanup...");

            int deletedCount = imageAssetService.cleanupOrphanChecksums();

            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("deletedCount", deletedCount);
            result.put("message", deletedCount > 0
                    ? String.format(
                            "Đã xóa %d checksum orphan. Bây giờ bạn có thể upload lại các file đã bị duplicate.",
                            deletedCount)
                    : "Không có checksum orphan nào cần xóa.");

            log.info(" Cleanup completed: {} orphan checksums deleted", deletedCount);

            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), result));

        } catch (Exception e) {
            log.error("❌ Error in cleanup orphan checksums: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500",
                            "Error cleaning up orphan checksums: " + e.getMessage()));
        }
    }
}

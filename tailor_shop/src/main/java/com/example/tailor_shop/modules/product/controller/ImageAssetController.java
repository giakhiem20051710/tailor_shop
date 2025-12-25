package com.example.tailor_shop.modules.product.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.storage.ImageProcessingService;
import com.example.tailor_shop.config.storage.S3StorageService;
import com.example.tailor_shop.modules.product.dto.ImageAssetRequest;
import com.example.tailor_shop.modules.product.dto.ImageAssetResponse;
import com.example.tailor_shop.modules.product.service.ImageAssetService;
import com.example.tailor_shop.modules.product.service.ImageClassificationService;
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
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/image-assets")
@RequiredArgsConstructor
@Slf4j
public class ImageAssetController {

    private final ImageAssetService imageAssetService;
    private final S3StorageService s3StorageService;
    private final ImageClassificationService classificationService;
    private final ImageProcessingService imageProcessingService;

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
                                new java.io.ByteArrayInputStream(imageData)
                            );
                            if (image != null) {
                                Optional<ImageProcessingService.BoundingBox> detectedBox = 
                                    imageProcessingService.detectContentBounds(image);
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
                    
                    log.info("✅ Image processed: size={}KB, targetSize={}x{} (Retina: {}x{})",
                            imageData.length / 1024, targetWidth, targetHeight,
                            targetWidth * 2, targetHeight * 2);
                } catch (IOException e) {
                    log.warn("⚠️ Failed to process image, using original: {}", e.getMessage());
                    // Fallback: sử dụng ảnh gốc nếu xử lý thất bại
                }
            }

            // 2. Upload file đã xử lý lên S3
            // Tạm thời dùng prefix "images" - sau này có thể dựa vào classification để chọn prefix
            String s3Url = s3StorageService.uploadImage("images", imageData, fileName, contentType);
            log.info("✅ Uploaded to S3: {}", s3Url);

            // 2. Tự động phân loại dựa trên tên file và mô tả
            // Nếu không có description, dùng tên file làm description
            String descriptionToUse = description != null && !description.trim().isEmpty() 
                    ? description 
                    : fileName != null ? fileName.replaceAll("[._-]", " ") : "";
            
            ImageClassificationService.ImageClassificationResult classification = 
                    classificationService.classify(descriptionToUse, fileName);
            
            log.info("🔍 Classification result: category={}, type={}, gender={}, tags={}",
                    classification.getCategory(), classification.getType(), 
                    classification.getGender(), classification.getTags());

            // 3. Tạo ImageAsset với metadata đã phân loại
            ImageAssetRequest request = ImageAssetRequest.builder()
                    .s3Key(extractS3KeyFromUrl(s3Url))
                    .url(s3Url)
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

    /**
     * Extract S3 key from URL
     * Ví dụ: "https://bucket.s3.region.amazonaws.com/images/uuid.jpg" -> "images/uuid.jpg"
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
}


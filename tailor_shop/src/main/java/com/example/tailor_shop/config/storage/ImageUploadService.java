package com.example.tailor_shop.config.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Optional;

/**
 * Service tổng hợp để download ảnh từ web và upload lên S3
 * Tích hợp ImageProcessingService để xử lý ảnh chất lượng cao
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageUploadService {

    private final ImageDownloadService imageDownloadService;
    private final S3StorageService s3StorageService;
    private final ImageProcessingService imageProcessingService;

    @Value("${image-processing.enabled:true}")
    private boolean imageProcessingEnabled;

    @Value("${image-processing.target-width:800}")
    private int targetWidth;

    @Value("${image-processing.target-height:1200}")
    private int targetHeight;

    @Value("${image-processing.smart-crop:true}")
    private boolean smartCropEnabled;

    @Value("${image-processing.convert-to-webp:false}")
    private boolean convertToWebp;

    /**
     * Download ảnh từ URL và upload lên S3 với xử lý chất lượng cao
     * @param imageUrl URL của ảnh trên web
     * @param prefix Thư mục trên S3 (ví dụ: "templates", "fabrics", "styles")
     * @param fileName Tên file (ví dụ: "shirt.jpg")
     * @return URL của ảnh trên S3
     */
    public String downloadAndUpload(String imageUrl, String prefix, String fileName) {
        try {
            log.info("Downloading and uploading image: {} to S3 prefix: {}", imageUrl, prefix);
            
            // Download ảnh từ web
            byte[] imageData = imageDownloadService.downloadImage(imageUrl);
            
            // Xử lý ảnh chất lượng cao (nếu enabled)
            if (imageProcessingEnabled) {
                imageData = processImage(imageData);
            }
            
            // Xác định content type từ URL hoặc format đã xử lý
            String contentType = determineContentType(imageUrl, convertToWebp);
            
            // Upload lên S3
            String s3Url = s3StorageService.uploadImage(prefix, imageData, fileName, contentType);
            
            log.info("Successfully uploaded processed image to S3: {} (size: {}KB)", 
                    s3Url, imageData.length / 1024);
            return s3Url;
        } catch (IOException e) {
            log.error("Failed to download image from: {}", imageUrl, e);
            throw new RuntimeException("Failed to download image: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to upload image to S3", e);
            throw new RuntimeException("Failed to upload image to S3: " + e.getMessage(), e);
        }
    }

    /**
     * Xử lý ảnh với Smart Cropping và Resize 2x Retina
     */
    private byte[] processImage(byte[] originalData) throws IOException {
        Optional<ImageProcessingService.BoundingBox> boundingBox = Optional.empty();

        // Smart Cropping: Tự động phát hiện và cắt bỏ khoảng trống
        if (smartCropEnabled) {
            try {
                java.awt.image.BufferedImage image = javax.imageio.ImageIO.read(
                    new java.io.ByteArrayInputStream(originalData)
                );
                if (image != null) {
                    Optional<ImageProcessingService.BoundingBox> detectedBox = 
                        imageProcessingService.detectContentBounds(image);
                    if (detectedBox.isPresent()) {
                        boundingBox = detectedBox;
                        log.info("Detected content bounds: {}x{} at ({}, {})",
                                detectedBox.get().width, detectedBox.get().height,
                                detectedBox.get().x, detectedBox.get().y);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to detect content bounds, using original image: {}", e.getMessage());
            }
        }

        // Xử lý ảnh với tất cả các tính năng tối ưu
        return imageProcessingService.processImage(
                originalData,
                targetWidth,
                targetHeight,
                boundingBox,
                convertToWebp
        );
    }

    /**
     * Xác định content type từ URL hoặc format đã xử lý
     */
    private String determineContentType(String url, boolean isWebp) {
        if (isWebp) {
            return "image/webp";
        }
        
        String lowerUrl = url.toLowerCase();
        if (lowerUrl.contains(".jpg") || lowerUrl.contains(".jpeg")) {
            return "image/jpeg";
        } else if (lowerUrl.contains(".png")) {
            return "image/png";
        } else if (lowerUrl.contains(".webp")) {
            return "image/webp";
        } else if (lowerUrl.contains(".gif")) {
            return "image/gif";
        }
        return "image/jpeg"; // Default
    }
}


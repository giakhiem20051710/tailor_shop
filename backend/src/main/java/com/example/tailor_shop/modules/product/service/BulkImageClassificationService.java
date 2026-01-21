package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.dto.ImageAssetRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service để phân tích và phân loại hàng loạt ảnh dựa trên mô tả
 * Dùng cho việc import 1000+ ảnh từ user
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BulkImageClassificationService {

    private final ImageClassificationService classificationService;

    /**
     * Phân tích và phân loại một danh sách ảnh dựa trên mô tả
     * 
     * @param imageDescriptions Map<fileName, description>
     * @return Map<fileName, ImageClassificationResult>
     */
    public Map<String, ImageClassificationService.ImageClassificationResult> classifyBatch(
            Map<String, String> imageDescriptions) {
        
        Map<String, ImageClassificationService.ImageClassificationResult> results = new HashMap<>();
        
        for (Map.Entry<String, String> entry : imageDescriptions.entrySet()) {
            String fileName = entry.getKey();
            String description = entry.getValue();
            
            ImageClassificationService.ImageClassificationResult result = 
                    classificationService.classify(description, fileName);
            
            results.put(fileName, result);
            
            log.info("Phân loại ảnh: {} -> category={}, type={}, gender={}, tags={}",
                    fileName, result.getCategory(), result.getType(), 
                    result.getGender(), result.getTags());
        }
        
        return results;
    }

    /**
     * Tạo danh sách ImageAssetRequest từ kết quả phân loại
     */
    public List<ImageAssetRequest> createImageAssetRequests(
            Map<String, ImageClassificationService.ImageClassificationResult> classifications,
            Map<String, String> s3Keys, // fileName -> s3Key
            Map<String, String> urls) { // fileName -> url
        
        List<ImageAssetRequest> requests = new ArrayList<>();
        
        for (Map.Entry<String, ImageClassificationService.ImageClassificationResult> entry : classifications.entrySet()) {
            String fileName = entry.getKey();
            ImageClassificationService.ImageClassificationResult classification = entry.getValue();
            
            ImageAssetRequest request = ImageAssetRequest.builder()
                    .s3Key(s3Keys.getOrDefault(fileName, generateS3Key(fileName, classification)))
                    .url(urls.getOrDefault(fileName, null))
                    .category(classification.getCategory())
                    .type(classification.getType())
                    .gender(classification.getGender())
                    .tags(classification.getTags())
                    .build();
            
            requests.add(request);
        }
        
        return requests;
    }

    /**
     * Tự động generate S3 key dựa trên classification
     */
    private String generateS3Key(String fileName, ImageClassificationService.ImageClassificationResult classification) {
        String category = classification.getCategory();
        String type = classification.getType();
        String gender = classification.getGender();
        
        // Format: {category}/{type}/{gender}/{fileName}
        return String.format("%s/%s/%s/%s", category, type, gender, fileName);
    }

    /**
     * Phân tích và tạo summary report
     */
    public ClassificationSummary generateSummary(
            Map<String, ImageClassificationService.ImageClassificationResult> classifications) {
        
        ClassificationSummary summary = new ClassificationSummary();
        
        // Đếm theo category
        Map<String, Long> categoryCount = new HashMap<>();
        Map<String, Long> typeCount = new HashMap<>();
        Map<String, Long> genderCount = new HashMap<>();
        
        for (ImageClassificationService.ImageClassificationResult result : classifications.values()) {
            categoryCount.merge(result.getCategory(), 1L, Long::sum);
            typeCount.merge(result.getType(), 1L, Long::sum);
            genderCount.merge(result.getGender(), 1L, Long::sum);
        }
        
        summary.setTotalImages(classifications.size());
        summary.setCategoryCount(categoryCount);
        summary.setTypeCount(typeCount);
        summary.setGenderCount(genderCount);
        
        return summary;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ClassificationSummary {
        private int totalImages;
        private Map<String, Long> categoryCount;
        private Map<String, Long> typeCount;
        private Map<String, Long> genderCount;
    }
}


package com.example.tailor_shop.scripts;

import com.example.tailor_shop.modules.product.service.ImageClassificationService;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Script để phân tích và phân loại các ảnh dựa trên mô tả
 * 
 * Cách chạy:
 * 1. Thêm mô tả ảnh vào danh sách IMAGE_DESCRIPTIONS
 * 2. Chạy main method
 * 3. Xem kết quả phân loại
 */
@Slf4j
public class ImageClassificationScript {

    private static final ImageClassificationService classificationService = new ImageClassificationService();

    // Danh sách mô tả ảnh từ user (dựa trên các ảnh đã gửi)
    private static final Map<String, String> IMAGE_DESCRIPTIONS = new LinkedHashMap<>();

    static {
        // Templates - Áo sơ mi, Blouse
        IMAGE_DESCRIPTIONS.put("ao-so-mi-nam-1.jpg", "Áo sơ mi nam màu trắng");
        IMAGE_DESCRIPTIONS.put("blouse-nu-1.jpg", "Blouse nữ màu trắng có cổ");
        
        // Templates - Quần
        IMAGE_DESCRIPTIONS.put("quan-tay-nam-1.jpg", "Quần tây nam màu đen");
        IMAGE_DESCRIPTIONS.put("quan-jean-nu-1.jpg", "Quần jean nữ màu xanh");
        IMAGE_DESCRIPTIONS.put("quan-short-nu-1.jpg", "Quần short nữ màu be");
        
        // Templates - Vest, Blazer, Jacket
        IMAGE_DESCRIPTIONS.put("vest-nam-1.jpg", "Vest nam màu xanh navy");
        IMAGE_DESCRIPTIONS.put("blazer-nu-1.jpg", "Blazer nữ màu đen");
        IMAGE_DESCRIPTIONS.put("jacket-nu-1.jpg", "Áo khoác nữ màu be");
        
        // Templates - Váy, Đầm
        IMAGE_DESCRIPTIONS.put("vay-dam-nu-1.jpg", "Đầm nữ màu hồng");
        IMAGE_DESCRIPTIONS.put("vay-nu-1.jpg", "Váy nữ màu đen");
        IMAGE_DESCRIPTIONS.put("gown-nu-1.jpg", "Đầm dạ hội nữ màu trắng");
        
        // Templates - Áo dài truyền thống
        IMAGE_DESCRIPTIONS.put("ao-dai-nu-1.jpg", "Áo dài nữ màu đỏ");
        IMAGE_DESCRIPTIONS.put("ao-dai-nam-1.jpg", "Áo dài nam màu xanh");
        
        // Templates - Jumpsuit, Pantsuit
        IMAGE_DESCRIPTIONS.put("jumpsuit-nu-1.jpg", "Jumpsuit nữ màu đen");
        IMAGE_DESCRIPTIONS.put("pantsuit-nu-1.jpg", "Pantsuit nữ màu xám");
        
        // Templates - Traditional (Kebaya, Batik)
        IMAGE_DESCRIPTIONS.put("kebaya-nu-1.jpg", "Kebaya nữ truyền thống Indonesia");
        IMAGE_DESCRIPTIONS.put("batik-nu-1.jpg", "Áo batik nữ màu nâu");
        
        // Fabrics - Tweed
        IMAGE_DESCRIPTIONS.put("tweed-fabric-1.jpg", "Vải tweed màu be");
        IMAGE_DESCRIPTIONS.put("tweed-fabric-2.jpg", "Vải tweed màu xám");
        
        // Fabrics - Lace
        IMAGE_DESCRIPTIONS.put("lace-fabric-1.jpg", "Vải lace màu trắng");
        IMAGE_DESCRIPTIONS.put("lace-fabric-2.jpg", "Vải lace màu kem");
        
        // Fabrics - Satin/Silk
        IMAGE_DESCRIPTIONS.put("satin-fabric-1.jpg", "Vải satin màu hồng");
        IMAGE_DESCRIPTIONS.put("silk-fabric-1.jpg", "Vải lụa màu vàng");
        
        // Fabrics - Denim
        IMAGE_DESCRIPTIONS.put("denim-fabric-1.jpg", "Vải denim màu xanh");
        
        // Fabrics - Batik
        IMAGE_DESCRIPTIONS.put("batik-fabric-1.jpg", "Vải batik truyền thống");
        
        // Styles - Gothic
        IMAGE_DESCRIPTIONS.put("gothic-style-1.jpg", "Phong cách gothic màu đen");
        IMAGE_DESCRIPTIONS.put("gothic-style-2.jpg", "Phong cách gothic với lace");
        
        // Styles - Vintage
        IMAGE_DESCRIPTIONS.put("vintage-style-1.jpg", "Phong cách vintage");
        IMAGE_DESCRIPTIONS.put("vintage-style-2.jpg", "Phong cách retro");
        
        // Styles - Modern
        IMAGE_DESCRIPTIONS.put("modern-style-1.jpg", "Phong cách hiện đại");
        
        // Styles - Streetwear
        IMAGE_DESCRIPTIONS.put("streetwear-style-1.jpg", "Phong cách streetwear");
        
        // Styles - Formal
        IMAGE_DESCRIPTIONS.put("formal-style-1.jpg", "Phong cách formal");
    }

    public static void main(String[] args) {
        log.info("=== Bắt đầu phân loại ảnh ===");
        log.info("Tổng số ảnh: {}", IMAGE_DESCRIPTIONS.size());
        
        Map<String, ImageClassificationService.ImageClassificationResult> results = new LinkedHashMap<>();
        Map<String, Long> categoryCount = new HashMap<>();
        Map<String, Long> typeCount = new HashMap<>();
        Map<String, Long> genderCount = new HashMap<>();
        
        for (Map.Entry<String, String> entry : IMAGE_DESCRIPTIONS.entrySet()) {
            String fileName = entry.getKey();
            String description = entry.getValue();
            
            ImageClassificationService.ImageClassificationResult result = 
                    classificationService.classify(description, fileName);
            
            results.put(fileName, result);
            
            // Đếm
            categoryCount.merge(result.getCategory(), 1L, Long::sum);
            typeCount.merge(result.getType(), 1L, Long::sum);
            genderCount.merge(result.getGender(), 1L, Long::sum);
            
            // Log từng ảnh
            log.info("\nẢnh: {}\n  Mô tả: {}\n  Category: {}\n  Type: {}\n  Gender: {}\n  Tags: {}",
                    fileName, description, result.getCategory(), result.getType(), 
                    result.getGender(), result.getTags());
        }
        
        // Summary
        log.info("\n=== TỔNG KẾT ===");
        log.info("Tổng số ảnh: {}", IMAGE_DESCRIPTIONS.size());
        log.info("\nPhân loại theo Category:");
        categoryCount.forEach((category, count) -> 
                log.info("  {}: {} ảnh", category, count));
        
        log.info("\nPhân loại theo Type:");
        typeCount.forEach((type, count) -> 
                log.info("  {}: {} ảnh", type, count));
        
        log.info("\nPhân loại theo Gender:");
        genderCount.forEach((gender, count) -> 
                log.info("  {}: {} ảnh", gender, count));
        
        // Generate S3 keys
        log.info("\n=== S3 KEYS ĐỀ XUẤT ===");
        for (Map.Entry<String, ImageClassificationService.ImageClassificationResult> entry : results.entrySet()) {
            String fileName = entry.getKey();
            ImageClassificationService.ImageClassificationResult result = entry.getValue();
            String s3Key = String.format("%s/%s/%s/%s", 
                    result.getCategory(), result.getType(), result.getGender(), fileName);
            log.info("{} -> {}", fileName, s3Key);
        }
    }
}


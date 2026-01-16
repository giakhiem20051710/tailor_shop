package com.example.tailor_shop.config;

import com.example.tailor_shop.config.storage.ImageUploadService;
import com.example.tailor_shop.modules.fabric.domain.FabricCategory;
import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import com.example.tailor_shop.modules.fabric.domain.FabricPattern;
import com.example.tailor_shop.modules.fabric.repository.FabricRepository;
import com.example.tailor_shop.modules.product.domain.ProductTemplateEntity;
import com.example.tailor_shop.modules.product.domain.StyleEntity;
import com.example.tailor_shop.modules.product.repository.ProductTemplateRepository;
import com.example.tailor_shop.modules.product.repository.StyleRepository;
import com.github.javafaker.Faker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Product Data Seeder - Tạo dữ liệu mẫu cho hệ thống Mix & Match
 * Chạy tự động khi ứng dụng khởi động
 */
@Slf4j
@Component
public class ProductDataSeeder implements CommandLineRunner {

    private final FabricRepository fabricRepository;
    private final StyleRepository styleRepository;
    private final ProductTemplateRepository productTemplateRepository;
    private final Faker faker = new Faker(new Locale("vi"));

    // Optional - chỉ có khi S3 được cấu hình
    @Autowired(required = false)
    private ImageUploadService imageUploadService;

    public ProductDataSeeder(FabricRepository fabricRepository,
            StyleRepository styleRepository,
            ProductTemplateRepository productTemplateRepository) {
        this.fabricRepository = fabricRepository;
        this.styleRepository = styleRepository;
        this.productTemplateRepository = productTemplateRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("🌱 Starting Product Data Seeding...");

        // Kiểm tra và seed từng loại dữ liệu riêng biệt
        long fabricCount = fabricRepository.count();
        long styleCount = styleRepository.count();
        long templateCount = productTemplateRepository.count();

        // Kiểm tra templates active
        long activeTemplateCount = productTemplateRepository
                .findByIsDeletedFalseAndIsActiveTrueOrderByDisplayOrderAsc().size();

        log.info("📊 Database status - Fabrics: {}, Styles: {}, Templates (total): {}, Templates (active): {}",
                fabricCount, styleCount, templateCount, activeTemplateCount);

        // Nếu đã có đủ dữ liệu active, không cần seed
        if (fabricCount > 0 && styleCount > 0 && activeTemplateCount > 0) {
            log.info("  Database already has all data. Skipping seeding.");
            return;
        }

        // Chỉ seed những gì còn thiếu
        if (fabricCount == 0) {
            seedFabrics();
        } else {
            log.info("⏭  Fabrics already exist. Skipping.");
        }

        if (styleCount == 0) {
            seedStyles();
        } else {
            log.info("  Styles already exist. Skipping.");
        }

        if (activeTemplateCount == 0) {
            seedProductTemplates();
        } else {
            log.info("  Templates already exist. Skipping.");
        }

        log.info(" Product Data Seeding completed!");
    }

    /**
     * Seed Fabrics - Tạo 50-100 loại vải mẫu
     */
    private void seedFabrics() {
        log.info(" Seeding Fabrics...");

        List<String> fabricNames = Arrays.asList(
                "Super 110s Italian Wool", "Super 120s Wool", "Super 150s Wool",
                "Linen Premium", "Cotton Oxford", "Cotton Poplin",
                "Silk Twill", "Cashmere Blend", "Tweed Herringbone",
                "Worsted Wool", "Flannel", "Seersucker",
                "Chambray", "Denim", "Corduroy",
                "Velvet", "Satin", "Chiffon",
                "Taffeta", "Brocade", "Jacquard");

        List<String> colors = Arrays.asList(
                "Navy Blue", "Charcoal Gray", "Black", "Midnight Blue",
                "Royal Blue", "Burgundy", "Forest Green", "Brown",
                "Beige", "Cream", "White", "Ivory",
                "Olive", "Tan", "Steel Gray");

        int fabricCount = 0;
        for (int i = 0; i < 50; i++) {
            String fabricName = fabricNames.get(i % fabricNames.size());
            String color = colors.get(i % colors.size());
            String code = "FAB-" + String.format("%04d", i + 1);

            FabricEntity fabric = FabricEntity.builder()
                    .code(code)
                    .name(fabricName + " - " + color)
                    .slug(generateSlug(fabricName + " " + color))
                    .description(faker.lorem().sentence(10))
                    .category(getRandomCategory())
                    .material(fabricName.contains("Wool") ? "Wool"
                            : fabricName.contains("Cotton") ? "Cotton"
                                    : fabricName.contains("Linen") ? "Linen" : "Mixed")
                    .color(color)
                    .pattern(getRandomPattern())
                    .width(BigDecimal.valueOf(140 + faker.number().numberBetween(0, 20))) // 140-160cm
                    .weight(BigDecimal.valueOf(200 + faker.number().numberBetween(0, 100))) // 200-300gsm
                    .pricePerMeter(BigDecimal.valueOf(200000 + faker.number().numberBetween(0, 800000))) // 200k-1M
                                                                                                         // VND/m
                    .image(getFabricImageAndUpload(color, fabricName, i)) // Upload ảnh thật lên S3
                    .origin(faker.options().option("Italy", "UK", "Japan", "Vietnam", "China"))
                    .careInstructions("Dry clean only. Iron on low heat.")
                    .isAvailable(true)
                    .isFeatured(i < 10) // 10 vải đầu tiên là featured
                    .displayOrder(i)
                    .viewCount(faker.number().numberBetween(0, 1000))
                    .isDeleted(false)
                    .build();

            fabricRepository.save(fabric);
            fabricCount++;
        }

        log.info(" Created {} fabrics", fabricCount);
    }

    /**
     * Seed Styles - Tạo các kiểu dáng (cổ áo, tay áo, túi...)
     */
    private void seedStyles() {
        log.info("🎨 Seeding Styles...");

        // Kiểu cổ áo (Shirt Collars)
        List<String> shirtCollars = Arrays.asList(
                "Cổ đức (Spread Collar)", "Cổ tàu (Point Collar)", "Cổ button-down",
                "Cổ mandarin", "Cổ band", "Cổ wing");

        // Kiểu tay áo (Sleeves)
        List<String> sleeves = Arrays.asList(
                "Tay dài", "Tay ngắn", "Tay 3/4",
                "Tay raglan", "Tay kimono");

        // Kiểu túi (Pockets)
        List<String> pockets = Arrays.asList(
                "Túi ngực trái", "Túi ngực đôi", "Túi không nắp",
                "Túi có nắp", "Túi chéo");

        // Kiểu cạp quần (Waistbands)
        List<String> waistbands = Arrays.asList(
                "Cạp thường", "Cạp cao", "Cạp thấp",
                "Cạp có dây", "Cạp elastic");

        int styleCount = 0;

        // Tạo kiểu cổ áo
        for (String collar : shirtCollars) {
            StyleEntity style = StyleEntity.builder()
                    .name(collar)
                    .category("shirt_collar")
                    .description("Kiểu cổ áo sơ mi: " + collar)
                    .image(getStyleImageAndUpload("shirt-collar", collar, styleCount))
                    .price(BigDecimal.ZERO) // Style không tính phí thêm
                    .isDeleted(false)
                    .build();
            styleRepository.save(style);
            styleCount++;
        }

        // Tạo kiểu tay áo
        for (String sleeve : sleeves) {
            StyleEntity style = StyleEntity.builder()
                    .name(sleeve)
                    .category("sleeve")
                    .description("Kiểu tay áo: " + sleeve)
                    .image(getStyleImageAndUpload("sleeve", sleeve, styleCount))
                    .price(BigDecimal.ZERO)
                    .isDeleted(false)
                    .build();
            styleRepository.save(style);
            styleCount++;
        }

        // Tạo kiểu túi
        for (String pocket : pockets) {
            StyleEntity style = StyleEntity.builder()
                    .name(pocket)
                    .category("pocket")
                    .description("Kiểu túi: " + pocket)
                    .image(getStyleImageAndUpload("pocket", pocket, styleCount))
                    .price(BigDecimal.ZERO)
                    .isDeleted(false)
                    .build();
            styleRepository.save(style);
            styleCount++;
        }

        // Tạo kiểu cạp quần
        for (String waistband : waistbands) {
            StyleEntity style = StyleEntity.builder()
                    .name(waistband)
                    .category("waistband")
                    .description("Kiểu cạp quần: " + waistband)
                    .image(getStyleImageAndUpload("waistband", waistband, styleCount))
                    .price(BigDecimal.ZERO)
                    .isDeleted(false)
                    .build();
            styleRepository.save(style);
            styleCount++;
        }

        log.info(" Created {} styles", styleCount);
    }

    /**
     * Seed Product Templates - Tạo các mẫu cơ bản
     */
    private void seedProductTemplates() {
        log.info(" Seeding Product Templates...");

        List<String[]> templates = Arrays.asList(
                new String[] { "Áo sơ mi", "shirt", "Áo sơ mi nam cao cấp, form fit" },
                new String[] { "Quần tây", "pants", "Quần tây nam công sở, form chuẩn" },
                new String[] { "Vest", "vest", "Áo vest nam 2 lớp, sang trọng" },
                new String[] { "Áo khoác", "jacket", "Áo khoác nam dáng dài" },
                new String[] { "Combo vest", "suit", "Bộ vest nam 3 món (áo vest + quần + áo sơ mi)" },
                new String[] { "Quần short", "shorts", "Quần short nam thể thao" },
                new String[] { "Áo dài", "ao_dai", "Áo dài truyền thống Việt Nam" });

        int templateCount = 0;
        for (int i = 0; i < templates.size(); i++) {
            String[] template = templates.get(i);
            ProductTemplateEntity productTemplate = ProductTemplateEntity.builder()
                    .name(template[0])
                    .slug(generateSlug(template[0]))
                    .category(template[1])
                    .description(template[2])
                    .baseImage(getTemplateImageAndUpload(template[1], template[0], templateCount))
                    .isActive(true)
                    .displayOrder(i)
                    .isDeleted(false)
                    .build();

            productTemplateRepository.save(productTemplate);
            templateCount++;
        }

        log.info(" Created {} product templates", templateCount);
    }

    // Helper methods
    private String generateSlug(String text) {
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }

    private FabricCategory getRandomCategory() {
        FabricCategory[] categories = FabricCategory.values();
        return categories[faker.number().numberBetween(0, categories.length)];
    }

    private FabricPattern getRandomPattern() {
        FabricPattern[] patterns = FabricPattern.values();
        return patterns[faker.number().numberBetween(0, patterns.length)];
    }

    /**
     * Lấy ảnh từ Unsplash với Photo ID cố định (Đẹp và ổn định nhất)
     * Format:
     * https://images.unsplash.com/photo-{id}?w={width}&h={height}&fit=crop&q=80
     */
    private String getTemplateImageAndUpload(String category, String name, int index) {
        // Unsplash Photo IDs cố định - Chất lượng cao, không thay đổi ngẫu nhiên
        // Format: https://images.unsplash.com/photo-{id}?w=800&h=1000&fit=crop&q=80
        String[] imageUrls = {
                // Áo sơ mi - Shirt (Photo ID: 1594938291221)
                "https://images.unsplash.com/photo-1594938291221-94f18e6456f9?w=800&h=1000&fit=crop&q=80&auto=format",
                // Quần tây - Pants (Photo ID: 1473966968600)
                "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1000&fit=crop&q=80&auto=format",
                // Vest (Photo ID: 1507003211169)
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&q=80&auto=format",
                // Áo khoác - Jacket (Photo ID: 1551028719)
                "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop&q=80&auto=format",
                // Combo vest - Suit (Photo ID: 1507003211169)
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&q=80&auto=format",
                // Quần short - Shorts (Photo ID: 1506629905607)
                "https://images.unsplash.com/photo-1506629905607-0c0c0c0c0c0?w=800&h=1000&fit=crop&q=80&auto=format",
                // Áo dài - Traditional dress (Photo ID: 1578662996442)
                "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop&q=80&auto=format"
        };

        String unsplashUrl = imageUrls[index % imageUrls.length];

        // Tạm thời dùng Unsplash URL trực tiếp với Photo ID cố định
        boolean uploadToS3 = false;

        if (uploadToS3) {
            try {
                String fileName = generateSlug(name) + "-" + index + ".jpg";
                String s3Url = imageUploadService.downloadAndUpload(unsplashUrl, "templates", fileName);
                log.info("✅ Uploaded template image to S3: {} -> {}", name, s3Url);
                return s3Url;
            } catch (Exception e) {
                log.warn("⚠️ Failed to upload template image for {}: {}. Using Unsplash URL directly.", name,
                        e.getMessage());
            }
        }

        log.info("📸 Using Unsplash Photo ID URL for template: {}", name);
        return unsplashUrl;
    }

    /**
     * Lấy ảnh từ Unsplash với Photo ID cố định cho Fabric
     */
    private String getFabricImageAndUpload(String color, String fabricName, int index) {
        // Unsplash Photo IDs cố định cho fabric textures - Chất lượng cao
        String[] fabricImageUrls = {
                // Fabric texture 1 (Photo ID: 1586790170083)
                "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=600&fit=crop&q=80&auto=format",
                // Fabric texture 2 (Photo ID: 1558618666)
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=80&auto=format",
                // Fabric texture 3 (Photo ID: 1586075010923)
                "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&h=600&fit=crop&q=80&auto=format",
                // Fabric texture 4 (Photo ID: 1558618666)
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=80&auto=format",
                // Fabric texture 5 (Photo ID: 1586790170083)
                "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=600&fit=crop&q=80&auto=format"
        };

        String unsplashUrl = fabricImageUrls[index % fabricImageUrls.length];

        boolean uploadToS3 = false;

        if (uploadToS3) {
            try {
                String fileName = generateSlug(fabricName + "-" + color) + "-" + index + ".jpg";
                return imageUploadService.downloadAndUpload(unsplashUrl, "fabrics", fileName);
            } catch (Exception e) {
                log.warn("Failed to upload fabric image: {}", e.getMessage());
            }
        }

        return unsplashUrl;
    }

    /**
     * Lấy ảnh từ Unsplash với Photo ID cố định cho Style
     */
    private String getStyleImageAndUpload(String category, String styleName, int index) {
        // Unsplash Photo IDs cố định cho style details - Chất lượng cao
        String[] styleImageUrls = {
                // Fashion detail 1 (Photo ID: 1594938291221)
                "https://images.unsplash.com/photo-1594938291221-94f18e6456f9?w=400&h=400&fit=crop&q=80&auto=format",
                // Fashion detail 2 (Photo ID: 1506629905607)
                "https://images.unsplash.com/photo-1506629905607-0c0c0c0c0c0?w=400&h=400&fit=crop&q=80&auto=format",
                // Fashion detail 3 (Photo ID: 1551028719)
                "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop&q=80&auto=format"
        };

        String unsplashUrl = styleImageUrls[index % styleImageUrls.length];

        boolean uploadToS3 = false;

        if (uploadToS3) {
            try {
                String fileName = generateSlug(category + "-" + styleName) + "-" + index + ".jpg";
                return imageUploadService.downloadAndUpload(unsplashUrl, "styles", fileName);
            } catch (Exception e) {
                log.warn("Failed to upload style image: {}", e.getMessage());
            }
        }

        return unsplashUrl;
    }
}

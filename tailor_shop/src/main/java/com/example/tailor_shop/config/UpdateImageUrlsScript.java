package com.example.tailor_shop.config;

import com.example.tailor_shop.modules.product.domain.ProductTemplateEntity;
import com.example.tailor_shop.modules.product.repository.ProductTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * Script để cập nhật URLs ảnh trong database
 * Chạy một lần để fix URLs bị 404
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UpdateImageUrlsScript implements CommandLineRunner {

    private final ProductTemplateRepository productTemplateRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Chỉ chạy nếu có argument "update-images"
        if (args.length == 0 || !args[0].equals("update-images")) {
            return;
        }

        log.info("🔄 Starting image URLs update...");

        List<ProductTemplateEntity> templates = productTemplateRepository
                .findByIsDeletedFalseAndIsActiveTrueOrderByDisplayOrderAsc();

        if (templates.isEmpty()) {
            log.info("⏭️  No templates found. Skipping update.");
            return;
        }

        // URLs mới từ Unsplash Source API (luôn hoạt động)
        String[] newImageUrls = {
            "https://source.unsplash.com/800x1000/?shirt,formal,men",
            "https://source.unsplash.com/800x1000/?pants,trousers,formal",
            "https://source.unsplash.com/800x1000/?vest,waistcoat,formal",
            "https://source.unsplash.com/800x1000/?jacket,coat,men",
            "https://source.unsplash.com/800x1000/?suit,formal,men",
            "https://source.unsplash.com/800x1000/?shorts,casual,men",
            "https://source.unsplash.com/800x1000/?traditional,dress,vietnam"
        };

        int updated = 0;
        for (int i = 0; i < templates.size() && i < newImageUrls.length; i++) {
            ProductTemplateEntity template = templates.get(i);
            String oldUrl = template.getBaseImage();
            String newUrl = newImageUrls[i];
            
            template.setBaseImage(newUrl);
            productTemplateRepository.save(template);
            
            log.info("✅ Updated {}: {} -> {}", template.getName(), oldUrl, newUrl);
            updated++;
        }

        log.info("✅ Updated {} template image URLs", updated);
    }
}


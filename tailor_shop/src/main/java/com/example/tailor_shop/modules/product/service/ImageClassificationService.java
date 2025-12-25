package com.example.tailor_shop.modules.product.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service để phân loại ảnh tự động dựa trên mô tả hoặc tên file
 */
@Service
@Slf4j
public class ImageClassificationService {

    // Mapping từ keywords → category (đã được sử dụng trong detectCategory method)

    // Mapping từ keywords → type (loại quần áo)
    private static final Map<String, String> TYPE_KEYWORDS = new HashMap<>();

    static {
        // Áo
        TYPE_KEYWORDS.put("shirt", "ao_so_mi");
        TYPE_KEYWORDS.put("blouse", "ao_so_mi");
        TYPE_KEYWORDS.put("áo sơ mi", "ao_so_mi");
        TYPE_KEYWORDS.put("áo dài", "ao_dai");
        TYPE_KEYWORDS.put("áo khoác", "ao_khoac");
        TYPE_KEYWORDS.put("jacket", "ao_khoac");
        TYPE_KEYWORDS.put("blazer", "ao_khoac");
        TYPE_KEYWORDS.put("cardigan", "ao_khoac");
        TYPE_KEYWORDS.put("vest", "vest");
        TYPE_KEYWORDS.put("suit", "vest");

        // Quần
        TYPE_KEYWORDS.put("pants", "quan_tay");
        TYPE_KEYWORDS.put("trousers", "quan_tay");
        TYPE_KEYWORDS.put("quần tây", "quan_tay");
        TYPE_KEYWORDS.put("jeans", "quan_jean");
        TYPE_KEYWORDS.put("shorts", "quan_short");

        // Váy/Đầm
        TYPE_KEYWORDS.put("dress", "vay_dam");
        TYPE_KEYWORDS.put("skirt", "vay");
        TYPE_KEYWORDS.put("váy", "vay");
        TYPE_KEYWORDS.put("đầm", "vay_dam");
        TYPE_KEYWORDS.put("gown", "vay_dam");
        TYPE_KEYWORDS.put("mermaid", "vay_dam"); // Mermaid skirt/dress

        // Áo/Bộ
        TYPE_KEYWORDS.put("top", "ao_so_mi");
        TYPE_KEYWORDS.put("corset", "ao_so_mi");
        TYPE_KEYWORDS.put("peplum", "ao_so_mi");
        TYPE_KEYWORDS.put("outfit", "vay_dam"); // Outfit thường là bộ quần áo
        TYPE_KEYWORDS.put("set", "vay_dam"); // Set = bộ quần áo

        // Khác
        TYPE_KEYWORDS.put("jumpsuit", "jumpsuit");
        TYPE_KEYWORDS.put("pantsuit", "vest");
        TYPE_KEYWORDS.put("power suit", "vest");
        TYPE_KEYWORDS.put("kebaya", "ao_truyen_thong");
        TYPE_KEYWORDS.put("batik", "ao_truyen_thong");
        TYPE_KEYWORDS.put("hanbok", "ao_truyen_thong");
    }

    // Mapping từ keywords → gender
    private static final Map<String, String> GENDER_KEYWORDS = Map.of(
            "male", "male",
            "men", "male",
            "nam", "male",
            "female", "female",
            "women", "female",
            "nữ", "female",
            "ladies", "female"
    );

    // Mapping từ keywords → tags
    private static final Map<String, List<String>> TAG_KEYWORDS = new HashMap<>();

    static {
        TAG_KEYWORDS.put("traditional", Arrays.asList("traditional", "vietnamese"));
        TAG_KEYWORDS.put("gothic", Arrays.asList("gothic", "dark", "alternative"));
        TAG_KEYWORDS.put("vintage", Arrays.asList("vintage", "retro", "classic"));
        TAG_KEYWORDS.put("modern", Arrays.asList("modern", "contemporary"));
        TAG_KEYWORDS.put("casual", Arrays.asList("casual", "everyday"));
        TAG_KEYWORDS.put("formal", Arrays.asList("formal", "elegant", "sophisticated"));
        TAG_KEYWORDS.put("streetwear", Arrays.asList("streetwear", "urban", "edgy"));
        TAG_KEYWORDS.put("tweed", Arrays.asList("tweed", "textured", "classic"));
        TAG_KEYWORDS.put("lace", Arrays.asList("lace", "delicate", "feminine"));
        TAG_KEYWORDS.put("satin", Arrays.asList("satin", "silk", "luxury"));
        TAG_KEYWORDS.put("denim", Arrays.asList("denim", "casual", "durable"));
        TAG_KEYWORDS.put("elegant", Arrays.asList("elegant", "sophisticated"));
        TAG_KEYWORDS.put("modest", Arrays.asList("modest", "conservative"));
        TAG_KEYWORDS.put("belted", Arrays.asList("belted", "tailored"));
        TAG_KEYWORDS.put("tiered", Arrays.asList("tiered", "layered"));
        TAG_KEYWORDS.put("floral", Arrays.asList("floral", "patterned"));
        TAG_KEYWORDS.put("embroidered", Arrays.asList("embroidered", "detailed"));
        TAG_KEYWORDS.put("boho", Arrays.asList("boho", "bohemian", "casual"));
        TAG_KEYWORDS.put("summer", Arrays.asList("summer", "lightweight"));
        TAG_KEYWORDS.put("traditional", Arrays.asList("traditional", "cultural"));
        TAG_KEYWORDS.put("thai", Arrays.asList("thai", "traditional", "cultural"));
    }

    /**
     * Phân loại ảnh dựa trên mô tả hoặc tên file
     */
    public ImageClassificationResult classify(String description, String fileName) {
        String lowerDesc = (description != null ? description : "").toLowerCase();
        String lowerFileName = (fileName != null ? fileName : "").toLowerCase();
        String combined = lowerDesc + " " + lowerFileName;

        // Xác định category
        String category = detectCategory(combined);
        
        // Xác định type
        String type = detectType(combined);
        
        // Xác định gender
        String gender = detectGender(combined);
        
        // Xác định tags
        List<String> tags = detectTags(combined);

        return ImageClassificationResult.builder()
                .category(category)
                .type(type)
                .gender(gender)
                .tags(tags)
                .build();
    }

    private String detectCategory(String text) {
        // Mặc định là template nếu không rõ
        if (text.contains("fabric") || text.contains("vải") || text.contains("texture") || text.contains("material")) {
            return "fabric";
        }
        if (text.contains("style") || text.contains("kiểu") || text.contains("design")) {
            return "style";
        }
        return "template"; // Mặc định
    }

    private String detectType(String text) {
        for (Map.Entry<String, String> entry : TYPE_KEYWORDS.entrySet()) {
            if (text.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "unknown"; // Nếu không tìm thấy
    }

    private String detectGender(String text) {
        for (Map.Entry<String, String> entry : GENDER_KEYWORDS.entrySet()) {
            if (text.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "unisex"; // Mặc định
    }

    private List<String> detectTags(String text) {
        List<String> tags = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : TAG_KEYWORDS.entrySet()) {
            if (text.contains(entry.getKey())) {
                tags.addAll(entry.getValue());
            }
        }
        return tags;
    }

    /**
     * Kết quả phân loại
     */
    @lombok.Data
    @lombok.Builder
    public static class ImageClassificationResult {
        private String category; // "template", "fabric", "style"
        private String type; // "ao_dai", "quan_tay", etc.
        private String gender; // "male", "female", "unisex"
        private List<String> tags; // ["traditional", "red", "tet"]
    }
}


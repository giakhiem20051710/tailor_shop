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

    // Mapping từ keywords → type (loại quần áo) - EXPANDED 50+ types
    private static final Map<String, String> TYPE_KEYWORDS = new HashMap<>();

    static {
        // === ÁO (TOPS) ===
        TYPE_KEYWORDS.put("shirt", "ao_so_mi");
        TYPE_KEYWORDS.put("blouse", "ao_so_mi");
        TYPE_KEYWORDS.put("áo sơ mi", "ao_so_mi");
        TYPE_KEYWORDS.put("t-shirt", "ao_thun");
        TYPE_KEYWORDS.put("tshirt", "ao_thun");
        TYPE_KEYWORDS.put("áo thun", "ao_thun");
        TYPE_KEYWORDS.put("polo", "ao_polo");
        TYPE_KEYWORDS.put("áo polo", "ao_polo");
        TYPE_KEYWORDS.put("sweater", "ao_len");
        TYPE_KEYWORDS.put("áo len", "ao_len");
        TYPE_KEYWORDS.put("hoodie", "ao_hoodie");
        TYPE_KEYWORDS.put("áo hoodie", "ao_hoodie");
        TYPE_KEYWORDS.put("crop top", "ao_croptop");
        TYPE_KEYWORDS.put("croptop", "ao_croptop");
        TYPE_KEYWORDS.put("tank top", "ao_ba_lo");
        TYPE_KEYWORDS.put("áo ba lỗ", "ao_ba_lo");
        TYPE_KEYWORDS.put("top", "ao_kiem");
        TYPE_KEYWORDS.put("áo kiểu", "ao_kiem");
        TYPE_KEYWORDS.put("corset", "ao_kiem");
        TYPE_KEYWORDS.put("peplum", "ao_kiem");

        // === ÁO KHOÁC (OUTERWEAR) ===
        TYPE_KEYWORDS.put("jacket", "ao_khoac");
        TYPE_KEYWORDS.put("áo khoác", "ao_khoac");
        TYPE_KEYWORDS.put("blazer", "blazer");
        TYPE_KEYWORDS.put("cardigan", "cardigan");
        TYPE_KEYWORDS.put("vest", "vest");
        TYPE_KEYWORDS.put("suit", "vest");
        TYPE_KEYWORDS.put("coat", "ao_khoac");

        // === QUẦN (BOTTOMS) ===
        TYPE_KEYWORDS.put("pants", "quan_tay");
        TYPE_KEYWORDS.put("trousers", "quan_tay");
        TYPE_KEYWORDS.put("quần tây", "quan_tay");
        TYPE_KEYWORDS.put("jeans", "quan_jean");
        TYPE_KEYWORDS.put("quần jean", "quan_jean");
        TYPE_KEYWORDS.put("shorts", "quan_short");
        TYPE_KEYWORDS.put("quần short", "quan_short");
        TYPE_KEYWORDS.put("wide leg", "quan_ong_rong");
        TYPE_KEYWORDS.put("quần ống rộng", "quan_ong_rong");
        TYPE_KEYWORDS.put("culottes", "quan_culottes");
        TYPE_KEYWORDS.put("jogger", "quan_jogger");
        TYPE_KEYWORDS.put("legging", "quan_legging");
        TYPE_KEYWORDS.put("palazzo", "quan_palazzo");

        // === VÁY (SKIRTS) ===
        TYPE_KEYWORDS.put("skirt", "chan_vay");
        TYPE_KEYWORDS.put("chân váy", "chan_vay");
        TYPE_KEYWORDS.put("a-line skirt", "vay_a");
        TYPE_KEYWORDS.put("váy chữ a", "vay_a");
        TYPE_KEYWORDS.put("pencil skirt", "vay_but_chi");
        TYPE_KEYWORDS.put("váy bút chì", "vay_but_chi");
        TYPE_KEYWORDS.put("flare skirt", "vay_xoe");
        TYPE_KEYWORDS.put("váy xòe", "vay_xoe");
        TYPE_KEYWORDS.put("midi skirt", "vay_midi");
        TYPE_KEYWORDS.put("váy midi", "vay_midi");
        TYPE_KEYWORDS.put("maxi skirt", "vay_maxi");
        TYPE_KEYWORDS.put("váy maxi", "vay_maxi");
        TYPE_KEYWORDS.put("mini skirt", "vay_mini");
        TYPE_KEYWORDS.put("váy mini", "vay_mini");

        // === ĐẦM (DRESSES) ===
        TYPE_KEYWORDS.put("dress", "vay_dam");
        TYPE_KEYWORDS.put("đầm", "vay_dam");
        TYPE_KEYWORDS.put("váy đầm", "vay_dam");
        TYPE_KEYWORDS.put("gown", "dam_da_hoi");
        TYPE_KEYWORDS.put("evening gown", "dam_da_hoi");
        TYPE_KEYWORDS.put("đầm dạ hội", "dam_da_hoi");
        TYPE_KEYWORDS.put("cocktail dress", "dam_cocktail");
        TYPE_KEYWORDS.put("đầm cocktail", "dam_cocktail");
        TYPE_KEYWORDS.put("wedding dress", "dam_cuoi");
        TYPE_KEYWORDS.put("bridal", "dam_cuoi");
        TYPE_KEYWORDS.put("đầm cưới", "dam_cuoi");
        TYPE_KEYWORDS.put("party dress", "dam_du_tiec");
        TYPE_KEYWORDS.put("đầm dự tiệc", "dam_du_tiec");
        TYPE_KEYWORDS.put("office dress", "dam_cong_so");
        TYPE_KEYWORDS.put("đầm công sở", "dam_cong_so");
        TYPE_KEYWORDS.put("bodycon", "dam_bo");
        TYPE_KEYWORDS.put("đầm bó", "dam_bo");
        TYPE_KEYWORDS.put("shift dress", "dam_suong");
        TYPE_KEYWORDS.put("đầm suông", "dam_suong");
        TYPE_KEYWORDS.put("mermaid", "dam_da_hoi");

        // === BỘ ĐỒ (SETS) ===
        TYPE_KEYWORDS.put("jumpsuit", "jumpsuit");
        TYPE_KEYWORDS.put("romper", "romper");
        TYPE_KEYWORDS.put("pantsuit", "pantsuit");
        TYPE_KEYWORDS.put("power suit", "pantsuit");
        TYPE_KEYWORDS.put("bộ vest", "bo_vest");
        TYPE_KEYWORDS.put("set", "jumpsuit");
        TYPE_KEYWORDS.put("outfit", "jumpsuit");
        TYPE_KEYWORDS.put("pajamas", "bo_do_ngu");
        TYPE_KEYWORDS.put("bộ đồ ngủ", "bo_do_ngu");
        TYPE_KEYWORDS.put("activewear", "bo_tap_gym");
        TYPE_KEYWORDS.put("gym set", "bo_tap_gym");
        TYPE_KEYWORDS.put("bộ tập gym", "bo_tap_gym");
        TYPE_KEYWORDS.put("swimwear", "bo_di_bien");
        TYPE_KEYWORDS.put("bikini", "bo_di_bien");
        TYPE_KEYWORDS.put("bộ đi biển", "bo_di_bien");

        // === TRUYỀN THỐNG (TRADITIONAL) ===
        TYPE_KEYWORDS.put("áo dài", "ao_dai");
        TYPE_KEYWORDS.put("ao dai", "ao_dai");
        TYPE_KEYWORDS.put("áo dài cưới", "ao_dai_cuoi");
        TYPE_KEYWORDS.put("áo dài tết", "ao_dai_tet");
        TYPE_KEYWORDS.put("áo tứ thân", "ao_tu_than");
        TYPE_KEYWORDS.put("hanbok", "hanbok");
        TYPE_KEYWORDS.put("kimono", "kimono");
        TYPE_KEYWORDS.put("kebaya", "kebaya");
        TYPE_KEYWORDS.put("sari", "sari");
        TYPE_KEYWORDS.put("cheongsam", "cheongsam");
        TYPE_KEYWORDS.put("sườn xám", "cheongsam");
        TYPE_KEYWORDS.put("batik", "kebaya");
        TYPE_KEYWORDS.put("traditional", "ao_dai");

        // === PHỤ KIỆN (ACCESSORIES) ===
        TYPE_KEYWORDS.put("scarf", "khan_choang");
        TYPE_KEYWORDS.put("khăn choàng", "khan_choang");
        TYPE_KEYWORDS.put("belt", "that_lung");
        TYPE_KEYWORDS.put("thắt lưng", "that_lung");
        TYPE_KEYWORDS.put("hat", "mu_non");
        TYPE_KEYWORDS.put("mũ", "mu_non");
        TYPE_KEYWORDS.put("nón", "mu_non");
    }

    // Mapping từ keywords → gender
    private static final Map<String, String> GENDER_KEYWORDS = Map.of(
            "male", "male",
            "men", "male",
            "nam", "male",
            "female", "female",
            "women", "female",
            "nữ", "female",
            "ladies", "female");

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

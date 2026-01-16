package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.dto.ProductAnalysisResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Service để gọi Google Gemini Vision API phân tích ảnh sản phẩm may đo
 */
@Service
@Slf4j
public class GeminiVisionService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    @Value("${gemini.enabled:true}")
    private boolean enabled;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    public GeminiVisionService() {
        // Configure RestTemplate with timeout
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(60000); // 60 seconds connect timeout
        factory.setReadTimeout(120000); // 120 seconds read timeout (AI cần thời gian xử lý)

        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();

        log.info("✅ GeminiVisionService initialized with 60s connect / 120s read timeout");
    }

    /**
     * Kiểm tra xem Gemini AI có được enable không
     */
    public boolean isEnabled() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }

    /**
     * Phân tích ảnh sản phẩm từ byte array
     * 
     * @param imageData Dữ liệu ảnh dạng byte array
     * @param mimeType  MIME type của ảnh (image/jpeg, image/png, etc.)
     * @return Kết quả phân tích
     */
    public ProductAnalysisResult analyzeImage(byte[] imageData, String mimeType) {
        if (!isEnabled()) {
            log.warn("Gemini AI is disabled or API key not configured");
            return createDefaultResult();
        }

        // Retry logic - thử tối đa 3 lần
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                log.info("🤖 Analyzing image with Gemini AI (model: {}, attempt: {}/{})", model, attempt, maxRetries);

                // Convert image to base64
                String base64Image = Base64.getEncoder().encodeToString(imageData);

                // Build request
                String requestBody = buildRequestBody(base64Image, mimeType);

                // Make API call
                String url = String.format(GEMINI_API_URL, model, apiKey);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

                ResponseEntity<String> response = restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        entity,
                        String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    ProductAnalysisResult result = parseGeminiResponse(response.getBody());

                    // Kiểm tra xem result có hợp lệ không (confidence > 0 = đã parse được)
                    if (result.getConfidence() != null && result.getConfidence() > 0) {
                        return result;
                    } else {
                        log.warn("⚠️ Attempt {}/{}: Got default result, might be parsing issue", attempt, maxRetries);
                        if (attempt < maxRetries) {
                            Thread.sleep(1000); // Wait 1s before retry
                            continue;
                        }
                        return result;
                    }
                } else {
                    log.error("Gemini API returned non-success status: {}", response.getStatusCode());
                    if (attempt < maxRetries) {
                        Thread.sleep(1000);
                        continue;
                    }
                }

            } catch (Exception e) {
                log.error("❌ Attempt {}/{} failed: {}", attempt, maxRetries, e.getMessage());
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(1000); // Wait 1s before retry
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    continue;
                }
            }
        }

        log.error("❌ All {} attempts failed, returning default result", maxRetries);
        return createDefaultResult();
    }

    /**
     * Phân tích ảnh từ URL
     */
    public ProductAnalysisResult analyzeImageFromUrl(String imageUrl) {
        if (!isEnabled()) {
            log.warn("Gemini AI is disabled or API key not configured");
            return createDefaultResult();
        }

        try {
            log.info("🤖 Analyzing image from URL with Gemini AI: {}", imageUrl);

            // Build request with URL
            String requestBody = buildRequestBodyWithUrl(imageUrl);

            // Make API call
            String url = String.format(GEMINI_API_URL, model, apiKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGeminiResponse(response.getBody());
            } else {
                log.error("Gemini API returned non-success status: {}", response.getStatusCode());
                return createDefaultResult();
            }

        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage(), e);
            return createDefaultResult();
        }
    }

    /**
     * Build request body với base64 image
     */
    private String buildRequestBody(String base64Image, String mimeType) throws Exception {
        Map<String, Object> request = new HashMap<>();

        // System instruction
        Map<String, Object> systemInstruction = new HashMap<>();
        systemInstruction.put("parts", List.of(Map.of("text", getSystemPrompt())));
        request.put("systemInstruction", systemInstruction);

        // Contents with image
        Map<String, Object> content = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();

        // Add image part
        Map<String, Object> imagePart = new HashMap<>();
        Map<String, String> inlineData = new HashMap<>();
        inlineData.put("mimeType", mimeType != null ? mimeType : "image/jpeg");
        inlineData.put("data", base64Image);
        imagePart.put("inlineData", inlineData);
        parts.add(imagePart);

        // Add text prompt
        parts.add(Map.of("text", getUserPrompt()));

        content.put("parts", parts);
        request.put("contents", List.of(content));

        // Generation config
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("topK", 32);
        generationConfig.put("topP", 1);
        generationConfig.put("maxOutputTokens", 4096);
        generationConfig.put("responseMimeType", "application/json");
        request.put("generationConfig", generationConfig);

        return objectMapper.writeValueAsString(request);
    }

    /**
     * Build request body với image URL
     */
    private String buildRequestBodyWithUrl(String imageUrl) throws Exception {
        Map<String, Object> request = new HashMap<>();

        // System instruction
        Map<String, Object> systemInstruction = new HashMap<>();
        systemInstruction.put("parts", List.of(Map.of("text", getSystemPrompt())));
        request.put("systemInstruction", systemInstruction);

        // Contents with image URL
        Map<String, Object> content = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();

        // Add image part with URL
        Map<String, Object> imagePart = new HashMap<>();
        Map<String, String> fileData = new HashMap<>();
        fileData.put("mimeType", "image/jpeg");
        fileData.put("fileUri", imageUrl);
        imagePart.put("fileData", fileData);
        parts.add(imagePart);

        // Add text prompt
        parts.add(Map.of("text", getUserPrompt()));

        content.put("parts", parts);
        request.put("contents", List.of(content));

        // Generation config
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("topK", 32);
        generationConfig.put("topP", 1);
        generationConfig.put("maxOutputTokens", 4096);
        generationConfig.put("responseMimeType", "application/json");
        request.put("generationConfig", generationConfig);

        return objectMapper.writeValueAsString(request);
    }

    /**
     * System prompt hướng dẫn AI phân tích
     */
    private String getSystemPrompt() {
        return """
                Bạn là chuyên gia phân tích thời trang và may đo tại Việt Nam.
                Nhiệm vụ: Phân tích ảnh quần áo/trang phục và trích xuất thông tin chi tiết.

                Bạn PHẢI trả về JSON với đúng format được yêu cầu.
                Sử dụng tiếng Việt cho tất cả các giá trị mô tả.
                Nếu không chắc chắn về một thông tin, hãy đưa ra gợi ý hợp lý dựa trên kiểu dáng trang phục.
                """;
    }

    /**
     * User prompt yêu cầu phân tích cụ thể
     */
    private String getUserPrompt() {
        return """
                Phân tích ảnh trang phục này và trả về JSON với các trường sau:

                {
                    "category": "template hoặc fabric hoặc style",
                    "type": "loại trang phục (xem danh sách 150+ types bên dưới)",
                    "gender": "male hoặc female hoặc unisex",
                    "description": "mô tả chi tiết về trang phục bằng tiếng Việt",
                    "occasion": "dịp sử dụng chính: daily, work, party, wedding, formal, casual, date, beach, gym, yoga, travel, tet, photoshoot, graduation, festival, night_out, brunch",
                    "season": "mùa phù hợp: spring, summer, autumn, winter, all_season",
                    "style": "phong cách: elegant, casual, vintage, modern, romantic, minimalist, bohemian, streetwear, gothic, preppy, sporty, sexy, cute, traditional, y2k, old_money, quiet_luxury, coquette, dark_academia, light_academia, coastal_grandmother, cottagecore, grunge, avant_garde",
                    "tailoringTime": "thời gian may dự kiến, ví dụ: 7-14 ngày",
                    "fittingCount": "số lần thử đồ, ví dụ: 1-2 lần",
                    "warranty": "chính sách bảo hành, ví dụ: Chỉnh sửa miễn phí 1 lần",
                    "silhouette": "form dáng, ví dụ: Ôm nhẹ, tôn eo",
                    "lengthInfo": "độ dài, ví dụ: Qua gối / maxi tùy chọn",
                    "materials": ["chất liệu gợi ý 1", "chất liệu 2"],
                    "lining": "thông tin lót trong, ví dụ: Có, chống hằn & thoáng",
                    "colors": ["màu sắc phát hiện trong ảnh"],
                    "accessories": "phụ kiện gợi ý phối hợp",
                    "occasions": ["dịp sử dụng phù hợp"],
                    "customerStyles": ["phong cách khách hàng phù hợp"],
                    "careInstructions": ["hướng dẫn bảo quản"],
                    "tags": ["tag1", "tag2"],
                    "confidence": 0.85
                }

                DANH SÁCH TYPE (150+ loại - chọn 1 giá trị PHÙ HỢP NHẤT):

                === ÁO (TOPS) ===
                ao_so_mi, ao_so_mi_oversize, ao_so_mi_croptop, ao_thun, ao_thun_basic, ao_thun_graphic, ao_polo, ao_len, ao_len_co_lo, ao_hoodie, ao_croptop, ao_kiem, ao_ba_lo, ao_hai_day, ao_tube_top, ao_corset, ao_peplum, ao_wrap, ao_off_shoulder, ao_one_shoulder, ao_babydoll, ao_bodysuit, ao_bra_top

                === ÁO KHOÁC (OUTERWEAR) ===
                ao_khoac, ao_khoac_bomber, ao_khoac_da, ao_khoac_jean, ao_khoac_parka, ao_khoac_trench, ao_khoac_long, ao_khoac_mong, blazer, blazer_oversize, blazer_crop, vest, cardigan, ao_cape, ao_teddy, ao_puffer

                === QUẦN (BOTTOMS) ===
                quan_tay, quan_tay_baggy, quan_tay_ong_dung, quan_jean, quan_jean_skinny, quan_jean_straight, quan_jean_wide_leg, quan_jean_flare, quan_jean_baggy, quan_short, quan_short_jean, quan_ong_rong, quan_culottes, quan_jogger, quan_legging, quan_palazzo, quan_cargo, quan_parachute, quan_ong_vay, quan_yem

                === VÁY (SKIRTS) ===
                chan_vay, vay_a, vay_but_chi, vay_xoe, vay_midi, vay_maxi, vay_mini, vay_xep_li, vay_tennis, vay_wrap, vay_tulip, vay_duoi_ca, vay_jeans, vay_ren, vay_bet

                === ĐẦM (DRESSES) ===
                vay_dam, dam_da_hoi, dam_cocktail, dam_cuoi, dam_phu_dau, dam_du_tiec, dam_cong_so, dam_de_thuong, dam_bo, dam_suong, dam_vintage, dam_maxi, dam_midi, dam_mini, dam_wrap, dam_slip, dam_babydoll, dam_shirt, dam_blazer, dam_cami, dam_tiered, dam_cut_out, dam_knit, dam_hoa, dam_sequin

                === BỘ ĐỒ (SETS) ===
                jumpsuit, jumpsuit_short, romper, pantsuit, bo_vest, bo_do_ngu, bo_tap_gym, bo_tap_yoga, bo_di_bien, bo_co_ord, bo_pijama, bo_blazer_short, ao_lien_quan, overalls

                === TRUYỀN THỐNG (TRADITIONAL) ===
                ao_dai, ao_dai_cuoi, ao_dai_tet, ao_dai_hoc_sinh, ao_dai_cach_tan, ao_tu_than, ao_ba_ba, hanbok, kimono, yukata, kebaya, sari, cheongsam, ao_nhat_binh

                === ĐỒ BƠI (SWIMWEAR) ===
                bikini, bikini_2_manh, bikini_1_manh, bikini_high_waist, monokini, tankini, sarong, cover_up

                === PHỤ KIỆN (ACCESSORIES) ===
                khan_choang, khan_turban, that_lung, mu_non, mu_bucket, mu_beret, gang_tay, ca_vat, no_bung, tui_xach, clutch

                === NỘI Y (LINGERIE) ===
                ao_nguc, ao_bralette, ao_corset_noi_y, do_ngu_sexy, kimono_noi_y

                Lưu ý:
                - category: "template" cho ảnh mẫu trang phục, "fabric" cho ảnh vải, "style" cho ảnh phong cách
                - Chọn type CỤ THỂ nhất từ danh sách trên (ví dụ: chọn "dam_cut_out" thay vì "vay_dam" nếu đầm có chi tiết cut-out)
                - Nếu ảnh là váy/đầm nữ, gender = "female"
                - Nếu ảnh là vest/suit nam, gender = "male"
                - Trả về JSON hợp lệ, không có text thêm
                """;
    }

    /**
     * Parse response từ Gemini API
     */
    private ProductAnalysisResult parseGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            // Navigate to the text content
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).path("content");
                JsonNode parts = content.path("parts");

                if (parts.isArray() && parts.size() > 0) {
                    String jsonText = parts.get(0).path("text").asText();

                    // Clean the JSON text (remove markdown code blocks if present)
                    jsonText = cleanJsonText(jsonText);

                    // Parse the JSON content
                    JsonNode analysisJson = objectMapper.readTree(jsonText);

                    return ProductAnalysisResult.builder()
                            .category(getTextOrDefault(analysisJson, "category", "template"))
                            .type(getTextOrDefault(analysisJson, "type", "unknown"))
                            .gender(getTextOrDefault(analysisJson, "gender", "unisex"))
                            .occasion(getTextOrDefault(analysisJson, "occasion", "daily"))
                            .season(getTextOrDefault(analysisJson, "season", "all_season"))
                            .style(getTextOrDefault(analysisJson, "style", "casual"))
                            .description(getTextOrDefault(analysisJson, "description", ""))
                            .tailoringTime(getTextOrDefault(analysisJson, "tailoringTime", "7-14 ngày"))
                            .fittingCount(getTextOrDefault(analysisJson, "fittingCount", "1-2 lần"))
                            .warranty(getTextOrDefault(analysisJson, "warranty", "Chỉnh sửa miễn phí 1 lần"))
                            .silhouette(getTextOrDefault(analysisJson, "silhouette", ""))
                            .lengthInfo(getTextOrDefault(analysisJson, "lengthInfo", ""))
                            .materials(getListOrDefault(analysisJson, "materials"))
                            .lining(getTextOrDefault(analysisJson, "lining", ""))
                            .colors(getListOrDefault(analysisJson, "colors"))
                            .accessories(getTextOrDefault(analysisJson, "accessories", ""))
                            .occasions(getListOrDefault(analysisJson, "occasions"))
                            .customerStyles(getListOrDefault(analysisJson, "customerStyles"))
                            .careInstructions(getListOrDefault(analysisJson, "careInstructions"))
                            .tags(getListOrDefault(analysisJson, "tags"))
                            .confidence(analysisJson.path("confidence").asDouble(0.8))
                            .build();
                }
            }

            log.warn("Could not parse Gemini response, using defaults");
            return createDefaultResult();

        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage(), e);
            return createDefaultResult();
        }
    }

    /**
     * Clean JSON text from markdown code blocks and attempt to fix truncated JSON
     */
    private String cleanJsonText(String text) {
        if (text == null || text.isBlank())
            return "{}";

        // Remove markdown code blocks
        text = text.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }

        text = text.trim();

        // Attempt to fix truncated JSON
        // Count opening and closing braces/brackets
        int openBraces = 0;
        int openBrackets = 0;
        boolean inString = false;
        char prevChar = 0;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);

            // Handle string content (ignore braces inside strings)
            if (c == '"' && prevChar != '\\') {
                inString = !inString;
            }

            if (!inString) {
                if (c == '{')
                    openBraces++;
                else if (c == '}')
                    openBraces--;
                else if (c == '[')
                    openBrackets++;
                else if (c == ']')
                    openBrackets--;
            }

            prevChar = c;
        }

        // If JSON is truncated, try to close it properly
        if (openBraces > 0 || openBrackets > 0) {
            log.warn("⚠️ Detected truncated JSON, attempting to fix ({} open braces, {} open brackets)",
                    openBraces, openBrackets);

            // Remove any trailing incomplete key-value pair
            // Look for patterns like: "key": " or "key": [
            int lastCompletePos = text.length();
            for (int i = text.length() - 1; i >= 0; i--) {
                char c = text.charAt(i);
                if (c == ',' || c == '{' || c == '[') {
                    // Found a safe point to truncate
                    lastCompletePos = i;
                    if (c == ',') {
                        // Remove the trailing comma
                        lastCompletePos = i;
                    }
                    break;
                }
            }

            // Truncate at safe point
            if (lastCompletePos < text.length()) {
                text = text.substring(0, lastCompletePos);
            }

            // Add missing closing brackets and braces
            StringBuilder fixed = new StringBuilder(text);
            for (int i = 0; i < openBrackets; i++) {
                fixed.append("]");
            }
            for (int i = 0; i < openBraces; i++) {
                fixed.append("}");
            }
            text = fixed.toString();

            log.info("✅ Fixed truncated JSON, new length: {}", text.length());
        }

        return text;
    }

    /**
     * Get text value or default
     */
    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        JsonNode fieldNode = node.path(field);
        if (fieldNode.isMissingNode() || fieldNode.isNull()) {
            return defaultValue;
        }
        return fieldNode.asText(defaultValue);
    }

    /**
     * Get list value or empty list
     */
    private List<String> getListOrDefault(JsonNode node, String field) {
        JsonNode fieldNode = node.path(field);
        if (fieldNode.isArray()) {
            List<String> result = new ArrayList<>();
            for (JsonNode item : fieldNode) {
                result.add(item.asText());
            }
            return result;
        }
        return new ArrayList<>();
    }

    /**
     * Tạo kết quả mặc định khi không thể phân tích
     */
    private ProductAnalysisResult createDefaultResult() {
        return ProductAnalysisResult.builder()
                .category("template")
                .type("unknown")
                .gender("unisex")
                .description("Chưa có mô tả")
                .tailoringTime("7-14 ngày")
                .fittingCount("1-2 lần")
                .warranty("Chỉnh sửa miễn phí 1 lần")
                .silhouette("Ôm nhẹ, tôn eo")
                .lengthInfo("Tùy chọn")
                .materials(List.of("Lụa", "Satin", "Crepe cao cấp"))
                .lining("Có, chống hằn & thoáng")
                .colors(new ArrayList<>())
                .accessories("Có thể phối thêm belt, hoa cài, khăn choàng")
                .occasions(List.of("Cưới hỏi, lễ kỷ niệm, tiệc tối", "Chụp ảnh kỷ niệm, pre-wedding",
                        "Sự kiện cần sự chỉn chu"))
                .customerStyles(List.of("Thích sự nữ tính, mềm mại", "Muốn tôn dáng nhưng thoải mái",
                        "Cần trang phục đẹp ngoài đời & đẹp trên hình"))
                .careInstructions(List.of(
                        "Ưu tiên giặt tay hoặc giặt chế độ nhẹ, nước lạnh",
                        "Không vắt xoắn mạnh, phơi nơi thoáng mát, tránh nắng gắt",
                        "Ủi ở nhiệt độ thấp, dùng khăn lót để bề mặt vải luôn mịn"))
                .tags(new ArrayList<>())
                .confidence(0.0)
                .build();
    }
}

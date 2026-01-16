package com.example.tailor_shop.modules.fabric.service.impl;

import com.example.tailor_shop.modules.fabric.dto.FabricAIAnalysisRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricAIAnalysisResponse;
import com.example.tailor_shop.modules.fabric.service.FabricAIService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

/**
 * Implementation of FabricAIService using Google Gemini Vision API
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FabricAIServiceImpl implements FabricAIService {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}")
    private String geminiApiUrl;

    // Price reference table (VND per meter)
    private static final Map<String, BigDecimal[]> PRICE_REFERENCE = new HashMap<>();
    static {
        PRICE_REFERENCE.put("COTTON",
                new BigDecimal[] { new BigDecimal("80000"), new BigDecimal("300000"), new BigDecimal("150000") });
        PRICE_REFERENCE.put("SILK",
                new BigDecimal[] { new BigDecimal("300000"), new BigDecimal("800000"), new BigDecimal("500000") });
        PRICE_REFERENCE.put("LINEN",
                new BigDecimal[] { new BigDecimal("200000"), new BigDecimal("400000"), new BigDecimal("280000") });
        PRICE_REFERENCE.put("WOOL",
                new BigDecimal[] { new BigDecimal("400000"), new BigDecimal("1000000"), new BigDecimal("600000") });
        PRICE_REFERENCE.put("POLYESTER",
                new BigDecimal[] { new BigDecimal("50000"), new BigDecimal("120000"), new BigDecimal("80000") });
        PRICE_REFERENCE.put("DENIM",
                new BigDecimal[] { new BigDecimal("100000"), new BigDecimal("250000"), new BigDecimal("150000") });
        PRICE_REFERENCE.put("LEATHER",
                new BigDecimal[] { new BigDecimal("500000"), new BigDecimal("1500000"), new BigDecimal("800000") });
        PRICE_REFERENCE.put("SYNTHETIC",
                new BigDecimal[] { new BigDecimal("40000"), new BigDecimal("100000"), new BigDecimal("70000") });
        PRICE_REFERENCE.put("BLEND",
                new BigDecimal[] { new BigDecimal("100000"), new BigDecimal("300000"), new BigDecimal("180000") });
        PRICE_REFERENCE.put("OTHER",
                new BigDecimal[] { new BigDecimal("80000"), new BigDecimal("200000"), new BigDecimal("120000") });
    }

    private static final String AI_PROMPT = """
            Bạn là chuyên gia về vải may mặc Việt Nam. Hãy phân tích ảnh vải này và trả về CHÍNH XÁC JSON sau (không thêm markdown code block):

            {
              "name": "Tên gợi ý cho vải bằng tiếng Việt, mô tả ngắn gọn loại vải và màu sắc",
              "category": "Một trong các giá trị: SILK, COTTON, LINEN, WOOL, POLYESTER, DENIM, LEATHER, SYNTHETIC, BLEND, OTHER",
              "material": "Thành phần chất liệu ước tính (VD: 100%% Cotton, 70%% Silk 30%% Polyester)",
              "color": "Màu sắc chính bằng tiếng Việt",
              "pattern": "Một trong các giá trị: SOLID, STRIPED, CHECKED, FLORAL, GEOMETRIC, ABSTRACT, POLKA_DOT, ANIMAL_PRINT, TEXTURED, OTHER",
              "description": "Mô tả chi tiết về vải trong 2-3 câu tiếng Việt",
              "estimatedPriceVND": 250000,
              "priceReasoning": "Lý do ước tính giá bằng tiếng Việt",
              "stretch": "Một trong các giá trị: NONE, LOW, MEDIUM, HIGH",
              "season": "Một trong các giá trị: SPRING, SUMMER, AUTUMN, WINTER, ALL_SEASON",
              "careInstructions": "Hướng dẫn bảo quản cơ bản bằng tiếng Việt",
              "width": 150,
              "weight": 200,
              "origin": "Xuất xứ ước tính (VD: Việt Nam, Trung Quốc, Ý, Nhật Bản)"
            }

            Lưu ý:
            - estimatedPriceVND là giá VND/mét, ước tính dựa trên chất lượng vải trong ảnh
            - width là khổ vải cm (thường 90-150cm), weight là định lượng g/m² (thường 100-400)
            - Chỉ trả về JSON thuần túy, không có markdown hay giải thích thêm
            """;

    @Override
    public FabricAIAnalysisResponse analyzeImage(FabricAIAnalysisRequest request) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return FabricAIAnalysisResponse.builder()
                    .success(false)
                    .errorMessage(
                            "Gemini API Key chưa được cấu hình. Vui lòng thêm gemini.api.key vào application.properties")
                    .build();
        }

        try {
            // Extract base64 data and mime type
            String imageData = request.getImageData();
            String mimeType = request.getMimeType() != null ? request.getMimeType() : "image/jpeg";

            if (imageData.startsWith("data:")) {
                // Parse data URL format: data:image/jpeg;base64,/9j/4AAQ...
                int semicolonIndex = imageData.indexOf(';');
                int commaIndex = imageData.indexOf(',');
                if (semicolonIndex > 5 && commaIndex > semicolonIndex) {
                    mimeType = imageData.substring(5, semicolonIndex);
                    imageData = imageData.substring(commaIndex + 1);
                }
            }

            // Build Gemini API request
            Map<String, Object> requestBody = buildGeminiRequest(imageData, mimeType);

            // Call Gemini API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String url = geminiApiUrl + "?key=" + geminiApiKey;

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("Gemini API returned error status: {}", response.getStatusCode());
                return FabricAIAnalysisResponse.builder()
                        .success(false)
                        .errorMessage("Lỗi từ Gemini API: " + response.getStatusCode())
                        .build();
            }

            // Parse response
            return parseGeminiResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error analyzing fabric image with AI", e);
            return FabricAIAnalysisResponse.builder()
                    .success(false)
                    .errorMessage("Lỗi phân tích ảnh: " + e.getMessage())
                    .build();
        }
    }

    private Map<String, Object> buildGeminiRequest(String imageData, String mimeType) {
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mime_type", mimeType);
        inlineData.put("data", imageData);

        Map<String, Object> imagePart = new HashMap<>();
        imagePart.put("inline_data", inlineData);

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", AI_PROMPT);

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(textPart);
        parts.add(imagePart);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", parts);

        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(content);

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("topK", 32);
        generationConfig.put("topP", 1);
        generationConfig.put("maxOutputTokens", 1024);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contents);
        requestBody.put("generationConfig", generationConfig);

        return requestBody;
    }

    private FabricAIAnalysisResponse parseGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");

            if (!candidates.isArray() || candidates.isEmpty()) {
                return FabricAIAnalysisResponse.builder()
                        .success(false)
                        .errorMessage("Không nhận được phản hồi từ AI")
                        .build();
            }

            String textContent = candidates.get(0).path("content").path("parts").get(0).path("text").asText();

            // Remove markdown code blocks if present
            textContent = textContent.trim();
            if (textContent.startsWith("```json")) {
                textContent = textContent.replaceFirst("^```json\\s*", "").replaceFirst("\\s*```$", "");
            } else if (textContent.startsWith("```")) {
                textContent = textContent.replaceFirst("^```\\s*", "").replaceFirst("\\s*```$", "");
            }

            // Parse JSON
            JsonNode result = objectMapper.readTree(textContent);

            // Build response
            FabricAIAnalysisResponse response = FabricAIAnalysisResponse.builder()
                    .success(true)
                    .name(result.path("name").asText(null))
                    .category(validateEnum(result.path("category").asText("OTHER"),
                            Arrays.asList("SILK", "COTTON", "LINEN", "WOOL", "POLYESTER", "DENIM", "LEATHER",
                                    "SYNTHETIC", "BLEND", "OTHER")))
                    .material(result.path("material").asText(null))
                    .color(result.path("color").asText(null))
                    .pattern(validateEnum(result.path("pattern").asText("OTHER"),
                            Arrays.asList("SOLID", "STRIPED", "CHECKED", "FLORAL", "GEOMETRIC", "ABSTRACT", "POLKA_DOT",
                                    "ANIMAL_PRINT", "TEXTURED", "OTHER")))
                    .description(result.path("description").asText(null))
                    .estimatedPriceVND(
                            parsePrice(result.path("estimatedPriceVND"), result.path("category").asText("OTHER")))
                    .priceReasoning(result.path("priceReasoning").asText(null))
                    .stretch(validateEnum(result.path("stretch").asText("NONE"),
                            Arrays.asList("NONE", "LOW", "MEDIUM", "HIGH")))
                    .season(validateEnum(result.path("season").asText("ALL_SEASON"),
                            Arrays.asList("SPRING", "SUMMER", "AUTUMN", "WINTER", "ALL_SEASON")))
                    .careInstructions(result.path("careInstructions").asText(null))
                    .width(new BigDecimal(result.path("width").asText("150")))
                    .weight(new BigDecimal(result.path("weight").asText("200")))
                    .origin(result.path("origin").asText(null))
                    .build();

            return response;

        } catch (Exception e) {
            log.error("Error parsing Gemini response", e);
            return FabricAIAnalysisResponse.builder()
                    .success(false)
                    .errorMessage("Lỗi phân tích phản hồi AI: " + e.getMessage())
                    .build();
        }
    }

    private String validateEnum(String value, List<String> validValues) {
        if (value != null && validValues.contains(value.toUpperCase())) {
            return value.toUpperCase();
        }
        return validValues.get(validValues.size() - 1); // Return last value as default (usually OTHER)
    }

    private BigDecimal parsePrice(JsonNode priceNode, String category) {
        try {
            if (priceNode != null && !priceNode.isMissingNode()) {
                BigDecimal price = new BigDecimal(priceNode.asText());
                BigDecimal[] ref = PRICE_REFERENCE.getOrDefault(category.toUpperCase(), PRICE_REFERENCE.get("OTHER"));

                // Validate price is in reasonable range
                if (price.compareTo(ref[0].multiply(new BigDecimal("0.5"))) >= 0
                        && price.compareTo(ref[1].multiply(new BigDecimal("2"))) <= 0) {
                    return price;
                }
            }
        } catch (Exception ignored) {
        }

        // Return average price for category
        BigDecimal[] ref = PRICE_REFERENCE.getOrDefault(category.toUpperCase(), PRICE_REFERENCE.get("OTHER"));
        return ref[2]; // avg price
    }
}

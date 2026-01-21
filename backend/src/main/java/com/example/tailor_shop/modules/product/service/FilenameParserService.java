package com.example.tailor_shop.modules.product.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service để parse tên file và extract thông tin sản phẩm
 * Tier 1: Fast, cheap parsing từ filename
 */
@Service
@Slf4j
public class FilenameParserService {

    private static final Map<String, String> CATEGORY_KEYWORDS = new HashMap<>();
    private static final Pattern PRICE_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*([k|tr|vnd]|000)", Pattern.CASE_INSENSITIVE);
    private static final Pattern NUMBER_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)");

    static {
        // Category mapping từ keywords
        CATEGORY_KEYWORDS.put("ao-dai", "ao-dai");
        CATEGORY_KEYWORDS.put("áo dài", "ao-dai");
        CATEGORY_KEYWORDS.put("aodai", "ao-dai");
        
        CATEGORY_KEYWORDS.put("vest", "vest");
        CATEGORY_KEYWORDS.put("suit", "vest");
        CATEGORY_KEYWORDS.put("áo vest", "vest");
        
        CATEGORY_KEYWORDS.put("dam", "dam");
        CATEGORY_KEYWORDS.put("đầm", "dam");
        CATEGORY_KEYWORDS.put("dress", "dam");
        CATEGORY_KEYWORDS.put("vay", "dam");
        CATEGORY_KEYWORDS.put("váy", "dam");
        
        CATEGORY_KEYWORDS.put("quan", "quan-tay");
        CATEGORY_KEYWORDS.put("quần", "quan-tay");
        CATEGORY_KEYWORDS.put("pants", "quan-tay");
        CATEGORY_KEYWORDS.put("trousers", "quan-tay");
    }

    /**
     * Parse filename để extract thông tin sản phẩm
     */
    public ProductInfo parseFilename(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return ProductInfo.builder().build();
        }

        // Remove extension
        String nameWithoutExt = fileName.replaceAll("\\.[^.]+$", "");
        
        // Extract price
        BigDecimal price = extractPrice(nameWithoutExt);
        
        // Extract category
        String category = extractCategory(nameWithoutExt);
        
        // Extract product name (remove price and normalize)
        String productName = extractProductName(nameWithoutExt, price);
        
        // Generate description
        String description = generateDescription(productName, category);
        
        log.debug("Parsed filename: {} -> name: {}, price: {}, category: {}", 
            fileName, productName, price, category);
        
        return ProductInfo.builder()
                .name(productName)
                .price(price)
                .category(category)
                .description(description)
                .build();
    }

    private BigDecimal extractPrice(String text) {
        // Try to find price pattern: 500k, 2tr, 3.5tr, 500000
        Matcher matcher = PRICE_PATTERN.matcher(text);
        if (matcher.find()) {
            String numberStr = matcher.group(1);
            String unit = matcher.group(2) != null ? matcher.group(2).toLowerCase() : "";
            
            try {
                double number = Double.parseDouble(numberStr);
                
                if (unit.contains("tr") || unit.contains("triệu")) {
                    return BigDecimal.valueOf(number * 1_000_000);
                } else if (unit.contains("k") || unit.contains("nghìn")) {
                    return BigDecimal.valueOf(number * 1_000);
                } else if (unit.contains("vnd") || unit.contains("đ")) {
                    return BigDecimal.valueOf(number);
                } else if (unit.contains("000")) {
                    // Already in thousands
                    return BigDecimal.valueOf(number);
                }
            } catch (NumberFormatException e) {
                log.warn("Failed to parse price from: {}", text);
            }
        }
        
        // Try to find large numbers (likely prices)
        Matcher numberMatcher = NUMBER_PATTERN.matcher(text);
        BigDecimal maxNumber = null;
        while (numberMatcher.find()) {
            try {
                double num = Double.parseDouble(numberMatcher.group(1));
                if (num >= 100000) { // Likely a price if >= 100k
                    BigDecimal bd = BigDecimal.valueOf(num);
                    if (maxNumber == null || bd.compareTo(maxNumber) > 0) {
                        maxNumber = bd;
                    }
                }
            } catch (NumberFormatException ignored) {
            }
        }
        
        return maxNumber;
    }

    private String extractCategory(String text) {
        String lowerText = text.toLowerCase();
        
        for (Map.Entry<String, String> entry : CATEGORY_KEYWORDS.entrySet()) {
            if (lowerText.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        return "other"; // Default category
    }

    private String extractProductName(String text, BigDecimal price) {
        // Remove price patterns
        String name = text;
        
        // Remove price: 500k, 2tr, etc.
        name = PRICE_PATTERN.matcher(name).replaceAll("");
        
        // Remove large numbers that might be prices
        if (price != null) {
            String priceStr = price.toString();
            name = name.replace(priceStr, "");
        }
        
        // Replace dashes and underscores with spaces
        name = name.replaceAll("[_-]", " ");
        
        // Remove extra spaces
        name = name.replaceAll("\\s+", " ").trim();
        
        // Capitalize first letter of each word
        if (name.isEmpty()) {
            return "Sản phẩm";
        }
        
        // Simple capitalization (can be improved with Vietnamese word mapping)
        String[] words = name.split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                if (result.length() > 0) {
                    result.append(" ");
                }
                result.append(word.substring(0, 1).toUpperCase())
                      .append(word.substring(1).toLowerCase());
            }
        }
        
        return result.toString();
    }

    private String generateDescription(String name, String category) {
        if (name == null || name.isEmpty()) {
            return "Sản phẩm may đo chất lượng cao";
        }
        
        String categoryDesc = switch (category) {
            case "ao-dai" -> "Áo dài truyền thống";
            case "vest" -> "Vest công sở";
            case "dam" -> "Đầm dạ hội";
            case "quan-tay" -> "Quần tây";
            default -> "Sản phẩm may đo";
        };
        
        return String.format("%s %s chất lượng cao, may đo theo yêu cầu", name, categoryDesc);
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProductInfo {
        private String name;
        private BigDecimal price;
        private String category;
        private String description;
    }
}


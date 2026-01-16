package com.example.tailor_shop.modules.fabric.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for AI fabric image analysis
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricAIAnalysisResponse {

    /**
     * Suggested fabric name in Vietnamese
     */
    private String name;

    /**
     * Fabric category enum value: SILK, COTTON, LINEN, WOOL, POLYESTER, DENIM,
     * LEATHER, SYNTHETIC, BLEND, OTHER
     */
    private String category;

    /**
     * Material composition estimate (e.g., "100% Cotton", "70% Silk 30% Polyester")
     */
    private String material;

    /**
     * Primary color in Vietnamese
     */
    private String color;

    /**
     * Pattern enum value: SOLID, STRIPED, CHECKED, FLORAL, GEOMETRIC, ABSTRACT,
     * POLKA_DOT, ANIMAL_PRINT, TEXTURED, OTHER
     */
    private String pattern;

    /**
     * Detailed description in Vietnamese (2-3 sentences)
     */
    private String description;

    /**
     * Estimated price per meter in VND
     */
    private BigDecimal estimatedPriceVND;

    /**
     * Reasoning for the price estimate
     */
    private String priceReasoning;

    /**
     * Stretch level: NONE, LOW, MEDIUM, HIGH
     */
    private String stretch;

    /**
     * Suitable season: SPRING, SUMMER, AUTUMN, WINTER, ALL_SEASON
     */
    private String season;

    /**
     * Basic care instructions in Vietnamese
     */
    private String careInstructions;

    /**
     * Estimated fabric width in cm (usually 90-150cm)
     */
    private BigDecimal width;

    /**
     * Estimated fabric weight in g/m² (usually 100-400)
     */
    private BigDecimal weight;

    /**
     * Estimated origin country
     */
    private String origin;

    /**
     * Whether the analysis was successful
     */
    private boolean success;

    /**
     * Error message if analysis failed
     */
    private String errorMessage;
}

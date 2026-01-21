package com.example.tailor_shop.modules.promotion.dto;

import com.example.tailor_shop.modules.promotion.domain.PromotionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRequest {

    @NotBlank(message = "Promotion code is required")
    @Size(max = 50, message = "Code must not exceed 50 characters")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Code must contain only uppercase letters, numbers, hyphens, and underscores")
    private String code;

    @NotBlank(message = "Promotion name is required")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    private String name;

    private String description;

    @NotNull(message = "Promotion type is required")
    private PromotionType type;

    // Discount configuration
    private BigDecimal discountPercentage;
    private BigDecimal discountAmount;
    private BigDecimal maxDiscountAmount;

    // Conditions
    private BigDecimal minOrderValue;
    private List<Long> applicableProductIds;
    private List<String> applicableCategoryIds;
    private String applicableUserGroup;

    // Validity
    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    // Usage limits
    private Integer maxUsageTotal;
    private Integer maxUsagePerUser;
    @Builder.Default
    private Boolean isPublic = true;
    @Builder.Default
    private Boolean isSingleUse = false;

    // Buy X Get Y
    private Integer buyQuantity;
    private Integer getQuantity;
    private Long getProductId;

    // Metadata
    private String image;
    private String bannerText;
    @Builder.Default
    private Integer priority = 0;
}


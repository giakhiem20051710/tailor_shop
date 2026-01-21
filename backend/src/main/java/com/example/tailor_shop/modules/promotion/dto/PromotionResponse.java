package com.example.tailor_shop.modules.promotion.dto;

import com.example.tailor_shop.modules.promotion.domain.PromotionStatus;
import com.example.tailor_shop.modules.promotion.domain.PromotionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private PromotionType type;
    private PromotionStatus status;

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
    private LocalDate startDate;
    private LocalDate endDate;

    // Usage limits
    private Integer maxUsageTotal;
    private Integer maxUsagePerUser;
    private Boolean isPublic;
    private Boolean isSingleUse;

    // Buy X Get Y
    private Integer buyQuantity;
    private Integer getQuantity;
    private Long getProductId;

    // Metadata
    private String image;
    private String bannerText;
    private Integer priority;

    // Statistics
    private Long totalUsageCount;
    private Boolean isEligible; // For current user
    private Boolean isUsed; // For current user

    // Timestamps
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


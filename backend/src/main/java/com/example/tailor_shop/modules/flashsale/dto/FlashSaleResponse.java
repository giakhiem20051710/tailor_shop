package com.example.tailor_shop.modules.flashsale.dto;

import com.example.tailor_shop.modules.flashsale.domain.FlashSaleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Flash Sale Response DTO - Trả về thông tin Flash Sale
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleResponse {

    private Long id;

    // Fabric info
    private Long fabricId;
    private String fabricName;
    private String fabricImage;
    private String fabricCode;

    // Sale info
    private String name;
    private String description;

    // Pricing
    private BigDecimal originalPrice;
    private BigDecimal flashPrice;
    private Integer discountPercent;
    private BigDecimal savedAmount; // Per unit

    // Quantity
    private BigDecimal totalQuantity;
    private BigDecimal soldQuantity;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private Integer soldPercentage;

    // Limits
    private BigDecimal maxPerUser;
    private BigDecimal minPurchase;

    // Timing
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Long remainingSeconds; // Until start or end

    // Status
    private FlashSaleStatus status;
    private Boolean isActive;
    private Boolean isSoldOut;
    private Boolean hasStarted;
    private Boolean hasEnded;

    // Display
    private Integer priority;
    private Boolean isFeatured;
    private String bannerImage;

    // Stats
    private Integer totalOrders;

    // User-specific (when authenticated)
    private BigDecimal userPurchased;
    private BigDecimal userRemainingLimit;

    // Metadata
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

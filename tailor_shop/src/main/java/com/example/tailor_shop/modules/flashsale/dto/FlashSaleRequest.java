package com.example.tailor_shop.modules.flashsale.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Flash Sale Request DTO - Tạo/Cập nhật Flash Sale
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleRequest {

    @NotNull(message = "Fabric ID is required")
    private Long fabricId;

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Flash price is required")
    @DecimalMin(value = "0.01", message = "Flash price must be greater than 0")
    private BigDecimal flashPrice;

    @NotNull(message = "Total quantity is required")
    @DecimalMin(value = "0.5", message = "Total quantity must be at least 0.5")
    private BigDecimal totalQuantity;

    @DecimalMin(value = "0.5", message = "Max per user must be at least 0.5")
    private BigDecimal maxPerUser;

    @DecimalMin(value = "0.1", message = "Min purchase must be at least 0.1")
    private BigDecimal minPurchase;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private OffsetDateTime startTime;

    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    private OffsetDateTime endTime;

    private Integer priority;

    private Boolean isFeatured;

    private String bannerImage;
}

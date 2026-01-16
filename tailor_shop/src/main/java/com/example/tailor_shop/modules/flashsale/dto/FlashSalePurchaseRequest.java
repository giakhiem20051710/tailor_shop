package com.example.tailor_shop.modules.flashsale.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Flash Sale Purchase Request DTO - Yêu cầu mua hàng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSalePurchaseRequest {

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.1", message = "Quantity must be at least 0.1 meters")
    @DecimalMax(value = "1000", message = "Quantity must not exceed 1000 meters")
    private BigDecimal quantity;

    // Optional shipping info (can be added later)
    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;

    // Optional note
    private String customerNote;
}

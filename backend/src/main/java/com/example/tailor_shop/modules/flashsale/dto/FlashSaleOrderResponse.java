package com.example.tailor_shop.modules.flashsale.dto;

import com.example.tailor_shop.modules.flashsale.domain.FlashSaleOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Flash Sale Order Response DTO - Trả về thông tin đơn hàng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleOrderResponse {

    private Long id;
    private String orderCode;

    // Flash Sale info
    private Long flashSaleId;
    private String flashSaleName;
    private String fabricName;
    private String fabricImage;

    // Order details
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal originalPrice;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal savedAmount;
    private Integer discountPercent;

    // Status
    private FlashSaleOrderStatus status;

    // Payment
    private String paymentMethod;
    private OffsetDateTime paymentDeadline;
    private Long paymentRemainingSeconds;
    private OffsetDateTime paidAt;

    // Shipping
    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;

    // Notes
    private String customerNote;

    // Metadata
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

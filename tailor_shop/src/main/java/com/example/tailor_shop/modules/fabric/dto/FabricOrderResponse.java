package com.example.tailor_shop.modules.fabric.dto;

import com.example.tailor_shop.modules.fabric.domain.FabricOrderStatus;
import com.example.tailor_shop.modules.fabric.domain.PaymentMethod;
import com.example.tailor_shop.modules.fabric.domain.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * DTO cho fabric order response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricOrderResponse {

    private Long id;
    private String code;
    private Long customerId;
    private String customerName;
    private FabricOrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal shippingFee;
    private BigDecimal total;
    private Long promotionId;
    private String promotionCode;
    private String shippingAddress;
    private String shippingPhone;
    private String shippingName;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private Long invoiceId;
    private String invoiceCode;
    private String notes;
    private List<FabricOrderItemResponse> items;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Optional fields for promo preview / single-item calculation
    private Long fabricId;
    private String fabricName;
    private String fabricCode;
    private BigDecimal quantity;
    private BigDecimal pricePerMeter;
    private String promoCode;
    private String promotionName;
    private BigDecimal finalAmount;
    private String message;
    private OffsetDateTime appliedAt;
}

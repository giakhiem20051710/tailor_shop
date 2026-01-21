package com.example.tailor_shop.modules.flashsale.dto;

import com.example.tailor_shop.modules.flashsale.domain.FlashSaleOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Flash Sale Purchase Result DTO - Kết quả mua hàng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSalePurchaseResult {

    private Boolean success;
    private String message;
    private String errorCode; // For specific error handling

    // Order info (if success)
    private Long orderId;
    private String orderCode;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private BigDecimal savedAmount;
    private FlashSaleOrderStatus orderStatus;

    // Payment info
    private OffsetDateTime paymentDeadline;
    private Long paymentRemainingSeconds;

    // Reservation info
    private Long reservationId;
    private OffsetDateTime reservationExpiresAt;

    // Stock info
    private BigDecimal remainingStock;
    private Integer soldPercentage;

    // User limit info
    private BigDecimal userTotalPurchased;
    private BigDecimal userRemainingLimit;

    // ==================== STATIC FACTORY METHODS ====================

    public static FlashSalePurchaseResult success(
            Long orderId,
            String orderCode,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal totalAmount,
            OffsetDateTime paymentDeadline,
            String message) {
        return FlashSalePurchaseResult.builder()
                .success(true)
                .message(message)
                .orderId(orderId)
                .orderCode(orderCode)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .totalAmount(totalAmount)
                .orderStatus(FlashSaleOrderStatus.PENDING)
                .paymentDeadline(paymentDeadline)
                .paymentRemainingSeconds(
                        java.time.Duration.between(OffsetDateTime.now(), paymentDeadline).getSeconds())
                .build();
    }

    public static FlashSalePurchaseResult fail(String message, String errorCode) {
        return FlashSalePurchaseResult.builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }

    public static FlashSalePurchaseResult outOfStock(BigDecimal availableQuantity) {
        return FlashSalePurchaseResult.builder()
                .success(false)
                .message(availableQuantity.compareTo(BigDecimal.ZERO) > 0
                        ? "Chỉ còn " + availableQuantity + " mét. Vui lòng giảm số lượng!"
                        : "Rất tiếc, sản phẩm đã hết!")
                .errorCode("OUT_OF_STOCK")
                .remainingStock(availableQuantity)
                .build();
    }

    public static FlashSalePurchaseResult limitExceeded(BigDecimal userRemaining, BigDecimal maxPerUser) {
        return FlashSalePurchaseResult.builder()
                .success(false)
                .message("Bạn chỉ có thể mua thêm " + userRemaining + " mét (giới hạn " + maxPerUser + " mét/người)")
                .errorCode("LIMIT_EXCEEDED")
                .userRemainingLimit(userRemaining)
                .build();
    }

    public static FlashSalePurchaseResult notActive(String message) {
        return FlashSalePurchaseResult.builder()
                .success(false)
                .message(message)
                .errorCode("NOT_ACTIVE")
                .build();
    }
}

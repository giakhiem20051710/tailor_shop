package com.example.tailor_shop.modules.fabric.dto;

import com.example.tailor_shop.modules.billing.domain.PaymentProvider;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho thanh toán đơn hàng vải (giống FPT Shop)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricPaymentRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotNull(message = "Payment provider is required")
    private PaymentProvider provider;

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be greater than 0")
    private BigDecimal amount;

    private String callbackUrl;
    private String returnUrl;
    private String extraData;
}


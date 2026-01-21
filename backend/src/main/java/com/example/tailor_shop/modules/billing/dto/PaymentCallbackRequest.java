package com.example.tailor_shop.modules.billing.dto;

import com.example.tailor_shop.modules.billing.domain.PaymentProvider;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCallbackRequest {

    @NotNull(message = "Provider is required")
    private PaymentProvider provider;

    @NotNull(message = "Provider reference is required")
    private String providerRef;

    @NotNull(message = "Success flag is required")
    private Boolean success;

    private BigDecimal amount;
    private String rawPayload;
    private String message;
}



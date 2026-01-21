package com.example.tailor_shop.modules.billing.dto;

import com.example.tailor_shop.modules.billing.domain.PaymentProvider;
import com.example.tailor_shop.modules.billing.domain.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Long transactionId;
    private Long invoiceId;
    private PaymentProvider provider;
    private PaymentStatus status;
    private BigDecimal amount;
    private String providerRef;
    private String paymentUrl;
    private OffsetDateTime paidAt;
    private OffsetDateTime createdAt;
}



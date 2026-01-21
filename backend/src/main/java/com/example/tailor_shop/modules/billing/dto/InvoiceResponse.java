package com.example.tailor_shop.modules.billing.dto;

import com.example.tailor_shop.modules.billing.domain.InvoiceStatus;
import com.example.tailor_shop.modules.billing.domain.PaymentProvider;
import com.example.tailor_shop.modules.billing.domain.PaymentStatus;
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
public class InvoiceResponse {

    private Long id;
    private String code;
    private Long orderId;
    private Party customer;
    private Party staff;
    private InvoiceStatus status;
    private String currency;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal total;
    private BigDecimal paidAmount;
    private BigDecimal dueAmount;
    private OffsetDateTime issuedAt;
    private LocalDate dueDate;
    private String notes;
    private List<ItemResponse> items;
    private List<TransactionResponse> transactions;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponse {
        private Long id;
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discountAmount;
        private BigDecimal taxRate;
        private BigDecimal lineTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionResponse {
        private Long id;
        private PaymentProvider provider;
        private PaymentStatus status;
        private BigDecimal amount;
        private String providerRef;
        private OffsetDateTime paidAt;
        private OffsetDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Party {
        private Long id;
        private String name;
        private String role;
        private String phone;
    }
}



package com.example.tailor_shop.modules.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnpaidCustomerResponse {

    private Long customerId;
    private String customerName;
    private String customerPhone;
    private int totalInvoices;
    private BigDecimal totalAmount;
    private BigDecimal totalPaid;
    private BigDecimal totalDue;
    private List<UnpaidInvoiceSummary> invoices;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnpaidInvoiceSummary {
        private Long id;
        private String code;
        private String status;
        private BigDecimal total;
        private BigDecimal paidAmount;
        private BigDecimal dueAmount;
        private OffsetDateTime createdAt;
        private java.time.LocalDate dueDate;
    }
}

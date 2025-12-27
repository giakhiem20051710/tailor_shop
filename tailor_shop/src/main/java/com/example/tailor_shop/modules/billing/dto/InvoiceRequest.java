package com.example.tailor_shop.modules.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {

    private Long orderId;

    private Long customerId;

    private String customerName;

    private String customerPhone;

    private Long staffId;

    @NotBlank(message = "Currency is required")
    @Size(max = 10, message = "Currency must be at most 10 characters")
    private String currency;

    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private LocalDate dueDate;

    @Size(max = 50, message = "Promo code must be at most 50 characters")
    private String promoCode;

    @Size(max = 500, message = "Notes must be at most 500 characters")
    private String notes;

    @Valid
    @NotEmpty(message = "Invoice items are required")
    private List<ItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        @NotBlank(message = "Item name is required")
        @Size(max = 255, message = "Item name must be at most 255 characters")
        private String name;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        @NotNull(message = "Unit price is required")
        private BigDecimal unitPrice;

        private BigDecimal discountAmount;
        private BigDecimal taxRate;
    }
}

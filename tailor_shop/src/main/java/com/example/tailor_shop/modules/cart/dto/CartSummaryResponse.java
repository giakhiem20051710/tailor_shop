package com.example.tailor_shop.modules.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO cho cart summary (giống FPT Shop)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartSummaryResponse {

    private List<CartItemResponse> items;
    private Integer itemCount; // Total number of items
    private BigDecimal subtotal; // Total before discount
    private BigDecimal discountAmount; // Total discount
    private BigDecimal shippingFee; // Shipping fee
    private BigDecimal total; // Final total
    private Boolean hasAvailableItems; // All items available
}


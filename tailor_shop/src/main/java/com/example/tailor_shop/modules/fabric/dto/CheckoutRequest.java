package com.example.tailor_shop.modules.fabric.dto;

import com.example.tailor_shop.modules.fabric.domain.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO cho checkout (giống FPT Shop)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    @NotNull(message = "Cart item IDs are required")
    private List<Long> cartItemIds; // Cart item IDs from Cart module (item_type = FABRIC)

    private String promoCode; // Optional promo code

    @NotBlank(message = "Shipping name is required")
    @Size(max = 255, message = "Shipping name must not exceed 255 characters")
    private String shippingName;

    @NotBlank(message = "Shipping phone is required")
    @Size(max = 20, message = "Shipping phone must not exceed 20 characters")
    private String shippingPhone;

    @NotBlank(message = "Shipping address is required")
    @Size(max = 1000, message = "Shipping address must not exceed 1000 characters")
    private String shippingAddress;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;
}


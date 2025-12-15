package com.example.tailor_shop.modules.cart.service;

import com.example.tailor_shop.modules.cart.dto.AddToCartRequest;
import com.example.tailor_shop.modules.cart.dto.CartItemResponse;
import com.example.tailor_shop.modules.cart.dto.CartSummaryResponse;

import java.math.BigDecimal;

/**
 * Service cho Cart module (generic, có thể dùng cho nhiều loại sản phẩm)
 */
public interface CartService {

    CartItemResponse addToCart(AddToCartRequest request, Long userId);

    CartSummaryResponse getCart(Long userId);

    void updateCartItem(Long cartItemId, BigDecimal quantity, Long userId);

    void removeFromCart(Long cartItemId, Long userId);

    void clearCart(Long userId);

    void clearCartByType(com.example.tailor_shop.modules.cart.domain.CartItemType itemType, Long userId);
}


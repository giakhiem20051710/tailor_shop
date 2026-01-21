package com.example.tailor_shop.modules.cart.controller;

import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.cart.dto.AddToCartRequest;
import com.example.tailor_shop.modules.cart.dto.CartItemResponse;
import com.example.tailor_shop.modules.cart.dto.CartSummaryResponse;
import com.example.tailor_shop.modules.cart.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Cart Controller - Module riêng, có thể tái sử dụng cho nhiều loại sản phẩm
 * Giống Shopee, FPT Shop: Cart là module độc lập
 */
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * Thêm sản phẩm vào giỏ hàng (generic - hỗ trợ Product, Fabric, Service)
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<CartItemResponse>> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        CartItemResponse data = cartService.addToCart(request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Xem giỏ hàng
     */
    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<CartSummaryResponse>> getCart(
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        CartSummaryResponse data = cartService.getCart(principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Cập nhật số lượng trong giỏ hàng
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<Void>> updateCartItem(
            @PathVariable Long id,
            @RequestParam BigDecimal quantity,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        cartService.updateCartItem(id, quantity, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Xóa sản phẩm khỏi giỏ hàng
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<Void>> removeFromCart(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        cartService.removeFromCart(id, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Xóa toàn bộ giỏ hàng
     */
    @DeleteMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<Void>> clearCart(
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        cartService.clearCart(principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }
}


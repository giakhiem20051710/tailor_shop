package com.example.tailor_shop.modules.fabric.controller;

import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.billing.dto.PaymentResponse;
import com.example.tailor_shop.modules.fabric.dto.*;
import com.example.tailor_shop.modules.fabric.service.FabricOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cho Fabric Order và Cart (giống FPT Shop)
 */
@RestController
@RequestMapping("/api/v1/fabric-orders")
@RequiredArgsConstructor
public class FabricOrderController {

    private final FabricOrderService fabricOrderService;

    // ========== CHECKOUT & ORDER ==========
    // Note: Cart operations đã được tách ra CartController (module riêng)
    // Sử dụng /api/v1/cart endpoints để quản lý giỏ hàng

    /**
     * Checkout - Tạo đơn hàng từ giỏ hàng (giống FPT Shop)
     */
    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<FabricOrderResponse>> checkout(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        FabricOrderResponse data = fabricOrderService.checkout(request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Danh sách đơn hàng của tôi
     */
    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<Page<FabricOrderResponse>>> listMyOrders(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Page<FabricOrderResponse> data = fabricOrderService.listMyOrders(principal.getId(), pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Chi tiết đơn hàng
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<FabricOrderResponse>> getOrderDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        FabricOrderResponse data = fabricOrderService.getOrderDetail(id, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Hủy đơn hàng
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<Void>> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        fabricOrderService.cancelOrder(id, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    // ========== PAYMENT ==========

    /**
     * Thanh toán đơn hàng (giống FPT Shop)
     * Hỗ trợ: COD, Bank Transfer, Credit Card, E-Wallet
     */
    @PostMapping("/payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<PaymentResponse>> processPayment(
            @Valid @RequestBody FabricPaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        PaymentResponse data = fabricOrderService.processPayment(request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }
}


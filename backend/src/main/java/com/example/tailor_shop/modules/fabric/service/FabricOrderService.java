package com.example.tailor_shop.modules.fabric.service;

import com.example.tailor_shop.modules.fabric.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

/**
 * Service cho Fabric Order (giống FPT Shop)
 * Note: Cart operations đã được tách ra CartService (module riêng)
 */
public interface FabricOrderService {

    // Checkout & Order
    FabricOrderResponse checkout(CheckoutRequest request, Long userId);
    FabricOrderResponse getOrderDetail(Long orderId, Long userId);
    Page<FabricOrderResponse> listMyOrders(Long userId, Pageable pageable);
    void cancelOrder(Long orderId, Long userId);

    // Payment
    com.example.tailor_shop.modules.billing.dto.PaymentResponse processPayment(FabricPaymentRequest request, Long userId);
}


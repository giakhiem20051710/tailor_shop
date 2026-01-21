package com.example.tailor_shop.modules.flashsale.service;

import com.example.tailor_shop.modules.flashsale.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Flash Sale Service Interface
 */
public interface FlashSaleService {

    // ==================== PUBLIC QUERIES ====================

    /**
     * Get currently active flash sales
     */
    List<FlashSaleResponse> getActiveSales(Long userId);

    /**
     * Get upcoming flash sales
     */
    List<FlashSaleResponse> getUpcomingSales(Long userId);

    /**
     * Get featured flash sales
     */
    List<FlashSaleResponse> getFeaturedSales(Long userId);

    /**
     * Get flash sale detail
     */
    FlashSaleResponse getDetail(Long id, Long userId);

    // ==================== ADMIN OPERATIONS ====================

    /**
     * List all flash sales (admin)
     */
    Page<FlashSaleResponse> listAll(List<String> statuses, Pageable pageable);

    /**
     * Create flash sale (admin)
     */
    FlashSaleResponse create(FlashSaleRequest request, Long createdBy);

    /**
     * Update flash sale (admin)
     */
    FlashSaleResponse update(Long id, FlashSaleRequest request, Long updatedBy);

    /**
     * Cancel flash sale (admin)
     */
    FlashSaleResponse cancel(Long id, Long updatedBy);

    // ==================== CUSTOMER OPERATIONS ====================

    /**
     * Purchase flash sale item - THE CORE ALGORITHM
     */
    FlashSalePurchaseResult purchase(Long flashSaleId, FlashSalePurchaseRequest request, Long userId);

    /**
     * Get my orders for a flash sale
     */
    List<FlashSaleOrderResponse> getMyOrders(Long flashSaleId, Long userId);

    /**
     * Get all my flash sale orders
     */
    Page<FlashSaleOrderResponse> getAllMyOrders(Long userId, Pageable pageable);

    /**
     * Get order detail
     */
    FlashSaleOrderResponse getOrderDetail(Long orderId, Long userId);

    /**
     * Cancel order (before payment)
     */
    FlashSaleOrderResponse cancelOrder(Long orderId, Long userId);

    /**
     * Confirm payment (simple flow without payment gateway)
     */
    FlashSaleOrderResponse confirmPayment(Long orderId, Long userId, String paymentMethod);

    // ==================== SCHEDULED TASKS ====================

    /**
     * Update flash sale statuses (SCHEDULED -> ACTIVE -> ENDED)
     */
    void updateFlashSaleStatuses();

    /**
     * Release expired reservations
     */
    void releaseExpiredReservations();

    /**
     * Expire pending orders past deadline
     */
    void expirePendingOrders();
}

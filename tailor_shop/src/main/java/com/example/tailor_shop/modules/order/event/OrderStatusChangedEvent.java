package com.example.tailor_shop.modules.order.event;

import com.example.tailor_shop.modules.order.domain.OrderEntity;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Event published when order status changes.
 * 
 * Listeners:
 * - NotificationService: Notify customer about status change
 * - DashboardService: Update real-time dashboard
 * - AnalyticsService: Track order lifecycle metrics
 */
@Getter
public class OrderStatusChangedEvent {

    private final Long orderId;
    private final String orderCode;
    private final Long customerId;
    private final String customerEmail;
    private final String customerPhone;
    private final String oldStatus;
    private final String newStatus;
    private final String changedBy;
    private final LocalDateTime changedAt;
    private final String correlationId;

    public OrderStatusChangedEvent(OrderEntity order, String oldStatus, String newStatus,
            String changedBy, String correlationId) {
        this.orderId = order.getId();
        this.orderCode = order.getCode();
        this.customerId = order.getCustomer() != null ? order.getCustomer().getId() : null;
        this.customerEmail = order.getCustomer() != null ? order.getCustomer().getEmail() : null;
        this.customerPhone = order.getCustomer() != null ? order.getCustomer().getPhone() : null;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.changedAt = LocalDateTime.now();
        this.correlationId = correlationId;
    }

    /**
     * Check if order is moving to a completed state.
     */
    public boolean isCompleted() {
        return "COMPLETED".equals(newStatus) || "DELIVERED".equals(newStatus);
    }

    /**
     * Check if order is cancelled.
     */
    public boolean isCancelled() {
        return "CANCELLED".equals(newStatus);
    }

    @Override
    public String toString() {
        return String.format("OrderStatusChangedEvent[orderId=%d, %s -> %s]",
                orderId, oldStatus, newStatus);
    }
}

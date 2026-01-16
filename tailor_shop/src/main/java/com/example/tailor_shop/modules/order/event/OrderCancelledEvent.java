package com.example.tailor_shop.modules.order.event;

import com.example.tailor_shop.modules.order.domain.OrderEntity;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event published when an order is cancelled.
 * 
 * Listeners:
 * - InvoiceService: Cancel or refund invoice
 * - InventoryService: Release reserved fabric stock
 * - NotificationService: Notify customer about cancellation
 * - RefundService: Process refund if applicable
 */
@Getter
public class OrderCancelledEvent {

    private final Long orderId;
    private final String orderCode;
    private final Long customerId;
    private final String customerEmail;
    private final String customerPhone;
    private final BigDecimal totalAmount;
    private final String cancellationReason;
    private final String cancelledBy;
    private final boolean requiresRefund;
    private final LocalDateTime cancelledAt;
    private final String correlationId;

    public OrderCancelledEvent(OrderEntity order, String cancellationReason,
            String cancelledBy, boolean requiresRefund, String correlationId) {
        this.orderId = order.getId();
        this.orderCode = order.getCode();
        this.customerId = order.getCustomer() != null ? order.getCustomer().getId() : null;
        this.customerEmail = order.getCustomer() != null ? order.getCustomer().getEmail() : null;
        this.customerPhone = order.getCustomer() != null ? order.getCustomer().getPhone() : null;
        this.totalAmount = order.getTotal();
        this.cancellationReason = cancellationReason;
        this.cancelledBy = cancelledBy;
        this.requiresRefund = requiresRefund;
        this.cancelledAt = LocalDateTime.now();
        this.correlationId = correlationId;
    }

    @Override
    public String toString() {
        return String.format("OrderCancelledEvent[orderId=%d, orderCode=%s, reason=%s, refund=%s]",
                orderId, orderCode, cancellationReason, requiresRefund);
    }
}

package com.example.tailor_shop.modules.order.event;

import com.example.tailor_shop.modules.order.domain.OrderEntity;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event published when a new order is created.
 * 
 * Listeners:
 * - InvoiceService: Auto-create invoice
 * - AppointmentService: Create measurement appointment
 * - NotificationService: Send confirmation email/SMS
 * - InventoryService: Reserve fabric stock
 */
@Getter
public class OrderCreatedEvent {

    private final Long orderId;
    private final String orderCode;
    private final Long customerId;
    private final String customerName;
    private final String customerEmail;
    private final String customerPhone;
    private final BigDecimal totalAmount;
    private final String orderType;
    private final LocalDateTime createdAt;
    private final String correlationId;

    public OrderCreatedEvent(OrderEntity order, String correlationId) {
        this.orderId = order.getId();
        this.orderCode = order.getCode();
        this.customerId = order.getCustomer() != null ? order.getCustomer().getId() : null;
        this.customerName = order.getCustomer() != null ? order.getCustomer().getName() : null;
        this.customerEmail = order.getCustomer() != null ? order.getCustomer().getEmail() : null;
        this.customerPhone = order.getCustomer() != null ? order.getCustomer().getPhone() : null;
        this.totalAmount = order.getTotal();
        this.orderType = order.getStatus() != null ? order.getStatus().name() : null;
        this.createdAt = LocalDateTime.now();
        this.correlationId = correlationId;
    }

    @Override
    public String toString() {
        return String.format("OrderCreatedEvent[orderId=%d, orderCode=%s, customer=%s, total=%s]",
                orderId, orderCode, customerName, totalAmount);
    }
}

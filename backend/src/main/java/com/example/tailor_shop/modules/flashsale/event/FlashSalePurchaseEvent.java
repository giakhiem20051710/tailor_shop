package com.example.tailor_shop.modules.flashsale.event;

import com.example.tailor_shop.modules.flashsale.domain.FlashSaleOrderEntity;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event published when a customer successfully purchases a flash sale item.
 * 
 * Listeners:
 * - NotificationService: Send purchase confirmation
 * - InventoryService: Update flash sale stock
 * - AnalyticsService: Track flash sale conversion
 */
@Getter
public class FlashSalePurchaseEvent {

    private final Long flashSaleOrderId;
    private final Long flashSaleId;
    private final String flashSaleName;
    private final Long customerId;
    private final String customerEmail;
    private final String customerPhone;
    private final BigDecimal quantity;
    private final BigDecimal unitPrice;
    private final BigDecimal totalAmount;
    private final BigDecimal discountAmount;
    private final LocalDateTime purchasedAt;
    private final String correlationId;

    public FlashSalePurchaseEvent(FlashSaleOrderEntity order, String flashSaleName,
            String correlationId) {
        this.flashSaleOrderId = order.getId();
        this.flashSaleId = order.getFlashSale() != null ? order.getFlashSale().getId() : null;
        this.flashSaleName = flashSaleName;
        this.customerId = order.getUser() != null ? order.getUser().getId() : null;
        this.customerEmail = order.getUser() != null ? order.getUser().getEmail() : null;
        this.customerPhone = order.getUser() != null ? order.getUser().getPhone() : null;
        this.quantity = order.getQuantity();
        this.unitPrice = order.getUnitPrice();
        this.totalAmount = order.getTotalAmount();
        this.discountAmount = order.getDiscountAmount();
        this.purchasedAt = LocalDateTime.now();
        this.correlationId = correlationId;
    }

    @Override
    public String toString() {
        return String.format("FlashSalePurchaseEvent[orderId=%d, flashSale=%s, customer=%d, qty=%d]",
                flashSaleOrderId, flashSaleName, customerId, quantity);
    }
}

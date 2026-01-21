package com.example.tailor_shop.modules.flashsale.event;

import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Event published when a flash sale reservation expires.
 * 
 * Listeners:
 * - InventoryService: Release reserved quantity back to stock
 * - NotificationService: Notify customer their reservation expired
 */
@Getter
public class ReservationExpiredEvent {

    private final Long reservationId;
    private final Long flashSaleId;
    private final String flashSaleName;
    private final Long customerId;
    private final String customerEmail;
    private final Integer quantity;
    private final LocalDateTime expiredAt;
    private final String correlationId;

    public ReservationExpiredEvent(Long reservationId, Long flashSaleId, String flashSaleName,
            Long customerId, String customerEmail, Integer quantity,
            String correlationId) {
        this.reservationId = reservationId;
        this.flashSaleId = flashSaleId;
        this.flashSaleName = flashSaleName;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.quantity = quantity;
        this.expiredAt = LocalDateTime.now();
        this.correlationId = correlationId;
    }

    @Override
    public String toString() {
        return String.format("ReservationExpiredEvent[reservationId=%d, flashSale=%s, customer=%d, qty=%d]",
                reservationId, flashSaleName, customerId, quantity);
    }
}

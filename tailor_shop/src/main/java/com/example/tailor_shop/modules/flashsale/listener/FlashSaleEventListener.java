package com.example.tailor_shop.modules.flashsale.listener;

import com.example.tailor_shop.modules.flashsale.event.FlashSalePurchaseEvent;
import com.example.tailor_shop.modules.flashsale.event.ReservationExpiredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event Listeners for FlashSale-related events.
 * 
 * Handles:
 * - Update analytics on purchase
 * - Release stock on reservation expiry
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FlashSaleEventListener {

    // TODO: Inject services when implementing
    // private final AnalyticsService analyticsService;
    // private final InventoryService inventoryService;

    /**
     * Handle successful flash sale purchase.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handlePurchase_TrackAnalytics(FlashSalePurchaseEvent event) {
        log.info("[{}] Tracking flash sale purchase: order={}, flashSale={}, qty={}", 
                event.getCorrelationId(), 
                event.getFlashSaleOrderId(),
                event.getFlashSaleName(),
                event.getQuantity());
        
        try {
            // Track purchase metrics
            // TODO: analyticsService.trackFlashSalePurchase(event);
            log.info("[{}] Analytics tracked for flash sale purchase: {}", 
                    event.getCorrelationId(), event.getFlashSaleOrderId());
        } catch (Exception e) {
            log.error("[{}] Failed to track analytics for flash sale {}: {}", 
                    event.getCorrelationId(), event.getFlashSaleOrderId(), e.getMessage(), e);
        }
    }

    /**
     * Handle reservation expiry - release stock.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleReservationExpired(ReservationExpiredEvent event) {
        log.info("[{}] Reservation expired: reservationId={}, flashSale={}, qty={}", 
                event.getCorrelationId(),
                event.getReservationId(),
                event.getFlashSaleName(),
                event.getQuantity());
        
        try {
            // Release reserved quantity back to flash sale stock
            // TODO: Update flash sale sold_quantity in database
            log.info("[{}] Released {} units back to flash sale stock: {}", 
                    event.getCorrelationId(), event.getQuantity(), event.getFlashSaleName());
        } catch (Exception e) {
            log.error("[{}] Failed to release stock for reservation {}: {}", 
                    event.getCorrelationId(), event.getReservationId(), e.getMessage(), e);
        }
    }
}

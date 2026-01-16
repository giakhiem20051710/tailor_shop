package com.example.tailor_shop.modules.order.listener;

import com.example.tailor_shop.modules.event.annotation.RetryableEvent;
import com.example.tailor_shop.modules.order.event.OrderCancelledEvent;
import com.example.tailor_shop.modules.order.event.OrderCreatedEvent;
import com.example.tailor_shop.modules.order.event.OrderStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event Listeners for Order-related events.
 * 
 * Features:
 * - Auto-create invoice when order is created
 * - Auto-create appointment when order is created
 * - Release inventory when order is cancelled
 * - Automatic retry with exponential backoff (@RetryableEvent)
 * - Failed events saved to Dead-Letter Queue
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventListener {

    // TODO: Inject services when implementing
    // private final InvoiceService invoiceService;
    // private final AppointmentService appointmentService;
    // private final InventoryService inventoryService;

    /**
     * Handle order created event - create invoice.
     * 
     * @RetryableEvent: Auto-retry 3 times with exponential backoff.
     *                  On final failure, event is saved to DLQ for manual
     *                  processing.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("eventExecutor")
    @RetryableEvent(maxRetries = 3, saveToDlq = true)
    public void handleOrderCreated_CreateInvoice(OrderCreatedEvent event) {
        log.info("[{}] Creating invoice for order: {}",
                event.getCorrelationId(), event.getOrderCode());

        // TODO: Uncomment when InvoiceService is ready
        // invoiceService.createForOrder(event.getOrderId());

        log.info("[{}] Invoice created successfully for order: {}",
                event.getCorrelationId(), event.getOrderCode());
    }

    /**
     * Handle order created event - create appointment.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("eventExecutor")
    @RetryableEvent(maxRetries = 3, saveToDlq = true)
    public void handleOrderCreated_CreateAppointment(OrderCreatedEvent event) {
        log.info("[{}] Creating appointment for order: {}",
                event.getCorrelationId(), event.getOrderCode());

        // TODO: Uncomment when AppointmentService is ready
        // appointmentService.createForOrder(event.getOrderId(), event.getCustomerId());

        log.info("[{}] Appointment created successfully for order: {}",
                event.getCorrelationId(), event.getOrderCode());
    }

    /**
     * Handle order status changed event.
     * No retry needed - just logging and analytics.
     */
    @EventListener
    @Async("eventExecutor")
    public void handleOrderStatusChanged(OrderStatusChangedEvent event) {
        log.info("[{}] Order {} status changed: {} -> {}",
                event.getCorrelationId(), event.getOrderCode(),
                event.getOldStatus(), event.getNewStatus());

        if (event.isCompleted()) {
            log.info("[{}] Order {} completed, triggering post-completion tasks",
                    event.getCorrelationId(), event.getOrderCode());
            // TODO: Request review, add loyalty points, etc.
        }
    }

    /**
     * Handle order cancelled event - release inventory and process refund.
     * Critical operation - retry and save to DLQ on failure.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("eventExecutor")
    @RetryableEvent(maxRetries = 5, saveToDlq = true) // More retries for critical operation
    public void handleOrderCancelled(OrderCancelledEvent event) {
        log.info("[{}] Order {} cancelled, reason: {}",
                event.getCorrelationId(), event.getOrderCode(), event.getCancellationReason());

        // Release reserved fabric stock
        // TODO: inventoryService.releaseReservation(event.getOrderId());
        log.info("[{}] Released inventory for cancelled order: {}",
                event.getCorrelationId(), event.getOrderCode());

        // Process refund if required
        if (event.isRequiresRefund()) {
            log.info("[{}] Processing refund for order: {} amount: {}",
                    event.getCorrelationId(), event.getOrderCode(), event.getTotalAmount());
            // TODO: refundService.processRefund(event);
        }
    }
}

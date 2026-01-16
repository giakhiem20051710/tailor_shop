package com.example.tailor_shop.modules.notification.listener;

import com.example.tailor_shop.modules.flashsale.event.FlashSalePurchaseEvent;
import com.example.tailor_shop.modules.flashsale.event.ReservationExpiredEvent;
import com.example.tailor_shop.modules.order.event.OrderCancelledEvent;
import com.example.tailor_shop.modules.order.event.OrderCreatedEvent;
import com.example.tailor_shop.modules.order.event.OrderStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Centralized Notification Event Listener.
 * 
 * Listens to ALL events that require customer notification.
 * Handles: Email, SMS, Push notifications.
 * 
 * This is a cross-cutting concern that spans multiple domains.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    // TODO: Inject notification services
    // private final EmailService emailService;
    // private final SmsService smsService;
    // private final PushNotificationService pushService;

    // ==================== ORDER EVENTS ====================

    /**
     * Send order confirmation email when order is created.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void sendOrderConfirmation(OrderCreatedEvent event) {
        log.info("[{}] Sending order confirmation to: {}", 
                event.getCorrelationId(), event.getCustomerEmail());
        
        try {
            // Email notification
            // emailService.sendOrderConfirmation(
            //     event.getCustomerEmail(),
            //     event.getCustomerName(),
            //     event.getOrderCode(),
            //     event.getTotalAmount()
            // );
            
            // SMS notification (optional)
            if (event.getCustomerPhone() != null) {
                // smsService.sendOrderConfirmationSms(event.getCustomerPhone(), event.getOrderCode());
            }
            
            log.info("[{}] Order confirmation sent successfully: {}", 
                    event.getCorrelationId(), event.getOrderCode());
        } catch (Exception e) {
            log.error("[{}] Failed to send order confirmation for {}: {}", 
                    event.getCorrelationId(), event.getOrderCode(), e.getMessage(), e);
            // TODO: Add to retry queue or dead-letter queue
        }
    }

    /**
     * Notify customer when order status changes.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void notifyOrderStatusChange(OrderStatusChangedEvent event) {
        log.info("[{}] Notifying customer about order status change: {} -> {}", 
                event.getCorrelationId(), event.getOldStatus(), event.getNewStatus());
        
        try {
            String message = buildStatusChangeMessage(event.getOrderCode(), event.getNewStatus());
            
            // Email
            // emailService.sendStatusUpdate(event.getCustomerEmail(), event.getOrderCode(), message);
            
            // SMS for important status changes
            if (isImportantStatusChange(event.getNewStatus())) {
                // smsService.sendStatusUpdate(event.getCustomerPhone(), message);
            }
            
            log.info("[{}] Status change notification sent: order={}, status={}", 
                    event.getCorrelationId(), event.getOrderCode(), event.getNewStatus());
        } catch (Exception e) {
            log.error("[{}] Failed to notify status change for order {}: {}", 
                    event.getCorrelationId(), event.getOrderCode(), e.getMessage(), e);
        }
    }

    /**
     * Notify customer when order is cancelled.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void notifyOrderCancellation(OrderCancelledEvent event) {
        log.info("[{}] Notifying customer about order cancellation: {}", 
                event.getCorrelationId(), event.getOrderCode());
        
        try {
            // emailService.sendOrderCancellation(
            //     event.getCustomerEmail(),
            //     event.getOrderCode(),
            //     event.getCancellationReason(),
            //     event.isRequiresRefund()
            // );
            
            log.info("[{}] Cancellation notification sent: {}", 
                    event.getCorrelationId(), event.getOrderCode());
        } catch (Exception e) {
            log.error("[{}] Failed to notify cancellation for order {}: {}", 
                    event.getCorrelationId(), event.getOrderCode(), e.getMessage(), e);
        }
    }

    // ==================== FLASH SALE EVENTS ====================

    /**
     * Send flash sale purchase confirmation.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void sendFlashSalePurchaseConfirmation(FlashSalePurchaseEvent event) {
        log.info("[{}] Sending flash sale confirmation to: {}", 
                event.getCorrelationId(), event.getCustomerEmail());
        
        try {
            // emailService.sendFlashSaleConfirmation(
            //     event.getCustomerEmail(),
            //     event.getFlashSaleName(),
            //     event.getQuantity(),
            //     event.getTotalAmount()
            // );
            
            log.info("[{}] Flash sale confirmation sent: orderId={}", 
                    event.getCorrelationId(), event.getFlashSaleOrderId());
        } catch (Exception e) {
            log.error("[{}] Failed to send flash sale confirmation: {}", 
                    event.getCorrelationId(), e.getMessage(), e);
        }
    }

    /**
     * Notify customer when their reservation expires.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void notifyReservationExpiry(ReservationExpiredEvent event) {
        log.info("[{}] Notifying customer about expired reservation: {}", 
                event.getCorrelationId(), event.getReservationId());
        
        try {
            // emailService.sendReservationExpiredNotification(
            //     event.getCustomerEmail(),
            //     event.getFlashSaleName(),
            //     event.getQuantity()
            // );
            
            log.info("[{}] Reservation expiry notification sent: reservationId={}", 
                    event.getCorrelationId(), event.getReservationId());
        } catch (Exception e) {
            log.error("[{}] Failed to notify reservation expiry: {}", 
                    event.getCorrelationId(), e.getMessage(), e);
        }
    }

    // ==================== HELPER METHODS ====================

    private String buildStatusChangeMessage(String orderCode, String newStatus) {
        return switch (newStatus) {
            case "CONFIRMED" -> String.format("Đơn hàng %s đã được xác nhận.", orderCode);
            case "PROCESSING" -> String.format("Đơn hàng %s đang được xử lý.", orderCode);
            case "TAILORING" -> String.format("Đơn hàng %s đang được may.", orderCode);
            case "READY" -> String.format("Đơn hàng %s đã sẵn sàng để giao.", orderCode);
            case "SHIPPED" -> String.format("Đơn hàng %s đã được gửi đi.", orderCode);
            case "DELIVERED" -> String.format("Đơn hàng %s đã được giao thành công.", orderCode);
            case "COMPLETED" -> String.format("Đơn hàng %s đã hoàn thành. Cảm ơn quý khách!", orderCode);
            default -> String.format("Đơn hàng %s đã được cập nhật trạng thái: %s", orderCode, newStatus);
        };
    }

    private boolean isImportantStatusChange(String status) {
        return status != null && (
            status.equals("SHIPPED") || 
            status.equals("DELIVERED") || 
            status.equals("READY") ||
            status.equals("CANCELLED")
        );
    }
}

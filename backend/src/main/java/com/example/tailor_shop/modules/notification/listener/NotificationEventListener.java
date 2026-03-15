package com.example.tailor_shop.modules.notification.listener;

import com.example.tailor_shop.modules.flashsale.event.FlashSalePurchaseEvent;
import com.example.tailor_shop.modules.flashsale.event.ReservationExpiredEvent;
import com.example.tailor_shop.modules.notification.service.NotificationService;
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
 * Handles: In-app real-time notifications (via WebSocket) + database
 * persistence.
 * 
 * This is a cross-cutting concern that spans multiple domains.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;

    // ==================== ORDER EVENTS ====================

    /**
     * Send order confirmation when order is created.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void sendOrderConfirmation(OrderCreatedEvent event) {
        log.info("[{}] Sending order confirmation to: {}",
                event.getCorrelationId(), event.getCustomerEmail());

        try {
            if (event.getCustomerId() != null) {
                notificationService.send(
                        event.getCustomerId(),
                        "ORDER",
                        "Đơn hàng mới đã tạo",
                        String.format("Đơn hàng %s đã được tạo thành công. Tổng tiền: %s đ",
                                event.getOrderCode(),
                                event.getTotalAmount() != null ? event.getTotalAmount().toPlainString() : "0"),
                        "📦",
                        "/orders");
            }

            log.info("[{}] Order confirmation sent successfully: {}",
                    event.getCorrelationId(), event.getOrderCode());
        } catch (Exception e) {
            log.error("[{}] Failed to send order confirmation for {}: {}",
                    event.getCorrelationId(), event.getOrderCode(), e.getMessage(), e);
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
            String icon = getStatusIcon(event.getNewStatus());

            if (event.getCustomerId() != null) {
                notificationService.send(
                        event.getCustomerId(),
                        "ORDER",
                        "Cập nhật đơn hàng",
                        message,
                        icon,
                        "/orders");
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
            if (event.getCustomerId() != null) {
                String reason = event.getCancellationReason() != null
                        ? event.getCancellationReason()
                        : "Không rõ lý do";
                notificationService.send(
                        event.getCustomerId(),
                        "ORDER",
                        "Đơn hàng đã huỷ",
                        String.format("Đơn hàng %s đã bị huỷ. Lý do: %s",
                                event.getOrderCode(), reason),
                        "❌",
                        "/orders");
            }

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
            if (event.getCustomerId() != null) {
                notificationService.send(
                        event.getCustomerId(),
                        "FLASH_SALE",
                        "Mua Flash Sale thành công!",
                        String.format("Bạn đã mua thành công %s trong Flash Sale. Số lượng: %d",
                                event.getFlashSaleName(),
                                event.getQuantity()),
                        "⚡",
                        "/orders");
            }

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
            if (event.getCustomerId() != null) {
                notificationService.send(
                        event.getCustomerId(),
                        "FLASH_SALE",
                        "Đặt chỗ đã hết hạn",
                        String.format("Đặt chỗ Flash Sale '%s' (SL: %d) đã hết hạn.",
                                event.getFlashSaleName(),
                                event.getQuantity()),
                        "⏰",
                        "/flash-sales");
            }

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

    private String getStatusIcon(String status) {
        return switch (status) {
            case "CONFIRMED" -> "✅";
            case "PROCESSING" -> "⚙️";
            case "TAILORING" -> "✂️";
            case "READY" -> "📦";
            case "SHIPPED" -> "🚚";
            case "DELIVERED" -> "🎉";
            case "COMPLETED" -> "🌟";
            default -> "📋";
        };
    }

    private boolean isImportantStatusChange(String status) {
        return status != null && (status.equals("SHIPPED") ||
                status.equals("DELIVERED") ||
                status.equals("READY") ||
                status.equals("CANCELLED"));
    }
}

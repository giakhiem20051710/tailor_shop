package com.example.tailor_shop.modules.notification.service;

import com.example.tailor_shop.modules.notification.domain.NotificationEntity;
import com.example.tailor_shop.modules.notification.dto.NotificationResponse;
import com.example.tailor_shop.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Notification Service — persists notifications to DB and pushes via WebSocket.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send a notification to a specific user.
     * Persists to DB and pushes via WebSocket to
     * /user/{userId}/queue/notifications.
     */
    @Transactional
    public NotificationResponse send(Long userId, String type, String title, String message, String icon, String link) {
        NotificationEntity entity = NotificationEntity.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .icon(icon)
                .link(link)
                .build();

        entity = notificationRepository.save(entity);
        NotificationResponse response = toResponse(entity);

        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    response);
            log.debug("WebSocket notification sent to user {}: {}", userId, title);
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification to user {}: {}", userId, e.getMessage());
        }

        return response;
    }

    /**
     * Broadcast a notification to all connected users.
     * Persists per-user and pushes to /topic/notifications.
     */
    public void broadcast(String type, String title, String message, String icon, String link) {
        NotificationResponse broadcast = NotificationResponse.builder()
                .type(type)
                .title(title)
                .message(message)
                .icon(icon)
                .link(link)
                .build();

        try {
            messagingTemplate.convertAndSend("/topic/notifications", broadcast);
            log.debug("Broadcast notification sent: {}", title);
        } catch (Exception e) {
            log.warn("Failed to broadcast notification: {}", e.getMessage());
        }
    }

    /**
     * Get paginated notifications for a user.
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    /**
     * Get unread notification count for a user.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark a single notification as read.
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId)
                .filter(n -> n.getUserId().equals(userId))
                .ifPresent(n -> {
                    n.setIsRead(true);
                    notificationRepository.save(n);
                });
    }

    /**
     * Mark all notifications as read for a user.
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsReadByUserId(userId);
    }

    private NotificationResponse toResponse(NotificationEntity entity) {
        return NotificationResponse.builder()
                .id(entity.getId())
                .type(entity.getType())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .icon(entity.getIcon())
                .link(entity.getLink())
                .isRead(entity.getIsRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

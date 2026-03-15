package com.example.tailor_shop.modules.notification.dto;

import lombok.Builder;

import java.time.OffsetDateTime;

@Builder
public record NotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        String icon,
        String link,
        Boolean isRead,
        OffsetDateTime createdAt) {
}

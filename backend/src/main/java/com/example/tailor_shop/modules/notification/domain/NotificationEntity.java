package com.example.tailor_shop.modules.notification.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_user_created", columnList = "userId, createdAt DESC"),
        @Index(name = "idx_notif_user_read", columnList = "userId, isRead")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String type; // ORDER, FLASH_SALE, PAYMENT, PROMOTION, REVIEW, SYSTEM

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 10)
    private String icon;

    @Column(length = 255)
    private String link;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

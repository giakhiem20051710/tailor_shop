package com.example.tailor_shop.modules.gamification.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Points Transaction Entity
 * Tracks all points transactions (earn, spend, expire)
 */
@Entity
@Table(name = "points_transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "amount", nullable = false)
    private Integer amount; // Positive for earn, negative for spend

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private TransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 50)
    private PointsSource source;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "description")
    private String description;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_expired")
    @Builder.Default
    private Boolean isExpired = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // ========== Enums ==========

    public enum TransactionType {
        EARN, // Kiếm xu
        SPEND, // Tiêu xu
        EXPIRED, // Xu hết hạn
        ADMIN_ADJUST // Admin điều chỉnh
    }

    public enum PointsSource {
        ORDER, // Từ đơn hàng
        CHECKIN, // Điểm danh
        REVIEW, // Viết review
        REFERRAL, // Giới thiệu bạn
        CHALLENGE, // Hoàn thành thử thách
        BIRTHDAY, // Sinh nhật
        REDEMPTION, // Đổi xu lấy giảm giá
        ADMIN // Admin điều chỉnh
    }

    // ========== Factory Methods ==========

    public static PointsTransaction earn(Long userId, int amount, PointsSource source,
            Long sourceId, String description, int balanceAfter,
            LocalDateTime expiresAt) {
        return PointsTransaction.builder()
                .userId(userId)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .transactionType(TransactionType.EARN)
                .source(source)
                .sourceId(sourceId)
                .description(description)
                .expiresAt(expiresAt)
                .isExpired(false)
                .build();
    }

    public static PointsTransaction spend(Long userId, int amount, PointsSource source,
            Long sourceId, String description, int balanceAfter) {
        return PointsTransaction.builder()
                .userId(userId)
                .amount(-amount) // Negative for spend
                .balanceAfter(balanceAfter)
                .transactionType(TransactionType.SPEND)
                .source(source)
                .sourceId(sourceId)
                .description(description)
                .build();
    }
}

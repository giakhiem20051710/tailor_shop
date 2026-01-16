package com.example.tailor_shop.modules.flashsale.domain;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Flash Sale Reservation Entity - Giữ hàng tạm thời
 */
@Entity
@Table(name = "flash_sale_reservations", indexes = {
        @Index(name = "idx_reservation_status_expires", columnList = "status, expires_at"),
        @Index(name = "idx_reservation_user_sale", columnList = "user_id, flash_sale_id"),
        @Index(name = "idx_reservation_sale", columnList = "flash_sale_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "flashSale", "user" })
public class FlashSaleReservationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== REFERENCES ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flash_sale_id", nullable = false)
    private FlashSaleEntity flashSale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // ==================== RESERVATION DETAILS ====================

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    // ==================== STATUS ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private FlashSaleReservationStatus status = FlashSaleReservationStatus.ACTIVE;

    // ==================== TIMING ====================

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "converted_at")
    private OffsetDateTime convertedAt;

    // ==================== METADATA ====================

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    // ==================== COMPUTED METHODS ====================

    /**
     * Check if reservation is expired
     */
    public boolean isExpired() {
        return status == FlashSaleReservationStatus.ACTIVE
                && OffsetDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if reservation is still valid
     */
    public boolean isValid() {
        return status == FlashSaleReservationStatus.ACTIVE
                && OffsetDateTime.now().isBefore(expiresAt);
    }

    /**
     * Get remaining seconds until expiry
     */
    public long getRemainingSeconds() {
        if (!isValid()) {
            return 0;
        }
        return java.time.Duration.between(OffsetDateTime.now(), expiresAt).getSeconds();
    }
}

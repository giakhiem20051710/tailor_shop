package com.example.tailor_shop.modules.flashsale.domain;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Flash Sale User Stats Entity - Thống kê mua hàng của user
 */
@Entity
@Table(name = "flash_sale_user_stats", indexes = {
        @Index(name = "idx_user_stats_sale", columnList = "flash_sale_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_sale", columnNames = { "user_id", "flash_sale_id" })
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "flashSale", "user" })
public class FlashSaleUserStatsEntity {

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

    // ==================== STATS ====================

    @Column(name = "total_purchased", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalPurchased = BigDecimal.ZERO;

    @Column(name = "total_orders", nullable = false)
    @Builder.Default
    private Integer totalOrders = 0;

    @Column(name = "last_purchase_at")
    private OffsetDateTime lastPurchaseAt;

    // ==================== METADATA ====================

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ==================== COMPUTED METHODS ====================

    /**
     * Get remaining quantity user can purchase
     */
    public BigDecimal getRemainingQuantity(BigDecimal maxPerUser) {
        return maxPerUser.subtract(totalPurchased).max(BigDecimal.ZERO);
    }

    /**
     * Check if user has reached limit
     */
    public boolean hasReachedLimit(BigDecimal maxPerUser) {
        return totalPurchased.compareTo(maxPerUser) >= 0;
    }
}

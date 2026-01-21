package com.example.tailor_shop.modules.flashsale.domain;

import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Flash Sale Entity - Quản lý Flash Sale vải
 */
@Entity
@Table(name = "flash_sales", indexes = {
        @Index(name = "idx_flash_sale_status", columnList = "status"),
        @Index(name = "idx_flash_sale_time", columnList = "start_time, end_time"),
        @Index(name = "idx_flash_sale_fabric", columnList = "fabric_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "fabric", "createdBy", "updatedBy", "orders", "reservations" })
public class FlashSaleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== FABRIC REFERENCE ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fabric_id", nullable = false)
    private FabricEntity fabric;

    @Column(name = "fabric_name", nullable = false)
    private String fabricName;

    @Column(name = "fabric_image", columnDefinition = "TEXT")
    private String fabricImage;

    // ==================== SALE INFO ====================

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // ==================== PRICING ====================

    @Column(name = "original_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "flash_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal flashPrice;

    // Computed field - discount percent
    @Column(name = "discount_percent", insertable = false, updatable = false)
    private Integer discountPercent;

    // ==================== QUANTITY MANAGEMENT ====================

    @Column(name = "total_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalQuantity;

    @Column(name = "sold_quantity", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal soldQuantity = BigDecimal.ZERO;

    @Column(name = "reserved_quantity", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    // ==================== LIMITS ====================

    @Column(name = "max_per_user", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal maxPerUser = new BigDecimal("5.00");

    @Column(name = "min_purchase", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minPurchase = new BigDecimal("0.50");

    // ==================== TIMING ====================

    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private OffsetDateTime endTime;

    // ==================== STATUS ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private FlashSaleStatus status = FlashSaleStatus.SCHEDULED;

    // ==================== DISPLAY ====================

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "banner_image", columnDefinition = "TEXT")
    private String bannerImage;

    // ==================== RELATIONSHIPS ====================

    @OneToMany(mappedBy = "flashSale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FlashSaleOrderEntity> orders = new ArrayList<>();

    @OneToMany(mappedBy = "flashSale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FlashSaleReservationEntity> reservations = new ArrayList<>();

    // ==================== METADATA ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private UserEntity updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ==================== COMPUTED METHODS ====================

    /**
     * Get available quantity (total - sold - reserved)
     */
    public BigDecimal getAvailableQuantity() {
        return totalQuantity
                .subtract(soldQuantity)
                .subtract(reservedQuantity);
    }

    /**
     * Get sold percentage (0-100)
     */
    public int getSoldPercentage() {
        if (totalQuantity.compareTo(BigDecimal.ZERO) == 0) {
            return 0;
        }
        return soldQuantity
                .divide(totalQuantity, 2, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .intValue();
    }

    /**
     * Calculate discount percent
     */
    public int getCalculatedDiscountPercent() {
        if (originalPrice.compareTo(BigDecimal.ZERO) == 0) {
            return 0;
        }
        return originalPrice.subtract(flashPrice)
                .divide(originalPrice, 2, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .intValue();
    }

    /**
     * Check if flash sale is currently active
     */
    public boolean isActive() {
        OffsetDateTime now = OffsetDateTime.now();
        return status == FlashSaleStatus.ACTIVE
                && now.isAfter(startTime)
                && now.isBefore(endTime)
                && getAvailableQuantity().compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Check if flash sale is sold out
     */
    public boolean isSoldOut() {
        return getAvailableQuantity().compareTo(BigDecimal.ZERO) <= 0;
    }

    /**
     * Check if flash sale has ended
     */
    public boolean hasEnded() {
        return OffsetDateTime.now().isAfter(endTime);
    }

    /**
     * Check if flash sale has started
     */
    public boolean hasStarted() {
        return OffsetDateTime.now().isAfter(startTime);
    }
}

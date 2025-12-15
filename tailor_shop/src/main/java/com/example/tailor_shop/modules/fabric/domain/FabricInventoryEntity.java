package com.example.tailor_shop.modules.fabric.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Fabric Inventory Entity - Quản lý tồn kho vải
 */
@Entity
@Table(name = "fabric_inventory")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"fabric"})
public class FabricInventoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fabric_id", nullable = false)
    private FabricEntity fabric;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "reserved_quantity", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @Column(name = "min_stock_level", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    @Column(name = "max_stock_level", precision = 10, scale = 2)
    private BigDecimal maxStockLevel;

    @Column(name = "unit", length = 20)
    @Builder.Default
    private String unit = "METER";

    @Column(name = "last_restocked_at")
    private OffsetDateTime lastRestockedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    /**
     * Tính available quantity (quantity - reserved)
     */
    public BigDecimal getAvailableQuantity() {
        return quantity.subtract(reservedQuantity);
    }

    /**
     * Check if stock is low
     */
    public Boolean isLowStock() {
        if (minStockLevel == null) {
            return false;
        }
        return getAvailableQuantity().compareTo(minStockLevel) <= 0;
    }
}


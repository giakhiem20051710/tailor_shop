package com.example.tailor_shop.modules.fabric.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Fabric Order Item Entity - Chi tiết đơn hàng
 */
@Entity
@Table(name = "fabric_order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"order", "fabric"})
public class FabricOrderItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private FabricOrderEntity order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fabric_id", nullable = false)
    private FabricEntity fabric;

    @Column(name = "fabric_name", nullable = false, length = 255)
    private String fabricName; // Snapshot

    @Column(name = "fabric_code", nullable = false, length = 50)
    private String fabricCode; // Snapshot

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "price_per_meter", nullable = false, precision = 14, scale = 2)
    private BigDecimal pricePerMeter; // Snapshot

    @Column(name = "subtotal", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal; // quantity * price_per_meter

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total", nullable = false, precision = 15, scale = 2)
    private BigDecimal total; // subtotal - discount_amount

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}


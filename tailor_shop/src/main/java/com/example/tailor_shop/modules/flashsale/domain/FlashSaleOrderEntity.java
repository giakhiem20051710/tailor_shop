package com.example.tailor_shop.modules.flashsale.domain;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Flash Sale Order Entity - Đơn hàng Flash Sale
 */
@Entity
@Table(name = "flash_sale_orders", indexes = {
        @Index(name = "idx_flash_order_user", columnList = "user_id"),
        @Index(name = "idx_flash_order_sale", columnList = "flash_sale_id"),
        @Index(name = "idx_flash_order_status", columnList = "status"),
        @Index(name = "idx_flash_order_code", columnList = "order_code")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "flashSale", "user", "reservation" })
public class FlashSaleOrderEntity {

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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private FlashSaleReservationEntity reservation;

    // ==================== ORDER DETAILS ====================

    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "discount_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    // ==================== STATUS ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private FlashSaleOrderStatus status = FlashSaleOrderStatus.PENDING;

    // ==================== PAYMENT INFO ====================

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "payment_deadline")
    private OffsetDateTime paymentDeadline;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    // ==================== SHIPPING INFO ====================

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "shipping_phone", length = 20)
    private String shippingPhone;

    @Column(name = "shipping_name", length = 100)
    private String shippingName;

    // ==================== NOTES ====================

    @Column(name = "customer_note", columnDefinition = "TEXT")
    private String customerNote;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    // ==================== METADATA ====================

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ==================== COMPUTED METHODS ====================

    /**
     * Check if order is expired (past payment deadline and still pending)
     */
    public boolean isExpired() {
        return status == FlashSaleOrderStatus.PENDING
                && paymentDeadline != null
                && OffsetDateTime.now().isAfter(paymentDeadline);
    }

    /**
     * Check if order can be paid
     */
    public boolean canBePaid() {
        return status == FlashSaleOrderStatus.PENDING
                && paymentDeadline != null
                && OffsetDateTime.now().isBefore(paymentDeadline);
    }

    /**
     * Check if order can be cancelled
     */
    public boolean canBeCancelled() {
        return status == FlashSaleOrderStatus.PENDING;
    }

    /**
     * Get saved amount (original price - flash price)
     */
    public BigDecimal getSavedAmount() {
        if (flashSale == null) {
            return BigDecimal.ZERO;
        }
        return flashSale.getOriginalPrice()
                .subtract(unitPrice)
                .multiply(quantity);
    }
}

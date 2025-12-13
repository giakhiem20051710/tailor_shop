package com.example.tailor_shop.modules.promotion.domain;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "promotion_usages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"promotion", "user"})
public class PromotionUsageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private PromotionEntity promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "invoice_id")
    private Long invoiceId;

    @Column(name = "discount_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal discountAmount;

    @Column(name = "original_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal originalAmount;

    @Column(name = "final_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal finalAmount;

    @CreationTimestamp
    @Column(name = "used_at", updatable = false)
    private OffsetDateTime usedAt;
}


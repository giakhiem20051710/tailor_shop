package com.example.tailor_shop.modules.product.domain;

import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Product Configuration Entity - Cấu hình sản phẩm (Mix & Match)
 * Kết hợp: Template + Fabric + Style(s) = Sản phẩm cuối cùng
 */
@Entity
@Table(name = "product_configurations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductConfigurationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private ProductTemplateEntity template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fabric_id", nullable = false)
    private FabricEntity fabric;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "style_id")
    private StyleEntity style; // Kiểu cổ, tay, túi...

    @Column(name = "generated_image", length = 500)
    private String generatedImage; // Ảnh được tạo từ AI (Template + Fabric texture)

    @Column(name = "base_price", precision = 14, scale = 2)
    private BigDecimal basePrice; // Giá cơ bản (Template + Fabric + Style)

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}


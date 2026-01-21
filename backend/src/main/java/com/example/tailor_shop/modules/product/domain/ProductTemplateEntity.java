package com.example.tailor_shop.modules.product.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

/**
 * Product Template Entity - Mẫu cơ bản (Áo sơ mi, Quần tây, Vest...)
 * Đây là "khung" để khách chọn vải và kiểu dáng
 */
@Entity
@Table(name = "product_templates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductTemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name; // VD: "Áo sơ mi", "Quần tây", "Vest"

    @Column(name = "slug", length = 150)
    private String slug;

    @Column(name = "category", length = 80)
    private String category; // VD: "shirt", "pants", "suit", "jacket"

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_image", length = 500)
    private String baseImage; // Ảnh mẫu cơ bản (có thể dùng AI generate)

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

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


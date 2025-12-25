package com.example.tailor_shop.modules.product.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_key", nullable = false, unique = true, length = 100)
    private String key;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "slug", length = 200)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "tag", length = 100)
    private String tag;

    @Column(name = "price", precision = 14, scale = 2)
    private BigDecimal price;

    @Column(name = "price_range", length = 100)
    private String priceRange;

    @Column(name = "image", length = 500)
    private String image;

    @Column(name = "gallery", columnDefinition = "JSON")
    private String gallery;

    @Column(name = "occasion", length = 80)
    private String occasion;

    @Column(name = "category", length = 80)
    private String category;

    @Column(name = "budget", length = 50)
    private String budget;

    @Column(name = "product_type", length = 50)
    private String type;

    @Column(name = "rating", precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "sold", nullable = false)
    @Builder.Default
    private Integer sold = 0;

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


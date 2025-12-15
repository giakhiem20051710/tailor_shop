package com.example.tailor_shop.modules.fabric.domain;

import com.example.tailor_shop.modules.user.domain.UserEntity;
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
import java.util.ArrayList;
import java.util.List;

/**
 * Fabric Entity - Quản lý vải (giống Shopee)
 */
@Entity
@Table(name = "fabrics")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"createdBy", "inventory", "holdRequests"})
public class FabricEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "slug", length = 255)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 100)
    private FabricCategory category;

    @Column(name = "material", length = 100)
    private String material;

    @Column(name = "color", length = 100)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "pattern", length = 100)
    private FabricPattern pattern;

    @Column(name = "width", precision = 5, scale = 2)
    private BigDecimal width;

    @Column(name = "weight", precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "price_per_meter", precision = 14, scale = 2)
    private BigDecimal pricePerMeter;

    @Column(name = "image", length = 500)
    private String image;

    @Column(name = "gallery", columnDefinition = "JSON")
    private String gallery; // Store as JSON string

    @Column(name = "origin", length = 100)
    private String origin;

    @Column(name = "care_instructions", columnDefinition = "TEXT")
    private String careInstructions;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @OneToMany(mappedBy = "fabric", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FabricInventoryEntity> inventory = new ArrayList<>();

    @OneToMany(mappedBy = "fabric", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FabricHoldRequestEntity> holdRequests = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}


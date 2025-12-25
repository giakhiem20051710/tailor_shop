package com.example.tailor_shop.modules.product.domain;

import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Image Asset Entity - Quản lý metadata của ảnh trên S3
 * Dùng để phân loại và filter ảnh khi upload hàng loạt
 */
@Entity
@Table(name = "image_assets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageAssetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "s3_key", nullable = false, length = 255)
    private String s3Key; // "templates/ao-dai-do-1.jpg"

    @Column(name = "url", length = 500)
    private String url; // full S3 URL

    @Column(name = "category", nullable = false, length = 50)
    private String category; // "template", "fabric", "style"

    @Column(name = "type", nullable = false, length = 50)
    private String type; // "ao_dai", "quan_tay", "vest", ...

    @Column(name = "gender", length = 10)
    @Builder.Default
    private String gender = "unisex"; // "male", "female", "unisex"

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "JSON")
    private List<String> tags; // ["traditional", "red", "tet"]

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_template_id")
    private ProductTemplateEntity productTemplate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fabric_id")
    private FabricEntity fabric;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "style_id")
    private StyleEntity style;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}


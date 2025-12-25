package com.example.tailor_shop.modules.product.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Entity để store checksums của images đã upload (cho de-duplication)
 */
@Entity
@Table(name = "image_checksums")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageChecksumEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "checksum", unique = true, nullable = false, length = 64)
    private String checksum; // MD5 or SHA256

    @Column(name = "image_asset_id")
    private Long imageAssetId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "s3_url", length = 500)
    private String s3Url;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}


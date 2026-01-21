package com.example.tailor_shop.modules.product.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Entity để track từng file trong bulk upload job
 */
@Entity
@Table(name = "bulk_upload_job_files")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUploadJobFileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false, length = 36)
    private String jobId; // FK to bulk_upload_jobs.job_id

    @Column(name = "s3_url", nullable = false, length = 500)
    private String s3Url;

    @Column(name = "s3_key", nullable = false, length = 255)
    private String s3Key;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "checksum", length = 64)
    private String checksum; // MD5 or SHA256

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FileStatus status = FileStatus.PENDING; // PENDING, SUCCESS, FAILED

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "image_asset_id")
    private Long imageAssetId;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public enum FileStatus {
        PENDING,  // Waiting to be processed
        SUCCESS,  // Successfully processed
        FAILED    // Failed to process
    }
}


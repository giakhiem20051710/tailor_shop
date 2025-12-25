package com.example.tailor_shop.modules.product.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Entity để track bulk upload jobs
 */
@Entity
@Table(name = "bulk_upload_jobs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUploadJobEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", unique = true, nullable = false, length = 36)
    private String jobId; // UUID

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private JobStatus status; // PENDING, READY, PROCESSING, COMPLETED, FAILED, CANCELLED

    @Column(name = "total_files", nullable = false)
    private Integer totalFiles;

    @Column(name = "processed_files", nullable = false)
    @Builder.Default
    private Integer processedFiles = 0;

    @Column(name = "success_count", nullable = false)
    @Builder.Default
    private Integer successCount = 0;

    @Column(name = "failed_count", nullable = false)
    @Builder.Default
    private Integer failedCount = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage; // Nếu failed

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt; // Cleanup orphaned jobs after 24h

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (expiresAt == null) {
            expiresAt = OffsetDateTime.now().plusHours(24); // Default 24h expiration
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public enum JobStatus {
        PENDING,    // Job created, waiting for files to be uploaded
        READY,      // Files uploaded, ready to process
        PROCESSING, // Currently processing
        COMPLETED,  // All files processed successfully
        FAILED,     // Job failed
        CANCELLED   // Job cancelled or expired
    }
}


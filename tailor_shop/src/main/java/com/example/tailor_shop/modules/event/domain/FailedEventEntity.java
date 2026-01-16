package com.example.tailor_shop.modules.event.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity to store failed events for retry processing (Dead-Letter Queue).
 * 
 * When an event handler fails after max retries, the event is stored here
 * for manual review or scheduled retry.
 */
@Entity
@Table(name = "failed_events", indexes = {
        @Index(name = "idx_failed_events_status", columnList = "status"),
        @Index(name = "idx_failed_events_event_type", columnList = "eventType"),
        @Index(name = "idx_failed_events_next_retry", columnList = "nextRetryAt")
})
@Getter
@Setter
@NoArgsConstructor
public class FailedEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique correlation ID for tracing across services.
     */
    @Column(nullable = false, length = 100)
    private String correlationId;

    /**
     * Type of event (e.g., "OrderCreatedEvent", "FlashSalePurchaseEvent").
     */
    @Column(nullable = false, length = 100)
    private String eventType;

    /**
     * JSON serialized event payload.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String eventPayload;

    /**
     * Handler class that failed to process the event.
     */
    @Column(nullable = false, length = 255)
    private String handlerClass;

    /**
     * Handler method that failed.
     */
    @Column(nullable = false, length = 100)
    private String handlerMethod;

    /**
     * Error message from the last failure.
     */
    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * Full stack trace from the last failure.
     */
    @Column(columnDefinition = "TEXT")
    private String stackTrace;

    /**
     * Number of retry attempts made.
     */
    @Column(nullable = false)
    private Integer retryCount = 0;

    /**
     * Maximum retry attempts allowed.
     */
    @Column(nullable = false)
    private Integer maxRetries = 3;

    /**
     * Current status of the failed event.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FailedEventStatus status = FailedEventStatus.PENDING;

    /**
     * When to attempt the next retry.
     */
    private LocalDateTime nextRetryAt;

    /**
     * When the event was first created (first failure).
     */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Last update timestamp.
     */
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * When the event was successfully processed (if retried).
     */
    private LocalDateTime processedAt;

    /**
     * Notes from manual review (if any).
     */
    @Column(columnDefinition = "TEXT")
    private String reviewNotes;

    public enum FailedEventStatus {
        PENDING, // Waiting for retry
        RETRYING, // Currently being retried
        PROCESSED, // Successfully processed after retry
        DEAD, // Max retries exceeded, requires manual intervention
        SKIPPED // Manually marked as skip
    }

    /**
     * Calculate next retry time using exponential backoff.
     * Retry delays: 1min, 5min, 15min, 30min, 1hr, 2hr...
     */
    public void scheduleNextRetry() {
        this.retryCount++;
        if (this.retryCount > this.maxRetries) {
            this.status = FailedEventStatus.DEAD;
            this.nextRetryAt = null;
        } else {
            // Exponential backoff: 1, 5, 15, 30, 60 minutes
            int[] delays = { 1, 5, 15, 30, 60, 120 };
            int delayMinutes = delays[Math.min(this.retryCount - 1, delays.length - 1)];
            this.nextRetryAt = LocalDateTime.now().plusMinutes(delayMinutes);
            this.status = FailedEventStatus.PENDING;
        }
    }

    /**
     * Mark as successfully processed.
     */
    public void markProcessed() {
        this.status = FailedEventStatus.PROCESSED;
        this.processedAt = LocalDateTime.now();
        this.nextRetryAt = null;
    }

    /**
     * Mark as dead (no more retries).
     */
    public void markDead(String notes) {
        this.status = FailedEventStatus.DEAD;
        this.nextRetryAt = null;
        this.reviewNotes = notes;
    }
}

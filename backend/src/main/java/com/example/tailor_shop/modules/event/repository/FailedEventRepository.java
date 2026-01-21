package com.example.tailor_shop.modules.event.repository;

import com.example.tailor_shop.modules.event.domain.FailedEventEntity;
import com.example.tailor_shop.modules.event.domain.FailedEventEntity.FailedEventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for failed events (Dead-Letter Queue).
 */
@Repository
public interface FailedEventRepository extends JpaRepository<FailedEventEntity, Long> {

    /**
     * Find events that are ready for retry.
     */
    @Query("SELECT f FROM FailedEventEntity f WHERE f.status = 'PENDING' AND f.nextRetryAt <= :now ORDER BY f.nextRetryAt ASC")
    List<FailedEventEntity> findEventsReadyForRetry(@Param("now") LocalDateTime now);

    /**
     * Find events by status.
     */
    Page<FailedEventEntity> findByStatus(FailedEventStatus status, Pageable pageable);

    /**
     * Find events by event type.
     */
    Page<FailedEventEntity> findByEventType(String eventType, Pageable pageable);

    /**
     * Find dead events (require manual intervention).
     */
    List<FailedEventEntity> findByStatusOrderByCreatedAtDesc(FailedEventStatus status);

    /**
     * Count events by status.
     */
    long countByStatus(FailedEventStatus status);

    /**
     * Count events by event type.
     */
    long countByEventType(String eventType);

    /**
     * Delete old processed events (cleanup).
     */
    @Modifying
    @Query("DELETE FROM FailedEventEntity f WHERE f.status = 'PROCESSED' AND f.processedAt < :before")
    int deleteProcessedEventsBefore(@Param("before") LocalDateTime before);

    /**
     * Find by correlation ID.
     */
    List<FailedEventEntity> findByCorrelationId(String correlationId);

    /**
     * Lock events for retry (prevent concurrent processing).
     */
    @Modifying
    @Query("UPDATE FailedEventEntity f SET f.status = 'RETRYING' WHERE f.id = :id AND f.status = 'PENDING'")
    int lockForRetry(@Param("id") Long id);
}

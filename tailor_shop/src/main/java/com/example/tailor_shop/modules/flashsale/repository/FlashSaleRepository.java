package com.example.tailor_shop.modules.flashsale.repository;

import com.example.tailor_shop.modules.flashsale.domain.FlashSaleEntity;
import com.example.tailor_shop.modules.flashsale.domain.FlashSaleStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Flash Sale Repository với Pessimistic Locking cho purchase
 */
@Repository
public interface FlashSaleRepository extends JpaRepository<FlashSaleEntity, Long> {

    // ==================== BASIC QUERIES ====================

    Optional<FlashSaleEntity> findByIdAndStatusNot(Long id, FlashSaleStatus status);

    // ==================== LOCKING QUERIES (Critical for concurrency)
    // ====================

    /**
     * Find by ID with pessimistic write lock - CRITICAL for purchase
     * This prevents multiple transactions from updating stock simultaneously
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM FlashSaleEntity f WHERE f.id = :id")
    Optional<FlashSaleEntity> findByIdForUpdate(@Param("id") Long id);

    // ==================== LIST QUERIES ====================

    /**
     * Find active flash sales (currently running)
     */
    @Query("SELECT f FROM FlashSaleEntity f WHERE f.status = :status " +
            "AND f.startTime <= :now AND f.endTime > :now " +
            "ORDER BY f.priority DESC, f.startTime ASC")
    List<FlashSaleEntity> findActive(
            @Param("status") FlashSaleStatus status,
            @Param("now") OffsetDateTime now);

    /**
     * Find upcoming flash sales
     */
    @Query("SELECT f FROM FlashSaleEntity f WHERE f.status = :status " +
            "AND f.startTime > :now " +
            "ORDER BY f.startTime ASC")
    List<FlashSaleEntity> findUpcoming(
            @Param("status") FlashSaleStatus status,
            @Param("now") OffsetDateTime now);

    /**
     * Find featured flash sales
     */
    @Query("SELECT f FROM FlashSaleEntity f WHERE f.status = :status " +
            "AND f.isFeatured = true " +
            "AND f.startTime <= :now AND f.endTime > :now " +
            "ORDER BY f.priority DESC")
    List<FlashSaleEntity> findFeatured(
            @Param("status") FlashSaleStatus status,
            @Param("now") OffsetDateTime now);

    /**
     * Find all with status filter
     */
    Page<FlashSaleEntity> findByStatusIn(List<FlashSaleStatus> statuses, Pageable pageable);

    /**
     * Find by fabric
     */
    List<FlashSaleEntity> findByFabricIdAndStatusIn(Long fabricId, List<FlashSaleStatus> statuses);

    // ==================== STATUS UPDATE QUERIES ====================

    /**
     * Find sales that should be activated (scheduled + past start time)
     */
    @Query("SELECT f FROM FlashSaleEntity f WHERE f.status = 'SCHEDULED' " +
            "AND f.startTime <= :now")
    List<FlashSaleEntity> findSalesToActivate(@Param("now") OffsetDateTime now);

    /**
     * Find sales that should be ended (active + past end time)
     */
    @Query("SELECT f FROM FlashSaleEntity f WHERE f.status = 'ACTIVE' " +
            "AND f.endTime <= :now")
    List<FlashSaleEntity> findSalesToEnd(@Param("now") OffsetDateTime now);

    /**
     * Bulk update status
     */
    @Modifying
    @Query("UPDATE FlashSaleEntity f SET f.status = :newStatus, f.updatedAt = :now " +
            "WHERE f.id IN :ids")
    int updateStatusByIds(
            @Param("ids") List<Long> ids,
            @Param("newStatus") FlashSaleStatus newStatus,
            @Param("now") OffsetDateTime now);

    // ==================== STATISTICS ====================

    /**
     * Count by status
     */
    long countByStatus(FlashSaleStatus status);

    /**
     * Count active sales
     */
    @Query("SELECT COUNT(f) FROM FlashSaleEntity f WHERE f.status = 'ACTIVE' " +
            "AND f.startTime <= :now AND f.endTime > :now")
    long countActive(@Param("now") OffsetDateTime now);
}

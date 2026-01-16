package com.example.tailor_shop.modules.flashsale.repository;

import com.example.tailor_shop.modules.flashsale.domain.FlashSaleReservationEntity;
import com.example.tailor_shop.modules.flashsale.domain.FlashSaleReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Flash Sale Reservation Repository
 */
@Repository
public interface FlashSaleReservationRepository extends JpaRepository<FlashSaleReservationEntity, Long> {

    // ==================== BASIC QUERIES ====================

    Optional<FlashSaleReservationEntity> findByIdAndUserId(Long id, Long userId);

    Optional<FlashSaleReservationEntity> findByIdAndStatus(Long id, FlashSaleReservationStatus status);

    // ==================== ACTIVE RESERVATIONS ====================

    /**
     * Find active reservation by user and flash sale
     */
    Optional<FlashSaleReservationEntity> findByUserIdAndFlashSaleIdAndStatus(
            Long userId,
            Long flashSaleId,
            FlashSaleReservationStatus status);

    /**
     * Find all active reservations by flash sale
     */
    List<FlashSaleReservationEntity> findByFlashSaleIdAndStatus(
            Long flashSaleId,
            FlashSaleReservationStatus status);

    // ==================== EXPIRY QUERIES ====================

    /**
     * Find expired active reservations
     */
    @Query("SELECT r FROM FlashSaleReservationEntity r " +
            "WHERE r.status = 'ACTIVE' AND r.expiresAt < :now")
    List<FlashSaleReservationEntity> findExpiredReservations(@Param("now") OffsetDateTime now);

    /**
     * Bulk update expired reservations
     */
    @Modifying
    @Query("UPDATE FlashSaleReservationEntity r SET r.status = 'EXPIRED' " +
            "WHERE r.status = 'ACTIVE' AND r.expiresAt < :now")
    int expireReservations(@Param("now") OffsetDateTime now);

    // ==================== STATISTICS ====================

    /**
     * Sum reserved quantity by flash sale
     */
    @Query("SELECT COALESCE(SUM(r.quantity), 0) FROM FlashSaleReservationEntity r " +
            "WHERE r.flashSale.id = :flashSaleId AND r.status = 'ACTIVE'")
    BigDecimal sumActiveReservedQuantity(@Param("flashSaleId") Long flashSaleId);

    /**
     * Count active reservations by flash sale
     */
    long countByFlashSaleIdAndStatus(Long flashSaleId, FlashSaleReservationStatus status);
}

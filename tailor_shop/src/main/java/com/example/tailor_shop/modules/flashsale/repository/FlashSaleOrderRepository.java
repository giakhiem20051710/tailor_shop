package com.example.tailor_shop.modules.flashsale.repository;

import com.example.tailor_shop.modules.flashsale.domain.FlashSaleOrderEntity;
import com.example.tailor_shop.modules.flashsale.domain.FlashSaleOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Flash Sale Order Repository
 */
@Repository
public interface FlashSaleOrderRepository extends JpaRepository<FlashSaleOrderEntity, Long> {

    // ==================== BASIC QUERIES ====================

    Optional<FlashSaleOrderEntity> findByOrderCode(String orderCode);

    Optional<FlashSaleOrderEntity> findByIdAndUserId(Long id, Long userId);

    // ==================== USER QUERIES ====================

    /**
     * Find orders by user
     */
    Page<FlashSaleOrderEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find orders by user and flash sale
     */
    List<FlashSaleOrderEntity> findByUserIdAndFlashSaleId(Long userId, Long flashSaleId);

    /**
     * Find orders by user and status
     */
    Page<FlashSaleOrderEntity> findByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId,
            FlashSaleOrderStatus status,
            Pageable pageable);

    // ==================== FLASH SALE QUERIES ====================

    /**
     * Find orders by flash sale
     */
    Page<FlashSaleOrderEntity> findByFlashSaleIdOrderByCreatedAtDesc(Long flashSaleId, Pageable pageable);

    /**
     * Count orders by flash sale
     */
    long countByFlashSaleId(Long flashSaleId);

    /**
     * Count successful orders by flash sale
     */
    long countByFlashSaleIdAndStatus(Long flashSaleId, FlashSaleOrderStatus status);

    // ==================== EXPIRY QUERIES ====================

    /**
     * Find expired pending orders
     */
    @Query("SELECT o FROM FlashSaleOrderEntity o WHERE o.status = 'PENDING' " +
            "AND o.paymentDeadline < :now")
    List<FlashSaleOrderEntity> findExpiredPendingOrders(@Param("now") OffsetDateTime now);

    /**
     * Bulk update expired orders
     */
    @Modifying
    @Query("UPDATE FlashSaleOrderEntity o SET o.status = 'EXPIRED', o.updatedAt = :now " +
            "WHERE o.status = 'PENDING' AND o.paymentDeadline < :now")
    int expirePendingOrders(@Param("now") OffsetDateTime now);

    // ==================== STATISTICS ====================

    /**
     * Sum quantity by user and flash sale (for limit check)
     */
    @Query("SELECT COALESCE(SUM(o.quantity), 0) FROM FlashSaleOrderEntity o " +
            "WHERE o.user.id = :userId AND o.flashSale.id = :flashSaleId " +
            "AND o.status NOT IN ('CANCELLED', 'EXPIRED', 'REFUNDED')")
    java.math.BigDecimal sumQuantityByUserAndFlashSale(
            @Param("userId") Long userId,
            @Param("flashSaleId") Long flashSaleId);
}

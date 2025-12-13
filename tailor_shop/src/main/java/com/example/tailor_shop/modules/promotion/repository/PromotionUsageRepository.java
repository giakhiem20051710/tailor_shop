package com.example.tailor_shop.modules.promotion.repository;

import com.example.tailor_shop.modules.promotion.domain.PromotionUsageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PromotionUsageRepository extends JpaRepository<PromotionUsageEntity, Long> {

    @Query("SELECT pu FROM PromotionUsageEntity pu WHERE pu.promotion.id = :promotionId " +
            "AND pu.user.id = :userId ORDER BY pu.usedAt DESC")
    Page<PromotionUsageEntity> findByPromotionIdAndUserId(
            @Param("promotionId") Long promotionId,
            @Param("userId") Long userId,
            Pageable pageable);

    @Query("SELECT pu FROM PromotionUsageEntity pu WHERE pu.user.id = :userId " +
            "ORDER BY pu.usedAt DESC")
    Page<PromotionUsageEntity> findByUserId(@Param("userId") Long userId, Pageable pageable);

    Optional<PromotionUsageEntity> findByPromotionIdAndOrderId(Long promotionId, Long orderId);

    Optional<PromotionUsageEntity> findByPromotionIdAndInvoiceId(Long promotionId, Long invoiceId);
}


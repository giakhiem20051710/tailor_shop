package com.example.tailor_shop.modules.promotion.repository;

import com.example.tailor_shop.modules.promotion.domain.PromotionEntity;
import com.example.tailor_shop.modules.promotion.domain.PromotionStatus;
import com.example.tailor_shop.modules.promotion.domain.PromotionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<PromotionEntity, Long> {

    Optional<PromotionEntity> findByCodeAndIsDeletedFalse(String code);

    @Query("SELECT p FROM PromotionEntity p WHERE p.isDeleted = false " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:type IS NULL OR p.type = :type) " +
            "AND (:keyword IS NULL OR p.name LIKE %:keyword% OR p.code LIKE %:keyword%) " +
            "AND (:isPublic IS NULL OR p.isPublic = :isPublic)")
    Page<PromotionEntity> searchPromotions(
            @Param("status") PromotionStatus status,
            @Param("type") PromotionType type,
            @Param("keyword") String keyword,
            @Param("isPublic") Boolean isPublic,
            Pageable pageable);

    @Query("SELECT p FROM PromotionEntity p WHERE p.isDeleted = false " +
            "AND p.status = 'ACTIVE' " +
            "AND p.isPublic = true " +
            "AND p.startDate <= :date " +
            "AND p.endDate >= :date " +
            "ORDER BY p.priority DESC, p.createdAt DESC")
    Page<PromotionEntity> findActivePublicPromotions(@Param("date") LocalDate date, Pageable pageable);

    @Query("SELECT COUNT(pu) FROM PromotionUsageEntity pu WHERE pu.promotion.id = :promotionId")
    Long countUsagesByPromotionId(@Param("promotionId") Long promotionId);

    @Query("SELECT COUNT(pu) FROM PromotionUsageEntity pu " +
            "WHERE pu.promotion.id = :promotionId AND pu.user.id = :userId")
    Long countUsagesByPromotionIdAndUserId(@Param("promotionId") Long promotionId, @Param("userId") Long userId);
}


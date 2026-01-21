package com.example.tailor_shop.modules.flashsale.repository;

import com.example.tailor_shop.modules.flashsale.domain.FlashSaleUserStatsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Flash Sale User Stats Repository
 */
@Repository
public interface FlashSaleUserStatsRepository extends JpaRepository<FlashSaleUserStatsEntity, Long> {

    /**
     * Find stats by user and flash sale
     */
    Optional<FlashSaleUserStatsEntity> findByUserIdAndFlashSaleId(Long userId, Long flashSaleId);
}

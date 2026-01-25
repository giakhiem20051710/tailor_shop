package com.example.tailor_shop.modules.gamification.repository;

import com.example.tailor_shop.modules.gamification.domain.PointsTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PointsTransactionRepository extends JpaRepository<PointsTransaction, Long> {

    Page<PointsTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Count points earned today (for rate limiting)
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PointsTransaction t " +
            "WHERE t.userId = :userId AND t.transactionType = 'EARN' " +
            "AND t.createdAt >= :startOfDay")
    int sumPointsEarnedToday(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay);

    // Find expiring points
    @Query("SELECT t FROM PointsTransaction t " +
            "WHERE t.transactionType = 'EARN' AND t.isExpired = false " +
            "AND t.expiresAt IS NOT NULL AND t.expiresAt <= :expireDate")
    List<PointsTransaction> findExpiringPoints(@Param("expireDate") LocalDateTime expireDate);

    // Check if already earned from source (anti-fraud for reviews)
    boolean existsByUserIdAndSourceAndSourceId(Long userId, PointsTransaction.PointsSource source, Long sourceId);
}

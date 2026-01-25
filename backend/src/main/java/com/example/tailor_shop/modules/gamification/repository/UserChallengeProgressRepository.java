package com.example.tailor_shop.modules.gamification.repository;

import com.example.tailor_shop.modules.gamification.domain.UserChallengeProgressEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for UserChallengeProgressEntity
 */
@Repository
public interface UserChallengeProgressRepository extends JpaRepository<UserChallengeProgressEntity, Long> {

    /**
     * Find progress by user and challenge
     */
    Optional<UserChallengeProgressEntity> findByUserIdAndChallengeId(Long userId, Long challengeId);

    /**
     * Find all progress for a user
     */
    List<UserChallengeProgressEntity> findByUserId(Long userId);

    /**
     * Find all progress for a challenge
     */
    List<UserChallengeProgressEntity> findByChallengeId(Long challengeId);

    /**
     * Find completed but not claimed progress for a user
     */
    @Query("SELECT p FROM UserChallengeProgressEntity p " +
            "WHERE p.user.id = :userId " +
            "AND p.isCompleted = true " +
            "AND p.rewardClaimed = false")
    List<UserChallengeProgressEntity> findClaimableByyUserId(@Param("userId") Long userId);

    /**
     * Count completed challenges for a user in a season
     */
    @Query("SELECT COUNT(p) FROM UserChallengeProgressEntity p " +
            "WHERE p.user.id = :userId " +
            "AND p.challenge.season = :season " +
            "AND p.challenge.year = :year " +
            "AND p.isCompleted = true")
    Integer countCompletedBySeason(
            @Param("userId") Long userId,
            @Param("season") com.example.tailor_shop.modules.gamification.domain.Season season,
            @Param("year") Integer year);

    /**
     * Find progress for multiple challenges
     */
    @Query("SELECT p FROM UserChallengeProgressEntity p " +
            "WHERE p.user.id = :userId " +
            "AND p.challenge.id IN :challengeIds")
    List<UserChallengeProgressEntity> findByUserIdAndChallengeIds(
            @Param("userId") Long userId,
            @Param("challengeIds") List<Long> challengeIds);

    /**
     * Check if user has completed a challenge
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
            "FROM UserChallengeProgressEntity p " +
            "WHERE p.user.id = :userId " +
            "AND p.challenge.id = :challengeId " +
            "AND p.isCompleted = true")
    boolean hasUserCompletedChallenge(
            @Param("userId") Long userId,
            @Param("challengeId") Long challengeId);

    /**
     * Get or create progress (for atomic operations)
     */
    @Modifying
    @Query(value = "INSERT INTO user_challenge_progress (user_id, challenge_id, current_progress, is_completed, reward_claimed, created_at, updated_at) "
            +
            "VALUES (:userId, :challengeId, 0, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
            "ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP", nativeQuery = true)
    void createIfNotExists(@Param("userId") Long userId, @Param("challengeId") Long challengeId);

    /**
     * Increment progress atomically
     */
    @Modifying
    @Query("UPDATE UserChallengeProgressEntity p " +
            "SET p.currentProgress = p.currentProgress + :amount, " +
            "    p.updatedAt = CURRENT_TIMESTAMP " +
            "WHERE p.user.id = :userId AND p.challenge.id = :challengeId")
    int incrementProgress(
            @Param("userId") Long userId,
            @Param("challengeId") Long challengeId,
            @Param("amount") Long amount);
}

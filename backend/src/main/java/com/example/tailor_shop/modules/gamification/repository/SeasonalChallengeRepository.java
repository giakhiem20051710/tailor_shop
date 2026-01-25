package com.example.tailor_shop.modules.gamification.repository;

import com.example.tailor_shop.modules.gamification.domain.Season;
import com.example.tailor_shop.modules.gamification.domain.SeasonalChallengeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for SeasonalChallengeEntity
 */
@Repository
public interface SeasonalChallengeRepository extends JpaRepository<SeasonalChallengeEntity, Long> {

    /**
     * Find challenge by code
     */
    Optional<SeasonalChallengeEntity> findByCode(String code);

    /**
     * Find active challenges within date range
     */
    @Query("SELECT c FROM SeasonalChallengeEntity c " +
            "WHERE c.isActive = true " +
            "AND c.startDate <= :now " +
            "AND c.endDate >= :now " +
            "ORDER BY c.displayOrder ASC")
    List<SeasonalChallengeEntity> findActiveChallenges(@Param("now") OffsetDateTime now);

    /**
     * Find challenges by season and year
     */
    @Query("SELECT c FROM SeasonalChallengeEntity c " +
            "WHERE c.season = :season " +
            "AND c.year = :year " +
            "AND c.isActive = true " +
            "AND c.parentChallenge IS NULL " +
            "ORDER BY c.displayOrder ASC")
    List<SeasonalChallengeEntity> findBySeasonAndYear(
            @Param("season") Season season,
            @Param("year") Integer year);

    /**
     * Find currently active challenges (not grand prizes)
     */
    @Query("SELECT c FROM SeasonalChallengeEntity c " +
            "WHERE c.isActive = true " +
            "AND c.startDate <= :now " +
            "AND c.endDate >= :now " +
            "AND c.isGrandPrize = false " +
            "ORDER BY c.displayOrder ASC")
    List<SeasonalChallengeEntity> findCurrentlyActiveChallenges(@Param("now") OffsetDateTime now);

    /**
     * Find grand prizes for a season
     */
    @Query("SELECT c FROM SeasonalChallengeEntity c " +
            "WHERE c.season = :season " +
            "AND c.year = :year " +
            "AND c.isGrandPrize = true " +
            "AND c.isActive = true")
    List<SeasonalChallengeEntity> findGrandPrizes(
            @Param("season") Season season,
            @Param("year") Integer year);

    /**
     * Find sub-challenges of a parent challenge
     */
    @Query("SELECT c FROM SeasonalChallengeEntity c " +
            "WHERE c.parentChallenge.id = :parentId " +
            "ORDER BY c.displayOrder ASC")
    List<SeasonalChallengeEntity> findSubChallenges(@Param("parentId") Long parentId);

    /**
     * Find upcoming challenges
     */
    @Query("SELECT c FROM SeasonalChallengeEntity c " +
            "WHERE c.isActive = true " +
            "AND c.startDate > :now " +
            "ORDER BY c.startDate ASC")
    List<SeasonalChallengeEntity> findUpcomingChallenges(@Param("now") OffsetDateTime now);

    /**
     * Find distinct active seasons
     */
    @Query("SELECT DISTINCT c.season, c.year FROM SeasonalChallengeEntity c " +
            "WHERE c.isActive = true " +
            "AND c.startDate <= :now " +
            "AND c.endDate >= :now")
    List<Object[]> findActiveSeasons(@Param("now") OffsetDateTime now);
}

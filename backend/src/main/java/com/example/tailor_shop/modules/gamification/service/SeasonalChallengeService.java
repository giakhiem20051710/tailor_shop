package com.example.tailor_shop.modules.gamification.service;

import com.example.tailor_shop.modules.gamification.domain.Season;
import com.example.tailor_shop.modules.gamification.dto.*;

import java.util.List;

/**
 * Seasonal Challenge Service Interface
 */
public interface SeasonalChallengeService {

    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Get all currently active challenges
     */
    List<ChallengeResponse> getActiveChallenges();

    /**
     * Get challenges for a specific season
     */
    SeasonChallengesResponse getChallengesBySeason(Season season, Integer year);

    /**
     * Get challenge detail by ID
     */
    ChallengeResponse getChallengeById(Long challengeId);

    /**
     * Get challenge detail by code
     */
    ChallengeResponse getChallengeByCode(String code);

    /**
     * Get upcoming challenges
     */
    List<ChallengeResponse> getUpcomingChallenges();

    // ==================== USER PROGRESS ENDPOINTS ====================

    /**
     * Get user's progress for all active challenges
     */
    List<ChallengeResponse> getMyProgress(Long userId);

    /**
     * Get user's progress for a specific challenge
     */
    UserProgressResponse getMyProgressForChallenge(Long userId, Long challengeId);

    /**
     * Get claimable rewards for user
     */
    List<ChallengeResponse> getClaimableRewards(Long userId);

    /**
     * Claim reward for a completed challenge
     */
    ClaimRewardResponse claimReward(Long userId, Long challengeId);

    // ==================== PROGRESS TRACKING ====================

    /**
     * Update progress for order-related challenges
     * Called when an order is completed
     */
    void trackOrderProgress(Long userId, Long orderValue, String productCategory);

    /**
     * Update progress for review-related challenges
     * Called when a review is submitted
     */
    void trackReviewProgress(Long userId);

    /**
     * Update progress for referral-related challenges
     * Called when a referral is successful
     */
    void trackReferralProgress(Long userId);

    /**
     * Manually increment progress (for admin/testing)
     */
    void incrementProgress(Long userId, Long challengeId, Long amount);

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all challenges (for admin)
     */
    List<ChallengeResponse> getAllChallenges();

    /**
     * Create a new challenge
     */
    ChallengeResponse createChallenge(CreateChallengeRequest request, Long createdByUserId);

    /**
     * Update a challenge
     */
    ChallengeResponse updateChallenge(Long challengeId, UpdateChallengeRequest request);

    /**
     * Deactivate a challenge
     */
    void deactivateChallenge(Long challengeId);
}

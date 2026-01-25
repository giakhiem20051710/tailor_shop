package com.example.tailor_shop.modules.gamification.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.modules.gamification.domain.Season;
import com.example.tailor_shop.modules.gamification.dto.*;
import com.example.tailor_shop.modules.gamification.service.SeasonalChallengeService;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Seasonal Challenge Controller
 * REST API endpoints for gamification challenges
 */
@RestController
@RequestMapping("/api/v1/gamification/challenges")
@RequiredArgsConstructor
@Slf4j
public class SeasonalChallengeController {

    private final SeasonalChallengeService challengeService;
    private final UserRepository userRepository;

    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Get all currently active challenges
     */
    @GetMapping("/active")
    public ResponseEntity<CommonResponse<List<ChallengeResponse>>> getActiveChallenges() {
        log.debug("API: Get active challenges");
        List<ChallengeResponse> challenges = challengeService.getActiveChallenges();
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), challenges));
    }

    /**
     * Get challenges by season and year
     */
    @GetMapping("/season/{season}")
    public ResponseEntity<CommonResponse<SeasonChallengesResponse>> getChallengesBySeason(
            @PathVariable Season season,
            @RequestParam(defaultValue = "2026") Integer year) {
        log.debug("API: Get challenges for season {} year {}", season, year);
        SeasonChallengesResponse response = challengeService.getChallengesBySeason(season, year);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    /**
     * Get challenge detail by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<ChallengeResponse>> getChallengeById(@PathVariable Long id) {
        log.debug("API: Get challenge by ID {}", id);
        ChallengeResponse response = challengeService.getChallengeById(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    /**
     * Get challenge detail by code
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<CommonResponse<ChallengeResponse>> getChallengeByCode(@PathVariable String code) {
        log.debug("API: Get challenge by code {}", code);
        ChallengeResponse response = challengeService.getChallengeByCode(code);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    /**
     * Get upcoming challenges
     */
    @GetMapping("/upcoming")
    public ResponseEntity<CommonResponse<List<ChallengeResponse>>> getUpcomingChallenges() {
        log.debug("API: Get upcoming challenges");
        List<ChallengeResponse> challenges = challengeService.getUpcomingChallenges();
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), challenges));
    }

    // ==================== USER PROGRESS ENDPOINTS ====================

    /**
     * Get my progress for all active challenges
     */
    @GetMapping("/my-progress")
    public ResponseEntity<CommonResponse<List<ChallengeResponse>>> getMyProgress(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        log.debug("API: Get progress for user {}", userId);
        List<ChallengeResponse> progress = challengeService.getMyProgress(userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), progress));
    }

    /**
     * Get my progress for a specific challenge
     */
    @GetMapping("/{challengeId}/my-progress")
    public ResponseEntity<CommonResponse<UserProgressResponse>> getMyProgressForChallenge(
            @PathVariable Long challengeId,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        log.debug("API: Get progress for user {} challenge {}", userId, challengeId);
        UserProgressResponse progress = challengeService.getMyProgressForChallenge(userId, challengeId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), progress));
    }

    /**
     * Get claimable rewards
     */
    @GetMapping("/claimable")
    public ResponseEntity<CommonResponse<List<ChallengeResponse>>> getClaimableRewards(
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        log.debug("API: Get claimable rewards for user {}", userId);
        List<ChallengeResponse> claimable = challengeService.getClaimableRewards(userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), claimable));
    }

    /**
     * Claim reward for a completed challenge
     */
    @PostMapping("/{challengeId}/claim")
    public ResponseEntity<CommonResponse<ClaimRewardResponse>> claimReward(
            @PathVariable Long challengeId,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        log.info("API: User {} claiming reward for challenge {}", userId, challengeId);
        ClaimRewardResponse response = challengeService.claimReward(userId, challengeId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all challenges (admin)
     */
    @GetMapping("/admin/all")
    public ResponseEntity<CommonResponse<List<ChallengeResponse>>> getAllChallenges() {
        log.debug("API: Admin get all challenges");
        List<ChallengeResponse> challenges = challengeService.getAllChallenges();
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), challenges));
    }

    /**
     * Create a new challenge (admin)
     */
    @PostMapping("/admin")
    public ResponseEntity<CommonResponse<ChallengeResponse>> createChallenge(
            @Valid @RequestBody CreateChallengeRequest request,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        log.info("API: Admin creating challenge: {}", request.getCode());
        ChallengeResponse response = challengeService.createChallenge(request, userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    /**
     * Update a challenge (admin)
     */
    @PutMapping("/admin/{id}")
    public ResponseEntity<CommonResponse<ChallengeResponse>> updateChallenge(
            @PathVariable Long id,
            @Valid @RequestBody UpdateChallengeRequest request) {
        log.info("API: Admin updating challenge: {}", id);
        ChallengeResponse response = challengeService.updateChallenge(id, request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    /**
     * Deactivate a challenge (admin)
     */
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<CommonResponse<Void>> deactivateChallenge(@PathVariable Long id) {
        log.info("API: Admin deactivating challenge: {}", id);
        challengeService.deactivateChallenge(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    // ==================== HELPERS ====================

    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("User not authenticated");
        }
        String identifier = authentication.getName();
        // Try to find by username, phone, or email (same as CustomUserDetailsService)
        return userRepository.findByUsernameAndIsDeletedFalse(identifier)
                .or(() -> userRepository.findByPhoneAndIsDeletedFalse(identifier))
                .or(() -> userRepository.findByEmailAndIsDeletedFalse(identifier))
                .orElseThrow(() -> new IllegalStateException("User not found: " + identifier))
                .getId();
    }
}

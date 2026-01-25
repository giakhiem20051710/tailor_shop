package com.example.tailor_shop.modules.gamification.service;

import com.example.tailor_shop.modules.gamification.domain.*;
import com.example.tailor_shop.modules.gamification.dto.*;
import com.example.tailor_shop.modules.gamification.repository.SeasonalChallengeRepository;
import com.example.tailor_shop.modules.gamification.repository.UserChallengeProgressRepository;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Seasonal Challenge Service Implementation
 * Senior-level implementation with proper error handling, transactions, and
 * logging
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SeasonalChallengeServiceImpl implements SeasonalChallengeService {

    private final SeasonalChallengeRepository challengeRepository;
    private final UserChallengeProgressRepository progressRepository;
    private final UserRepository userRepository;

    // ==================== PUBLIC ENDPOINTS ====================

    @Override
    public List<ChallengeResponse> getActiveChallenges() {
        log.debug("Fetching active challenges");
        OffsetDateTime now = OffsetDateTime.now();
        List<SeasonalChallengeEntity> challenges = challengeRepository.findCurrentlyActiveChallenges(now);
        return challenges.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SeasonChallengesResponse getChallengesBySeason(Season season, Integer year) {
        log.debug("Fetching challenges for season: {} year: {}", season, year);

        List<SeasonalChallengeEntity> challenges = challengeRepository.findBySeasonAndYear(season, year);
        List<SeasonalChallengeEntity> grandPrizes = challengeRepository.findGrandPrizes(season, year);

        // Return empty response if no challenges found
        if (challenges.isEmpty()) {
            return SeasonChallengesResponse.builder()
                    .season(season)
                    .seasonDisplayName(season.getDisplayName())
                    .year(year)
                    .seasonCode(season.name() + "_" + year)
                    .startDate(null)
                    .endDate(null)
                    .remainingTimeMillis(0L)
                    .isActive(false)
                    .hasEnded(true)
                    .bannerImage(null)
                    .themeColor(null)
                    .challenges(List.of())
                    .grandPrize(null)
                    .totalChallenges(0)
                    .completedChallenges(0)
                    .claimedRewards(0)
                    .overallProgressPercentage(0)
                    .build();
        }

        SeasonalChallengeEntity firstChallenge = challenges.get(0);
        ChallengeResponse grandPrizeResponse = grandPrizes.isEmpty() ? null : mapToResponse(grandPrizes.get(0));

        return SeasonChallengesResponse.builder()
                .season(season)
                .seasonDisplayName(season.getDisplayName())
                .year(year)
                .seasonCode(season.name() + "_" + year)
                .startDate(firstChallenge.getStartDate())
                .endDate(firstChallenge.getEndDate())
                .remainingTimeMillis(firstChallenge.getRemainingTimeMillis())
                .isActive(firstChallenge.isCurrentlyActive())
                .hasEnded(firstChallenge.hasEnded())
                .bannerImage(firstChallenge.getBannerImage())
                .themeColor(firstChallenge.getThemeColor())
                .challenges(challenges.stream().map(this::mapToResponse).collect(Collectors.toList()))
                .grandPrize(grandPrizeResponse)
                .totalChallenges(challenges.size())
                .completedChallenges(0) // Will be updated if user is authenticated
                .claimedRewards(0)
                .overallProgressPercentage(0)
                .build();
    }

    @Override
    public ChallengeResponse getChallengeById(Long challengeId) {
        log.debug("Fetching challenge by ID: {}", challengeId);
        SeasonalChallengeEntity challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new EntityNotFoundException("Challenge not found: " + challengeId));
        return mapToResponse(challenge);
    }

    @Override
    public ChallengeResponse getChallengeByCode(String code) {
        log.debug("Fetching challenge by code: {}", code);
        SeasonalChallengeEntity challenge = challengeRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Challenge not found: " + code));
        return mapToResponse(challenge);
    }

    @Override
    public List<ChallengeResponse> getUpcomingChallenges() {
        log.debug("Fetching upcoming challenges");
        OffsetDateTime now = OffsetDateTime.now();
        List<SeasonalChallengeEntity> challenges = challengeRepository.findUpcomingChallenges(now);
        return challenges.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ==================== USER PROGRESS ENDPOINTS ====================

    @Override
    public List<ChallengeResponse> getMyProgress(Long userId) {
        log.debug("Fetching progress for user: {}", userId);
        OffsetDateTime now = OffsetDateTime.now();

        List<SeasonalChallengeEntity> activeChallenges = challengeRepository.findCurrentlyActiveChallenges(now);
        List<Long> challengeIds = activeChallenges.stream()
                .map(SeasonalChallengeEntity::getId)
                .collect(Collectors.toList());

        Map<Long, UserChallengeProgressEntity> progressMap = progressRepository
                .findByUserIdAndChallengeIds(userId, challengeIds)
                .stream()
                .collect(Collectors.toMap(
                        p -> p.getChallenge().getId(),
                        p -> p));

        return activeChallenges.stream()
                .map(challenge -> mapToResponseWithProgress(challenge, progressMap.get(challenge.getId())))
                .collect(Collectors.toList());
    }

    @Override
    public UserProgressResponse getMyProgressForChallenge(Long userId, Long challengeId) {
        log.debug("Fetching progress for user: {} challenge: {}", userId, challengeId);

        SeasonalChallengeEntity challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new EntityNotFoundException("Challenge not found: " + challengeId));

        UserChallengeProgressEntity progress = progressRepository
                .findByUserIdAndChallengeId(userId, challengeId)
                .orElse(null);

        return mapToProgressResponse(challenge, progress);
    }

    @Override
    public List<ChallengeResponse> getClaimableRewards(Long userId) {
        log.debug("Fetching claimable rewards for user: {}", userId);
        List<UserChallengeProgressEntity> claimable = progressRepository.findClaimableByyUserId(userId);
        return claimable.stream()
                .map(p -> mapToResponseWithProgress(p.getChallenge(), p))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClaimRewardResponse claimReward(Long userId, Long challengeId) {
        log.info("User {} claiming reward for challenge {}", userId, challengeId);

        SeasonalChallengeEntity challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new EntityNotFoundException("Challenge not found: " + challengeId));

        UserChallengeProgressEntity progress = progressRepository
                .findByUserIdAndChallengeId(userId, challengeId)
                .orElseThrow(() -> new IllegalStateException("No progress found for this challenge"));

        // Validate
        if (!progress.getIsCompleted()) {
            throw new IllegalStateException("Challenge not yet completed");
        }
        if (progress.getRewardClaimed()) {
            throw new IllegalStateException("Reward already claimed");
        }

        // Build reward description
        String rewardValue = buildRewardDescription(challenge);

        // Mark as claimed
        progress.claimReward(rewardValue);
        progressRepository.save(progress);

        // TODO: Dispatch events to actually grant rewards (points, badges, vouchers)
        // pointsService.addPoints(userId, challenge.getRewardPoints(), "CHALLENGE_" +
        // challenge.getCode());
        // badgeService.grantBadge(userId, challenge.getRewardBadgeId());
        // voucherService.assignVoucher(userId, challenge.getRewardVoucherCode());

        log.info("User {} successfully claimed reward for challenge {}", userId, challengeId);

        return ClaimRewardResponse.builder()
                .success(true)
                .message("Nhận thưởng thành công!")
                .challengeId(challengeId)
                .challengeName(challenge.getName())
                .rewardType(challenge.getRewardType())
                .rewardPoints(challenge.getRewardPoints())
                .rewardVoucherCode(challenge.getRewardVoucherCode())
                .rewardDescription(challenge.getRewardDescription())
                .claimedAt(OffsetDateTime.now())
                .build();
    }

    // ==================== PROGRESS TRACKING ====================

    @Override
    @Transactional
    public void trackOrderProgress(Long userId, Long orderValue, String productCategory) {
        log.debug("Tracking order progress for user: {} value: {} category: {}",
                userId, orderValue, productCategory);

        OffsetDateTime now = OffsetDateTime.now();
        List<SeasonalChallengeEntity> activeChallenges = challengeRepository.findCurrentlyActiveChallenges(now);

        for (SeasonalChallengeEntity challenge : activeChallenges) {
            boolean shouldTrack = false;
            long incrementAmount = 0;

            switch (challenge.getChallengeType()) {
                case ORDER_COUNT:
                    shouldTrack = matchesCondition(challenge, productCategory);
                    incrementAmount = 1;
                    break;
                case ORDER_VALUE:
                    shouldTrack = matchesCondition(challenge, productCategory);
                    incrementAmount = orderValue;
                    break;
                case PRODUCT_CATEGORY:
                case FABRIC_PURCHASE:
                    shouldTrack = matchesCondition(challenge, productCategory);
                    incrementAmount = 1;
                    break;
                default:
                    continue;
            }

            if (shouldTrack) {
                incrementProgressInternal(userId, challenge, incrementAmount);
            }
        }
    }

    @Override
    @Transactional
    public void trackReviewProgress(Long userId) {
        log.debug("Tracking review progress for user: {}", userId);
        trackChallengeType(userId, ChallengeType.REVIEW_COUNT, 1L);
    }

    @Override
    @Transactional
    public void trackReferralProgress(Long userId) {
        log.debug("Tracking referral progress for user: {}", userId);
        trackChallengeType(userId, ChallengeType.REFERRAL_COUNT, 1L);
    }

    @Override
    @Transactional
    public void incrementProgress(Long userId, Long challengeId, Long amount) {
        log.info("Manually incrementing progress for user: {} challenge: {} amount: {}",
                userId, challengeId, amount);

        SeasonalChallengeEntity challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new EntityNotFoundException("Challenge not found: " + challengeId));

        incrementProgressInternal(userId, challenge, amount);
    }

    // ==================== ADMIN ENDPOINTS ====================

    @Override
    public List<ChallengeResponse> getAllChallenges() {
        log.debug("Fetching all challenges (admin)");
        return challengeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChallengeResponse createChallenge(CreateChallengeRequest request, Long createdByUserId) {
        log.info("Creating new challenge: {} by user: {}", request.getCode(), createdByUserId);

        // Check for duplicate code
        if (challengeRepository.findByCode(request.getCode()).isPresent()) {
            throw new IllegalArgumentException("Challenge code already exists: " + request.getCode());
        }

        UserEntity createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + createdByUserId));

        SeasonalChallengeEntity challenge = SeasonalChallengeEntity.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .season(request.getSeason())
                .year(request.getYear())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .challengeType(request.getChallengeType())
                .conditionKey(request.getConditionKey())
                .targetValue(request.getTargetValue())
                .rewardPoints(request.getRewardPoints())
                .rewardBadgeId(request.getRewardBadgeId())
                .rewardVoucherCode(request.getRewardVoucherCode())
                .rewardVoucherValue(request.getRewardVoucherValue())
                .rewardType(request.getRewardType())
                .rewardDescription(request.getRewardDescription())
                .isGrandPrize(request.getIsGrandPrize() != null && request.getIsGrandPrize())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .iconUrl(request.getIconUrl())
                .bannerImage(request.getBannerImage())
                .themeColor(request.getThemeColor())
                .isActive(true)
                .createdBy(createdBy)
                .build();

        // Handle parent challenge
        if (request.getParentChallengeId() != null) {
            SeasonalChallengeEntity parent = challengeRepository.findById(request.getParentChallengeId())
                    .orElseThrow(() -> new EntityNotFoundException("Parent challenge not found"));
            challenge.setParentChallenge(parent);
        }

        challenge = challengeRepository.save(challenge);
        log.info("Challenge created successfully: {}", challenge.getId());

        return mapToResponse(challenge);
    }

    @Override
    @Transactional
    public ChallengeResponse updateChallenge(Long challengeId, UpdateChallengeRequest request) {
        log.info("Updating challenge: {}", challengeId);

        SeasonalChallengeEntity challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new EntityNotFoundException("Challenge not found: " + challengeId));

        // Update fields if provided
        Optional.ofNullable(request.getName()).ifPresent(challenge::setName);
        Optional.ofNullable(request.getDescription()).ifPresent(challenge::setDescription);
        Optional.ofNullable(request.getStartDate()).ifPresent(challenge::setStartDate);
        Optional.ofNullable(request.getEndDate()).ifPresent(challenge::setEndDate);
        Optional.ofNullable(request.getChallengeType()).ifPresent(challenge::setChallengeType);
        Optional.ofNullable(request.getConditionKey()).ifPresent(challenge::setConditionKey);
        Optional.ofNullable(request.getTargetValue()).ifPresent(challenge::setTargetValue);
        Optional.ofNullable(request.getRewardPoints()).ifPresent(challenge::setRewardPoints);
        Optional.ofNullable(request.getRewardBadgeId()).ifPresent(challenge::setRewardBadgeId);
        Optional.ofNullable(request.getRewardVoucherCode()).ifPresent(challenge::setRewardVoucherCode);
        Optional.ofNullable(request.getRewardVoucherValue()).ifPresent(challenge::setRewardVoucherValue);
        Optional.ofNullable(request.getRewardType()).ifPresent(challenge::setRewardType);
        Optional.ofNullable(request.getRewardDescription()).ifPresent(challenge::setRewardDescription);
        Optional.ofNullable(request.getDisplayOrder()).ifPresent(challenge::setDisplayOrder);
        Optional.ofNullable(request.getIconUrl()).ifPresent(challenge::setIconUrl);
        Optional.ofNullable(request.getBannerImage()).ifPresent(challenge::setBannerImage);
        Optional.ofNullable(request.getThemeColor()).ifPresent(challenge::setThemeColor);
        Optional.ofNullable(request.getIsActive()).ifPresent(challenge::setIsActive);

        challenge = challengeRepository.save(challenge);
        log.info("Challenge updated successfully: {}", challengeId);

        return mapToResponse(challenge);
    }

    @Override
    @Transactional
    public void deactivateChallenge(Long challengeId) {
        log.info("Deactivating challenge: {}", challengeId);

        SeasonalChallengeEntity challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new EntityNotFoundException("Challenge not found: " + challengeId));

        challenge.setIsActive(false);
        challengeRepository.save(challenge);

        log.info("Challenge deactivated: {}", challengeId);
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private void trackChallengeType(Long userId, ChallengeType type, Long amount) {
        OffsetDateTime now = OffsetDateTime.now();
        List<SeasonalChallengeEntity> activeChallenges = challengeRepository.findCurrentlyActiveChallenges(now);

        for (SeasonalChallengeEntity challenge : activeChallenges) {
            if (challenge.getChallengeType() == type) {
                incrementProgressInternal(userId, challenge, amount);
            }
        }
    }

    private void incrementProgressInternal(Long userId, SeasonalChallengeEntity challenge, Long amount) {
        UserChallengeProgressEntity progress = progressRepository
                .findByUserIdAndChallengeId(userId, challenge.getId())
                .orElseGet(() -> createProgress(userId, challenge));

        progress.incrementProgress(amount);
        progressRepository.save(progress);

        log.debug("Progress updated for user {} challenge {}: {} / {}",
                userId, challenge.getCode(), progress.getCurrentProgress(), challenge.getTargetValue());

        // Check if this completes a grand prize
        if (progress.getIsCompleted() && challenge.getParentChallenge() != null) {
            checkGrandPrizeCompletion(userId, challenge.getParentChallenge());
        }
    }

    private UserChallengeProgressEntity createProgress(Long userId, SeasonalChallengeEntity challenge) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        return UserChallengeProgressEntity.builder()
                .user(user)
                .challenge(challenge)
                .currentProgress(0L)
                .isCompleted(false)
                .rewardClaimed(false)
                .build();
    }

    private void checkGrandPrizeCompletion(Long userId, SeasonalChallengeEntity grandPrize) {
        if (!grandPrize.getIsGrandPrize())
            return;

        List<SeasonalChallengeEntity> subChallenges = challengeRepository
                .findSubChallenges(grandPrize.getId());

        boolean allCompleted = subChallenges.stream()
                .allMatch(sub -> progressRepository.hasUserCompletedChallenge(userId, sub.getId()));

        if (allCompleted) {
            UserChallengeProgressEntity grandProgress = progressRepository
                    .findByUserIdAndChallengeId(userId, grandPrize.getId())
                    .orElseGet(() -> createProgress(userId, grandPrize));

            grandProgress.setCurrentProgress(grandPrize.getTargetValue());
            grandProgress.setIsCompleted(true);
            grandProgress.setCompletedAt(OffsetDateTime.now());
            progressRepository.save(grandProgress);

            log.info("User {} completed grand prize: {}", userId, grandPrize.getCode());
        }
    }

    private boolean matchesCondition(SeasonalChallengeEntity challenge, String productCategory) {
        if (challenge.getConditionKey() == null || challenge.getConditionKey().isEmpty()) {
            return true; // No condition = matches all
        }

        // Parse condition (format: "key:value")
        String[] parts = challenge.getConditionKey().split(":");
        if (parts.length != 2)
            return true;

        String key = parts[0];
        String value = parts[1];

        return switch (key) {
            case "category" -> value.equalsIgnoreCase(productCategory);
            case "fabric_type" -> value.equalsIgnoreCase(productCategory);
            default -> true;
        };
    }

    private String buildRewardDescription(SeasonalChallengeEntity challenge) {
        StringBuilder sb = new StringBuilder();
        if (challenge.getRewardPoints() != null && challenge.getRewardPoints() > 0) {
            sb.append(challenge.getRewardPoints()).append(" xu");
        }
        if (challenge.getRewardVoucherCode() != null) {
            if (!sb.isEmpty())
                sb.append(" + ");
            sb.append("Voucher ").append(challenge.getRewardVoucherCode());
        }
        if (challenge.getRewardBadgeId() != null) {
            if (!sb.isEmpty())
                sb.append(" + ");
            sb.append("Badge");
        }
        return sb.toString();
    }

    // ==================== MAPPERS ====================

    private ChallengeResponse mapToResponse(SeasonalChallengeEntity entity) {
        return mapToResponseWithProgress(entity, null);
    }

    private ChallengeResponse mapToResponseWithProgress(
            SeasonalChallengeEntity entity,
            UserChallengeProgressEntity progress) {

        ChallengeResponse.ChallengeResponseBuilder builder = ChallengeResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .season(entity.getSeason())
                .seasonDisplayName(entity.getSeason().getDisplayName())
                .year(entity.getYear())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .challengeType(entity.getChallengeType())
                .challengeTypeDisplayName(entity.getChallengeType().getDisplayName())
                .conditionKey(entity.getConditionKey())
                .targetValue(entity.getTargetValue())
                .targetDisplayValue(entity.getTargetDisplayValue())
                .rewardPoints(entity.getRewardPoints())
                .rewardVoucherCode(entity.getRewardVoucherCode())
                .rewardVoucherValue(entity.getRewardVoucherValue())
                .rewardType(entity.getRewardType())
                .rewardDescription(entity.getRewardDescription())
                .isGrandPrize(entity.getIsGrandPrize())
                .displayOrder(entity.getDisplayOrder())
                .iconUrl(entity.getIconUrl())
                .bannerImage(entity.getBannerImage())
                .themeColor(entity.getThemeColor())
                .isActive(entity.getIsActive())
                .isCurrentlyActive(entity.isCurrentlyActive())
                .hasStarted(entity.hasStarted())
                .hasEnded(entity.hasEnded())
                .remainingTimeMillis(entity.getRemainingTimeMillis());

        // Add progress if available
        if (progress != null) {
            builder.currentProgress(progress.getCurrentProgress());
            builder.progressPercentage(progress.getProgressPercentage());
            builder.isCompleted(progress.getIsCompleted());
            builder.rewardClaimed(progress.getRewardClaimed());
            builder.completedAt(progress.getCompletedAt());
        } else {
            builder.currentProgress(0L);
            builder.progressPercentage(0);
            builder.isCompleted(false);
            builder.rewardClaimed(false);
        }

        // Handle sub-challenges for grand prizes
        if (entity.getIsGrandPrize() && entity.getSubChallenges() != null) {
            builder.subChallenges(entity.getSubChallenges().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList()));
            builder.totalSubChallengesCount(entity.getSubChallenges().size());
        }

        return builder.build();
    }

    private UserProgressResponse mapToProgressResponse(
            SeasonalChallengeEntity challenge,
            UserChallengeProgressEntity progress) {

        UserProgressResponse.UserProgressResponseBuilder builder = UserProgressResponse.builder()
                .challengeId(challenge.getId())
                .challengeName(challenge.getName())
                .challengeCode(challenge.getCode())
                .targetValue(challenge.getTargetValue());

        if (progress != null) {
            builder.progressId(progress.getId())
                    .userId(progress.getUser().getId())
                    .currentProgress(progress.getCurrentProgress())
                    .progressPercentage(progress.getProgressPercentage())
                    .remainingProgress(progress.getRemainingProgress())
                    .isCompleted(progress.getIsCompleted())
                    .completedAt(progress.getCompletedAt())
                    .canClaimReward(progress.canClaimReward())
                    .rewardClaimed(progress.getRewardClaimed())
                    .claimedAt(progress.getClaimedAt())
                    .claimedRewardValue(progress.getClaimedRewardValue());
        } else {
            builder.currentProgress(0L)
                    .progressPercentage(0)
                    .remainingProgress(challenge.getTargetValue())
                    .isCompleted(false)
                    .canClaimReward(false)
                    .rewardClaimed(false);
        }

        return builder.build();
    }
}

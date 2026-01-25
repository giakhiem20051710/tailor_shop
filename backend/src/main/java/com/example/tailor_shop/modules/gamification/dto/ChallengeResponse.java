package com.example.tailor_shop.modules.gamification.dto;

import com.example.tailor_shop.modules.gamification.domain.ChallengeType;
import com.example.tailor_shop.modules.gamification.domain.RewardType;
import com.example.tailor_shop.modules.gamification.domain.Season;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Challenge Response DTO - Thông tin challenge trả về cho client
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeResponse {

    private Long id;
    private String code;
    private String name;
    private String description;

    // Season info
    private Season season;
    private String seasonDisplayName;
    private Integer year;
    private OffsetDateTime startDate;
    private OffsetDateTime endDate;

    // Challenge condition
    private ChallengeType challengeType;
    private String challengeTypeDisplayName;
    private String conditionKey;
    private Long targetValue;
    private String targetDisplayValue;

    // Rewards
    private Integer rewardPoints;
    private String rewardBadgeName;
    private String rewardVoucherCode;
    private BigDecimal rewardVoucherValue;
    private RewardType rewardType;
    private String rewardDescription;

    // Progress (for authenticated user)
    private Long currentProgress;
    private Integer progressPercentage;
    private Boolean isCompleted;
    private Boolean rewardClaimed;
    private OffsetDateTime completedAt;

    // Grand Prize info
    private Boolean isGrandPrize;
    private List<ChallengeResponse> subChallenges;
    private Integer completedSubChallengesCount;
    private Integer totalSubChallengesCount;

    // Display
    private Integer displayOrder;
    private String iconUrl;
    private String bannerImage;
    private String themeColor;

    // Status
    private Boolean isActive;
    private Boolean isCurrentlyActive;
    private Boolean hasStarted;
    private Boolean hasEnded;
    private Long remainingTimeMillis;
}

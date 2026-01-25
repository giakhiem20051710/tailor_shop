package com.example.tailor_shop.modules.gamification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * User Progress Response DTO - Tiến độ của user cho 1 challenge
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProgressResponse {

    private Long progressId;
    private Long userId;
    private Long challengeId;
    private String challengeName;
    private String challengeCode;

    // Progress
    private Long currentProgress;
    private Long targetValue;
    private Integer progressPercentage;
    private Long remainingProgress;

    // Status
    private Boolean isCompleted;
    private OffsetDateTime completedAt;
    private Boolean canClaimReward;

    // Reward
    private Boolean rewardClaimed;
    private OffsetDateTime claimedAt;
    private String claimedRewardValue;
}

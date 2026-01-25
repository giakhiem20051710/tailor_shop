package com.example.tailor_shop.modules.gamification.dto;

import com.example.tailor_shop.modules.gamification.domain.RewardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Claim Reward Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimRewardResponse {

    private Boolean success;
    private String message;

    // Challenge info
    private Long challengeId;
    private String challengeName;

    // Reward info
    private RewardType rewardType;
    private Integer rewardPoints;
    private String rewardVoucherCode;
    private String rewardBadgeName;
    private String rewardDescription;

    private OffsetDateTime claimedAt;
}

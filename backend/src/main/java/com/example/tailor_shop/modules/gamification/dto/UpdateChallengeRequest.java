package com.example.tailor_shop.modules.gamification.dto;

import com.example.tailor_shop.modules.gamification.domain.ChallengeType;
import com.example.tailor_shop.modules.gamification.domain.RewardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Update Challenge Request DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateChallengeRequest {

    private String name;
    private String description;
    private OffsetDateTime startDate;
    private OffsetDateTime endDate;
    private ChallengeType challengeType;
    private String conditionKey;
    private Long targetValue;

    // Rewards
    private Integer rewardPoints;
    private Long rewardBadgeId;
    private String rewardVoucherCode;
    private BigDecimal rewardVoucherValue;
    private RewardType rewardType;
    private String rewardDescription;

    // Display
    private Integer displayOrder;
    private String iconUrl;
    private String bannerImage;
    private String themeColor;
    private Boolean isActive;
}

package com.example.tailor_shop.modules.gamification.dto;

import com.example.tailor_shop.modules.gamification.domain.Season;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Season Challenges Response DTO - Thông tin tổng hợp của 1 mùa challenge
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeasonChallengesResponse {

    private Season season;
    private String seasonDisplayName;
    private Integer year;
    private String seasonCode;

    // Timing
    private OffsetDateTime startDate;
    private OffsetDateTime endDate;
    private Long remainingTimeMillis;
    private Boolean isActive;
    private Boolean hasEnded;

    // Theme
    private String bannerImage;
    private String themeColor;

    // Challenges
    private List<ChallengeResponse> challenges;
    private ChallengeResponse grandPrize;

    // User Progress Summary
    private Integer totalChallenges;
    private Integer completedChallenges;
    private Integer claimedRewards;
    private Integer overallProgressPercentage;
}

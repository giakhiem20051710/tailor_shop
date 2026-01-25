package com.example.tailor_shop.modules.gamification.dto;

import com.example.tailor_shop.modules.gamification.domain.ChallengeType;
import com.example.tailor_shop.modules.gamification.domain.RewardType;
import com.example.tailor_shop.modules.gamification.domain.Season;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Create Challenge Request DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChallengeRequest {

    @NotBlank(message = "Code là bắt buộc")
    private String code;

    @NotBlank(message = "Tên challenge là bắt buộc")
    private String name;

    private String description;

    @NotNull(message = "Season là bắt buộc")
    private Season season;

    @NotNull(message = "Year là bắt buộc")
    private Integer year;

    @NotNull(message = "Ngày bắt đầu là bắt buộc")
    private OffsetDateTime startDate;

    @NotNull(message = "Ngày kết thúc là bắt buộc")
    private OffsetDateTime endDate;

    @NotNull(message = "Loại challenge là bắt buộc")
    private ChallengeType challengeType;

    private String conditionKey;

    @NotNull(message = "Giá trị mục tiêu là bắt buộc")
    @Positive(message = "Giá trị mục tiêu phải lớn hơn 0")
    private Long targetValue;

    // Rewards
    private Integer rewardPoints;
    private Long rewardBadgeId;
    private String rewardVoucherCode;
    private BigDecimal rewardVoucherValue;
    private RewardType rewardType;
    private String rewardDescription;

    // Grand Prize
    private Boolean isGrandPrize;
    private Long parentChallengeId;

    // Display
    private Integer displayOrder;
    private String iconUrl;
    private String bannerImage;
    private String themeColor;
}

package com.example.tailor_shop.modules.gamification.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Claim Reward Request DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimRewardRequest {

    @NotNull(message = "Challenge ID là bắt buộc")
    private Long challengeId;
}

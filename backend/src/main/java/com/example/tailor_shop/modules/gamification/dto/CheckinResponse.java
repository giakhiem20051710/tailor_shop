package com.example.tailor_shop.modules.gamification.dto;

import lombok.*;
import java.time.LocalDate;

/**
 * Check-in Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinResponse {
    private Boolean success;
    private Integer pointsEarned;
    private Integer streakDay; // Current day in streak (1-7)
    private Integer currentStreak;
    private Integer newBalance;
    private String message;
    private LocalDate checkinDate;
}

package com.example.tailor_shop.modules.gamification.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

/**
 * Check-in Status Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinStatusResponse {
    private Integer currentStreak;
    private Integer longestStreak;
    private LocalDate lastCheckinDate;
    private Integer totalCheckins;
    private Boolean canCheckinToday;
    private Integer nextStreakDay; // Which day in streak today would be (1-7)
    private Integer nextPoints; // Points to earn if check in today

    // Points schedule for 7 days
    private List<DayPoints> weekSchedule;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayPoints {
        private Integer day; // 1-7
        private Integer points;
        private Boolean completed;
    }
}

package com.example.tailor_shop.modules.gamification.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * User Check-in Streak Entity
 * Tracks user's current and longest streak
 */
@Entity
@Table(name = "user_checkin_streak")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCheckinStreak {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "current_streak", nullable = false)
    @Builder.Default
    private Integer currentStreak = 0;

    @Column(name = "longest_streak", nullable = false)
    @Builder.Default
    private Integer longestStreak = 0;

    @Column(name = "last_checkin_date")
    private LocalDate lastCheckinDate;

    @Column(name = "total_checkins", nullable = false)
    @Builder.Default
    private Integer totalCheckins = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ========== Business Methods ==========

    /**
     * Check if user can check in today
     */
    public boolean canCheckinToday() {
        if (lastCheckinDate == null)
            return true;
        return !lastCheckinDate.equals(LocalDate.now());
    }

    /**
     * Get the streak day for today's check-in (1-7)
     */
    public int getNextStreakDay() {
        if (lastCheckinDate == null)
            return 1;

        LocalDate yesterday = LocalDate.now().minusDays(1);

        // If last check-in was yesterday, continue streak
        if (lastCheckinDate.equals(yesterday)) {
            return Math.min(currentStreak + 1, 7);
        }

        // Streak broken, start from 1
        return 1;
    }

    /**
     * Record a check-in
     */
    public void recordCheckin() {
        LocalDate today = LocalDate.now();

        if (lastCheckinDate == null) {
            // First check-in ever
            currentStreak = 1;
        } else if (lastCheckinDate.equals(today.minusDays(1))) {
            // Consecutive day - increase streak (max 7)
            currentStreak = Math.min(currentStreak + 1, 7);
        } else if (!lastCheckinDate.equals(today)) {
            // Streak broken - reset to 1
            currentStreak = 1;
        }

        lastCheckinDate = today;
        totalCheckins++;
        longestStreak = Math.max(longestStreak, currentStreak);
    }
}

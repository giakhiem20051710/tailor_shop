package com.example.tailor_shop.modules.gamification.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Daily Check-in Entity
 * Tracks each check-in event
 */
@Entity
@Table(name = "daily_checkin", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "checkin_date" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyCheckin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "checkin_date", nullable = false)
    private LocalDate checkinDate;

    @Column(name = "streak_day", nullable = false)
    @Builder.Default
    private Integer streakDay = 1; // Day 1-7 in streak

    @Column(name = "points_earned", nullable = false)
    private Integer pointsEarned;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (checkinDate == null) {
            checkinDate = LocalDate.now();
        }
    }
}

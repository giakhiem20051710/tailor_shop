package com.example.tailor_shop.modules.gamification.domain;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

/**
 * User Challenge Progress Entity - Tiến độ hoàn thành challenge của user
 */
@Entity
@Table(name = "user_challenge_progress", indexes = {
        @Index(name = "idx_progress_user", columnList = "user_id"),
        @Index(name = "idx_progress_challenge", columnList = "challenge_id"),
        @Index(name = "idx_progress_completed", columnList = "is_completed")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_challenge", columnNames = { "user_id", "challenge_id" })
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "user", "challenge" })
public class UserChallengeProgressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== RELATIONSHIPS ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private SeasonalChallengeEntity challenge;

    // ==================== PROGRESS ====================

    @Column(name = "current_progress", nullable = false)
    @Builder.Default
    private Long currentProgress = 0L;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    // ==================== REWARD ====================

    @Column(name = "reward_claimed", nullable = false)
    @Builder.Default
    private Boolean rewardClaimed = false;

    @Column(name = "claimed_at")
    private OffsetDateTime claimedAt;

    /**
     * Giá trị reward đã nhận (dùng cho audit)
     */
    @Column(name = "claimed_reward_value", length = 255)
    private String claimedRewardValue;

    // ==================== METADATA ====================

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ==================== COMPUTED METHODS ====================

    /**
     * Get progress percentage (0-100)
     */
    public int getProgressPercentage() {
        if (challenge == null || challenge.getTargetValue() == 0) {
            return 0;
        }
        int percentage = (int) ((currentProgress * 100) / challenge.getTargetValue());
        return Math.min(percentage, 100);
    }

    /**
     * Get remaining progress to complete
     */
    public long getRemainingProgress() {
        if (challenge == null)
            return 0;
        return Math.max(0, challenge.getTargetValue() - currentProgress);
    }

    /**
     * Check if reward can be claimed
     */
    public boolean canClaimReward() {
        return isCompleted && !rewardClaimed;
    }

    /**
     * Increment progress by amount
     */
    public void incrementProgress(long amount) {
        this.currentProgress += amount;
        if (challenge != null && this.currentProgress >= challenge.getTargetValue()) {
            this.isCompleted = true;
            if (this.completedAt == null) {
                this.completedAt = OffsetDateTime.now();
            }
        }
    }

    /**
     * Mark reward as claimed
     */
    public void claimReward(String rewardValue) {
        this.rewardClaimed = true;
        this.claimedAt = OffsetDateTime.now();
        this.claimedRewardValue = rewardValue;
    }
}

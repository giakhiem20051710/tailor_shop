package com.example.tailor_shop.modules.gamification.domain;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Seasonal Challenge Entity - Thử thách theo mùa
 * Quản lý các thử thách gắn với dịp lễ/mùa trong năm
 */
@Entity
@Table(name = "seasonal_challenges", indexes = {
        @Index(name = "idx_challenge_season", columnList = "season"),
        @Index(name = "idx_challenge_active", columnList = "is_active"),
        @Index(name = "idx_challenge_time", columnList = "start_date, end_date"),
        @Index(name = "idx_challenge_code", columnList = "code")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "createdBy", "userProgress", "parentChallenge", "subChallenges" })
public class SeasonalChallengeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== IDENTIFICATION ====================

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // ==================== SEASON INFO ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "season", nullable = false, length = 20)
    private Season season;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "start_date", nullable = false)
    private OffsetDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private OffsetDateTime endDate;

    // ==================== CHALLENGE CONDITION ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "challenge_type", nullable = false, length = 30)
    private ChallengeType challengeType;

    /**
     * Điều kiện bổ sung (JSON hoặc key:value)
     * Ví dụ: "category:ao-dai" hoặc "fabric_type:silk"
     */
    @Column(name = "condition_key", length = 100)
    private String conditionKey;

    /**
     * Giá trị mục tiêu cần đạt
     * - ORDER_COUNT: số đơn hàng
     * - ORDER_VALUE: tổng giá trị (VNĐ)
     * - REVIEW_COUNT: số review
     */
    @Column(name = "target_value", nullable = false)
    private Long targetValue;

    // ==================== REWARDS ====================

    @Column(name = "reward_points")
    private Integer rewardPoints;

    @Column(name = "reward_badge_id")
    private Long rewardBadgeId;

    @Column(name = "reward_voucher_code", length = 50)
    private String rewardVoucherCode;

    @Column(name = "reward_voucher_value")
    private BigDecimal rewardVoucherValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_type", length = 30)
    private RewardType rewardType;

    @Column(name = "reward_description", length = 255)
    private String rewardDescription;

    // ==================== COMBO/GRAND PRIZE ====================

    /**
     * Nếu đây là Grand Prize, link đến các sub-challenges cần hoàn thành
     */
    @Column(name = "is_grand_prize", nullable = false)
    @Builder.Default
    private Boolean isGrandPrize = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_challenge_id")
    private SeasonalChallengeEntity parentChallenge;

    @OneToMany(mappedBy = "parentChallenge", cascade = CascadeType.ALL)
    @Builder.Default
    private List<SeasonalChallengeEntity> subChallenges = new ArrayList<>();

    // ==================== DISPLAY ====================

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "banner_image", columnDefinition = "TEXT")
    private String bannerImage;

    @Column(name = "theme_color", length = 20)
    private String themeColor;

    // ==================== STATUS ====================

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // ==================== RELATIONSHIPS ====================

    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserChallengeProgressEntity> userProgress = new ArrayList<>();

    // ==================== METADATA ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ==================== COMPUTED METHODS ====================

    /**
     * Check if challenge is currently active (within date range and enabled)
     */
    public boolean isCurrentlyActive() {
        OffsetDateTime now = OffsetDateTime.now();
        return isActive
                && now.isAfter(startDate)
                && now.isBefore(endDate);
    }

    /**
     * Check if challenge has ended
     */
    public boolean hasEnded() {
        return OffsetDateTime.now().isAfter(endDate);
    }

    /**
     * Check if challenge has started
     */
    public boolean hasStarted() {
        return OffsetDateTime.now().isAfter(startDate);
    }

    /**
     * Check if challenge is upcoming (not started yet)
     */
    public boolean isUpcoming() {
        return OffsetDateTime.now().isBefore(startDate);
    }

    /**
     * Get remaining time in milliseconds
     */
    public long getRemainingTimeMillis() {
        if (hasEnded())
            return 0;
        return endDate.toInstant().toEpochMilli() - System.currentTimeMillis();
    }

    /**
     * Get display format for target value based on challenge type
     */
    public String getTargetDisplayValue() {
        return switch (challengeType) {
            case ORDER_VALUE -> String.format("%,d₫", targetValue);
            case ORDER_COUNT, REVIEW_COUNT, REFERRAL_COUNT, CHECKIN_STREAK, COMBO ->
                String.valueOf(targetValue);
            default -> String.valueOf(targetValue);
        };
    }
}

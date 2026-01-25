package com.example.tailor_shop.modules.gamification.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * User Points Wallet Entity
 * Tracks user's points balance and totals
 */
@Entity
@Table(name = "user_points_wallet")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPointsWallet {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "balance", nullable = false)
    @Builder.Default
    private Integer balance = 0;

    @Column(name = "total_earned", nullable = false)
    @Builder.Default
    private Integer totalEarned = 0;

    @Column(name = "total_spent", nullable = false)
    @Builder.Default
    private Integer totalSpent = 0;

    @Column(name = "total_expired", nullable = false)
    @Builder.Default
    private Integer totalExpired = 0;

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
     * Add points to wallet
     */
    public void addPoints(int amount) {
        if (amount <= 0)
            return;
        this.balance += amount;
        this.totalEarned += amount;
    }

    /**
     * Spend points from wallet
     * 
     * @return true if successful, false if insufficient balance
     */
    public boolean spendPoints(int amount) {
        if (amount <= 0 || amount > balance)
            return false;
        this.balance -= amount;
        this.totalSpent += amount;
        return true;
    }

    /**
     * Mark points as expired
     */
    public void expirePoints(int amount) {
        if (amount <= 0 || amount > balance)
            return;
        this.balance -= amount;
        this.totalExpired += amount;
    }

    /**
     * Check if user has sufficient points
     */
    public boolean hasSufficientPoints(int amount) {
        return balance >= amount;
    }
}

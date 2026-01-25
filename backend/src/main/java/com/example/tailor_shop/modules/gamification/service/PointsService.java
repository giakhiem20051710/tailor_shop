package com.example.tailor_shop.modules.gamification.service;

import com.example.tailor_shop.modules.gamification.domain.*;
import com.example.tailor_shop.modules.gamification.dto.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Points Service Interface
 * Handles all points operations with anti-fraud protection
 */
public interface PointsService {

    // ==================== WALLET ====================

    /**
     * Get or create user's points wallet
     */
    WalletResponse getWallet(Long userId);

    /**
     * Get points transaction history
     */
    List<TransactionResponse> getTransactions(Long userId, int page, int size);

    // ==================== EARN POINTS ====================

    /**
     * Add points from order (with anti-fraud: rate limiting, max per day)
     */
    TransactionResponse earnFromOrder(Long userId, Long orderId, BigDecimal orderAmount);

    /**
     * Add points from check-in (with anti-fraud: one per day)
     */
    CheckinResponse checkin(Long userId);

    /**
     * Get check-in status and streak info
     */
    CheckinStatusResponse getCheckinStatus(Long userId);

    /**
     * Add points from review (with anti-fraud: one per product)
     */
    TransactionResponse earnFromReview(Long userId, Long reviewId);

    /**
     * Add points from referral (when referred user makes purchase)
     */
    TransactionResponse earnFromReferral(Long referrerId, Long referredUserId, Long orderId);

    // ==================== SPEND POINTS ====================

    /**
     * Calculate discount for order (with protection limits)
     */
    RedeemCalculation calculateRedemption(Long userId, BigDecimal orderTotal, Integer pointsToUse);

    /**
     * Redeem points for order discount
     */
    TransactionResponse redeemForOrder(Long userId, Long orderId, Integer pointsAmount);

    // ==================== ADMIN ====================

    /**
     * Manual points adjustment by admin
     */
    TransactionResponse adminAdjust(Long userId, Integer amount, String reason, Long adminId);

    /**
     * Expire old points (scheduled job)
     */
    int expireOldPoints();

    // ==================== CONFIG ====================

    /**
     * Get points config value
     */
    String getConfig(String key);

    /**
     * Update points config (admin only)
     */
    void updateConfig(String key, String value);
}

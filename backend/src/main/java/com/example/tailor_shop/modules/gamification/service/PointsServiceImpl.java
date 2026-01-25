package com.example.tailor_shop.modules.gamification.service;

import com.example.tailor_shop.modules.gamification.domain.*;
import com.example.tailor_shop.modules.gamification.dto.*;
import com.example.tailor_shop.modules.gamification.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Points Service Implementation
 * With comprehensive anti-fraud protection
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PointsServiceImpl implements PointsService {

    private final UserPointsWalletRepository walletRepository;
    private final PointsTransactionRepository transactionRepository;
    private final DailyCheckinRepository checkinRepository;
    private final UserCheckinStreakRepository streakRepository;

    // ========== CONFIG VALUES ==========
    private static final int VALUE_PER_POINT = 500; // 1 xu = 500đ
    private static final int EARN_ORDER_SPEND = 50000; // 1 xu / 50.000đ
    private static final int MIN_POINTS_TO_REDEEM = 50; // Tối thiểu 50 xu
    private static final int MAX_PERCENT_ORDER = 20; // Max 20% đơn hàng
    private static final BigDecimal MIN_ORDER_VALUE = new BigDecimal("500000"); // 500k
    private static final int EXPIRY_MONTHS = 12; // Hết hạn sau 12 tháng

    // Anti-fraud limits
    private static final int MAX_POINTS_PER_DAY = 500; // Max 500 xu/ngày từ mua hàng
    private static final int MAX_ORDERS_PER_DAY = 5; // Max 5 đơn/ngày được tính xu

    // Check-in points schedule (day 1-7)
    private static final int[] CHECKIN_POINTS = { 10, 15, 20, 25, 30, 40, 100 };

    // ========== WALLET ==========

    @Override
    @Transactional
    public WalletResponse getWallet(Long userId) {
        UserPointsWallet wallet = getOrCreateWallet(userId);

        // Calculate expiring points
        LocalDateTime expiryCheck = LocalDateTime.now().plusDays(30);
        List<PointsTransaction> expiring = transactionRepository.findExpiringPoints(expiryCheck)
                .stream()
                .filter(t -> t.getUserId().equals(userId))
                .collect(Collectors.toList());

        int expiringPoints = expiring.stream()
                .mapToInt(PointsTransaction::getAmount)
                .sum();

        return WalletResponse.builder()
                .userId(userId)
                .balance(wallet.getBalance())
                .totalEarned(wallet.getTotalEarned())
                .totalSpent(wallet.getTotalSpent())
                .totalExpired(wallet.getTotalExpired())
                .valueInVnd((long) wallet.getBalance() * VALUE_PER_POINT)
                .expiringInDays(30)
                .expiringPoints(expiringPoints)
                .build();
    }

    private UserPointsWallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserPointsWallet newWallet = UserPointsWallet.builder()
                            .userId(userId)
                            .balance(0)
                            .totalEarned(0)
                            .totalSpent(0)
                            .totalExpired(0)
                            .build();
                    return walletRepository.save(newWallet);
                });
    }

    @Override
    public List<TransactionResponse> getTransactions(Long userId, int page, int size) {
        Page<PointsTransaction> transactions = transactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));

        return transactions.getContent().stream()
                .map(this::toTransactionResponse)
                .collect(Collectors.toList());
    }

    // ========== EARN POINTS ==========

    @Override
    @Transactional
    public TransactionResponse earnFromOrder(Long userId, Long orderId, BigDecimal orderAmount) {
        log.info("Processing points for order: userId={}, orderId={}, amount={}", userId, orderId, orderAmount);

        // Anti-fraud: Check daily limit
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        int earnedToday = transactionRepository.sumPointsEarnedToday(userId, startOfDay);

        if (earnedToday >= MAX_POINTS_PER_DAY) {
            log.warn("User {} hit daily points limit: {}", userId, earnedToday);
            return null;
        }

        // Anti-fraud: Check if already earned from this order
        if (transactionRepository.existsByUserIdAndSourceAndSourceId(
                userId, PointsTransaction.PointsSource.ORDER, orderId)) {
            log.warn("User {} already earned points from order {}", userId, orderId);
            return null;
        }

        // Calculate points: 1 xu / 50.000đ
        int pointsToEarn = orderAmount.divide(new BigDecimal(EARN_ORDER_SPEND), 0,
                java.math.RoundingMode.DOWN).intValue();

        if (pointsToEarn <= 0) {
            return null;
        }

        // Apply daily limit
        int allowedPoints = Math.min(pointsToEarn, MAX_POINTS_PER_DAY - earnedToday);

        // Add points to wallet
        UserPointsWallet wallet = getOrCreateWallet(userId);
        wallet.addPoints(allowedPoints);
        walletRepository.save(wallet);

        // Create transaction record
        LocalDateTime expiresAt = LocalDateTime.now().plusMonths(EXPIRY_MONTHS);
        PointsTransaction transaction = PointsTransaction.earn(
                userId, allowedPoints, PointsTransaction.PointsSource.ORDER,
                orderId, "Điểm thưởng từ đơn hàng #" + orderId,
                wallet.getBalance(), expiresAt);
        transactionRepository.save(transaction);

        log.info("User {} earned {} points from order {}", userId, allowedPoints, orderId);
        return toTransactionResponse(transaction);
    }

    @Override
    @Transactional
    public CheckinResponse checkin(Long userId) {
        LocalDate today = LocalDate.now();

        // Anti-fraud: Check if already checked in today
        if (checkinRepository.existsByUserIdAndCheckinDate(userId, today)) {
            log.warn("User {} already checked in today", userId);
            return CheckinResponse.builder()
                    .success(false)
                    .message("Bạn đã điểm danh hôm nay rồi!")
                    .build();
        }

        // Get or create streak
        UserCheckinStreak streak = streakRepository.findByUserId(userId)
                .orElseGet(() -> UserCheckinStreak.builder()
                        .userId(userId)
                        .currentStreak(0)
                        .longestStreak(0)
                        .totalCheckins(0)
                        .build());

        // Calculate today's streak day and points
        int streakDay = streak.getNextStreakDay();
        int pointsToEarn = CHECKIN_POINTS[Math.min(streakDay - 1, CHECKIN_POINTS.length - 1)];

        // Record check-in
        streak.recordCheckin();
        streakRepository.save(streak);

        // Save check-in record
        DailyCheckin checkin = DailyCheckin.builder()
                .userId(userId)
                .checkinDate(today)
                .streakDay(streakDay)
                .pointsEarned(pointsToEarn)
                .build();
        checkinRepository.save(checkin);

        // Add points to wallet
        UserPointsWallet wallet = getOrCreateWallet(userId);
        wallet.addPoints(pointsToEarn);
        walletRepository.save(wallet);

        // Create transaction
        LocalDateTime expiresAt = LocalDateTime.now().plusMonths(EXPIRY_MONTHS);
        PointsTransaction transaction = PointsTransaction.earn(
                userId, pointsToEarn, PointsTransaction.PointsSource.CHECKIN,
                checkin.getId(), "Điểm danh ngày " + streakDay,
                wallet.getBalance(), expiresAt);
        transactionRepository.save(transaction);

        log.info("User {} checked in: day={}, points={}, streak={}",
                userId, streakDay, pointsToEarn, streak.getCurrentStreak());

        return CheckinResponse.builder()
                .success(true)
                .pointsEarned(pointsToEarn)
                .streakDay(streakDay)
                .currentStreak(streak.getCurrentStreak())
                .newBalance(wallet.getBalance())
                .checkinDate(today)
                .message("Điểm danh thành công! +" + pointsToEarn + " xu")
                .build();
    }

    @Override
    public CheckinStatusResponse getCheckinStatus(Long userId) {
        UserCheckinStreak streak = streakRepository.findByUserId(userId)
                .orElse(UserCheckinStreak.builder()
                        .userId(userId)
                        .currentStreak(0)
                        .longestStreak(0)
                        .totalCheckins(0)
                        .build());

        LocalDate today = LocalDate.now();
        boolean canCheckin = streak.canCheckinToday();
        int nextDay = streak.getNextStreakDay();
        int nextPoints = CHECKIN_POINTS[Math.min(nextDay - 1, CHECKIN_POINTS.length - 1)];

        // Build week schedule
        List<CheckinStatusResponse.DayPoints> schedule = new ArrayList<>();
        for (int i = 0; i < CHECKIN_POINTS.length; i++) {
            boolean completed = (i + 1) < nextDay ||
                    (i + 1 == nextDay && !canCheckin);
            schedule.add(CheckinStatusResponse.DayPoints.builder()
                    .day(i + 1)
                    .points(CHECKIN_POINTS[i])
                    .completed(completed)
                    .build());
        }

        return CheckinStatusResponse.builder()
                .currentStreak(streak.getCurrentStreak())
                .longestStreak(streak.getLongestStreak())
                .lastCheckinDate(streak.getLastCheckinDate())
                .totalCheckins(streak.getTotalCheckins())
                .canCheckinToday(canCheckin)
                .nextStreakDay(nextDay)
                .nextPoints(nextPoints)
                .weekSchedule(schedule)
                .build();
    }

    @Override
    @Transactional
    public TransactionResponse earnFromReview(Long userId, Long reviewId) {
        // Anti-fraud: Check if already earned from this review
        if (transactionRepository.existsByUserIdAndSourceAndSourceId(
                userId, PointsTransaction.PointsSource.REVIEW, reviewId)) {
            log.warn("User {} already earned points from review {}", userId, reviewId);
            return null;
        }

        int pointsToEarn = 20; // Fixed points for review

        UserPointsWallet wallet = getOrCreateWallet(userId);
        wallet.addPoints(pointsToEarn);
        walletRepository.save(wallet);

        LocalDateTime expiresAt = LocalDateTime.now().plusMonths(EXPIRY_MONTHS);
        PointsTransaction transaction = PointsTransaction.earn(
                userId, pointsToEarn, PointsTransaction.PointsSource.REVIEW,
                reviewId, "Điểm thưởng viết đánh giá",
                wallet.getBalance(), expiresAt);
        transactionRepository.save(transaction);

        log.info("User {} earned {} points from review {}", userId, pointsToEarn, reviewId);
        return toTransactionResponse(transaction);
    }

    @Override
    @Transactional
    public TransactionResponse earnFromReferral(Long referrerId, Long referredUserId, Long orderId) {
        int pointsToEarn = 100; // Fixed points for referral

        UserPointsWallet wallet = getOrCreateWallet(referrerId);
        wallet.addPoints(pointsToEarn);
        walletRepository.save(wallet);

        LocalDateTime expiresAt = LocalDateTime.now().plusMonths(EXPIRY_MONTHS);
        PointsTransaction transaction = PointsTransaction.earn(
                referrerId, pointsToEarn, PointsTransaction.PointsSource.REFERRAL,
                orderId, "Thưởng giới thiệu khách hàng mới",
                wallet.getBalance(), expiresAt);
        transactionRepository.save(transaction);

        log.info("User {} earned {} points from referral", referrerId, pointsToEarn);
        return toTransactionResponse(transaction);
    }

    // ========== SPEND POINTS ==========

    @Override
    public RedeemCalculation calculateRedemption(Long userId, BigDecimal orderTotal, Integer pointsToUse) {
        UserPointsWallet wallet = getOrCreateWallet(userId);

        // Check minimum order value
        if (orderTotal.compareTo(MIN_ORDER_VALUE) < 0) {
            return RedeemCalculation.builder()
                    .canUse(false)
                    .reason("Đơn hàng tối thiểu " + MIN_ORDER_VALUE.intValue() + "đ để sử dụng xu")
                    .pointsRequested(pointsToUse)
                    .pointsAvailable(wallet.getBalance())
                    .orderTotal(orderTotal)
                    .valuePerPoint(VALUE_PER_POINT)
                    .minPoints(MIN_POINTS_TO_REDEEM)
                    .minOrderValue(MIN_ORDER_VALUE)
                    .build();
        }

        // Check minimum points
        if (pointsToUse < MIN_POINTS_TO_REDEEM) {
            return RedeemCalculation.builder()
                    .canUse(false)
                    .reason("Tối thiểu " + MIN_POINTS_TO_REDEEM + " xu để sử dụng")
                    .pointsRequested(pointsToUse)
                    .pointsAvailable(wallet.getBalance())
                    .orderTotal(orderTotal)
                    .valuePerPoint(VALUE_PER_POINT)
                    .minPoints(MIN_POINTS_TO_REDEEM)
                    .minOrderValue(MIN_ORDER_VALUE)
                    .build();
        }

        // Check sufficient balance
        if (wallet.getBalance() < pointsToUse) {
            return RedeemCalculation.builder()
                    .canUse(false)
                    .reason("Số dư không đủ. Bạn có " + wallet.getBalance() + " xu")
                    .pointsRequested(pointsToUse)
                    .pointsAvailable(wallet.getBalance())
                    .orderTotal(orderTotal)
                    .valuePerPoint(VALUE_PER_POINT)
                    .minPoints(MIN_POINTS_TO_REDEEM)
                    .minOrderValue(MIN_ORDER_VALUE)
                    .build();
        }

        // Calculate max discount (20% of order)
        BigDecimal maxDiscountAmount = orderTotal.multiply(new BigDecimal(MAX_PERCENT_ORDER))
                .divide(new BigDecimal(100), 0, java.math.RoundingMode.DOWN);
        int maxPointsAllowed = maxDiscountAmount.divide(new BigDecimal(VALUE_PER_POINT), 0,
                java.math.RoundingMode.DOWN).intValue();

        // Apply limits
        int actualPoints = Math.min(pointsToUse, maxPointsAllowed);
        actualPoints = Math.min(actualPoints, wallet.getBalance());

        BigDecimal discountAmount = new BigDecimal(actualPoints * VALUE_PER_POINT);
        BigDecimal finalAmount = orderTotal.subtract(discountAmount);

        String reason = null;
        if (actualPoints < pointsToUse) {
            reason = "Tối đa " + maxPointsAllowed + " xu (20% đơn hàng)";
        }

        return RedeemCalculation.builder()
                .canUse(true)
                .reason(reason)
                .pointsRequested(pointsToUse)
                .pointsAllowed(actualPoints)
                .pointsAvailable(wallet.getBalance())
                .orderTotal(orderTotal)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .maxPercentAllowed(MAX_PERCENT_ORDER)
                .maxDiscountAllowed(maxDiscountAmount)
                .valuePerPoint(VALUE_PER_POINT)
                .minPoints(MIN_POINTS_TO_REDEEM)
                .minOrderValue(MIN_ORDER_VALUE)
                .build();
    }

    @Override
    @Transactional
    public TransactionResponse redeemForOrder(Long userId, Long orderId, Integer pointsAmount) {
        UserPointsWallet wallet = getOrCreateWallet(userId);

        if (!wallet.spendPoints(pointsAmount)) {
            throw new IllegalArgumentException("Số dư xu không đủ");
        }
        walletRepository.save(wallet);

        PointsTransaction transaction = PointsTransaction.spend(
                userId, pointsAmount, PointsTransaction.PointsSource.REDEMPTION,
                orderId, "Đổi xu giảm giá đơn hàng #" + orderId,
                wallet.getBalance());
        transactionRepository.save(transaction);

        log.info("User {} redeemed {} points for order {}", userId, pointsAmount, orderId);
        return toTransactionResponse(transaction);
    }

    // ========== ADMIN ==========

    @Override
    @Transactional
    public TransactionResponse adminAdjust(Long userId, Integer amount, String reason, Long adminId) {
        UserPointsWallet wallet = getOrCreateWallet(userId);

        if (amount > 0) {
            wallet.addPoints(amount);
        } else {
            wallet.spendPoints(Math.abs(amount));
        }
        walletRepository.save(wallet);

        PointsTransaction transaction = PointsTransaction.builder()
                .userId(userId)
                .amount(amount)
                .balanceAfter(wallet.getBalance())
                .transactionType(PointsTransaction.TransactionType.ADMIN_ADJUST)
                .source(PointsTransaction.PointsSource.ADMIN)
                .sourceId(adminId)
                .description("Admin: " + reason)
                .build();
        transactionRepository.save(transaction);

        log.info("Admin {} adjusted {} points for user {}: {}", adminId, amount, userId, reason);
        return toTransactionResponse(transaction);
    }

    @Override
    @Transactional
    public int expireOldPoints() {
        LocalDateTime expireDate = LocalDateTime.now();
        List<PointsTransaction> expiring = transactionRepository.findExpiringPoints(expireDate);

        int count = 0;
        for (PointsTransaction t : expiring) {
            t.setIsExpired(true);
            transactionRepository.save(t);

            UserPointsWallet wallet = walletRepository.findByUserId(t.getUserId()).orElse(null);
            if (wallet != null) {
                wallet.expirePoints(t.getAmount());
                walletRepository.save(wallet);
            }
            count++;
        }

        log.info("Expired {} point transactions", count);
        return count;
    }

    @Override
    public String getConfig(String key) {
        // Can be extended to read from points_config table
        return switch (key) {
            case "VALUE_PER_POINT" -> String.valueOf(VALUE_PER_POINT);
            case "EARN_ORDER_SPEND" -> String.valueOf(EARN_ORDER_SPEND);
            case "MIN_POINTS_TO_REDEEM" -> String.valueOf(MIN_POINTS_TO_REDEEM);
            case "MAX_PERCENT_ORDER" -> String.valueOf(MAX_PERCENT_ORDER);
            default -> null;
        };
    }

    @Override
    public void updateConfig(String key, String value) {
        // Can be extended to update points_config table
        log.info("Config update requested: {} = {}", key, value);
    }

    // ========== HELPER ==========

    private TransactionResponse toTransactionResponse(PointsTransaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .userId(t.getUserId())
                .amount(t.getAmount())
                .balanceAfter(t.getBalanceAfter())
                .transactionType(t.getTransactionType().name())
                .source(t.getSource().name())
                .sourceId(t.getSourceId())
                .description(t.getDescription())
                .expiresAt(t.getExpiresAt())
                .isExpired(t.getIsExpired())
                .createdAt(t.getCreatedAt())
                .valueInVnd((long) Math.abs(t.getAmount()) * VALUE_PER_POINT)
                .build();
    }
}

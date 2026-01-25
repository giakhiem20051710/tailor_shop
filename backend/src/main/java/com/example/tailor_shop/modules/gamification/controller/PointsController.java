package com.example.tailor_shop.modules.gamification.controller;

import com.example.tailor_shop.modules.gamification.dto.*;
import com.example.tailor_shop.modules.gamification.service.PointsService;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Points Controller
 * REST API for Points/Xu system
 */
@RestController
@RequestMapping("/api/v1/points")
@RequiredArgsConstructor
@Slf4j
public class PointsController {

    private final PointsService pointsService;

    // ==================== WALLET ====================

    /**
     * Get current user's wallet
     */
    @GetMapping("/wallet")
    public ResponseEntity<?> getWallet(Authentication auth) {
        Long userId = getUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        WalletResponse wallet = pointsService.getWallet(userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), wallet));
    }

    /**
     * Get points transaction history
     */
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = getUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        List<TransactionResponse> transactions = pointsService.getTransactions(userId, page, size);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), transactions));
    }

    // ==================== CHECK-IN ====================

    /**
     * Daily check-in
     */
    @PostMapping("/checkin")
    public ResponseEntity<?> checkin(Authentication auth) {
        Long userId = getUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        CheckinResponse result = pointsService.checkin(userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), result));
    }

    /**
     * Get check-in status
     */
    @GetMapping("/checkin/status")
    public ResponseEntity<?> getCheckinStatus(Authentication auth) {
        Long userId = getUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        CheckinStatusResponse status = pointsService.getCheckinStatus(userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), status));
    }

    // ==================== REDEMPTION ====================

    /**
     * Calculate points redemption
     */
    @GetMapping("/redeem/calculate")
    public ResponseEntity<?> calculateRedemption(
            Authentication auth,
            @RequestParam BigDecimal orderTotal,
            @RequestParam Integer pointsToUse) {
        Long userId = getUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        RedeemCalculation calculation = pointsService.calculateRedemption(userId, orderTotal, pointsToUse);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), calculation));
    }

    /**
     * Redeem points for order
     */
    @PostMapping("/redeem")
    public ResponseEntity<?> redeemPoints(
            Authentication auth,
            @RequestBody RedeemRequest request) {
        Long userId = getUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            TransactionResponse result = pointsService.redeemForOrder(
                    userId, request.getOrderId(), request.getPointsAmount());
            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ADMIN ====================

    /**
     * Admin adjust points
     */
    @PostMapping("/admin/adjust")
    public ResponseEntity<?> adminAdjust(
            Authentication auth,
            @RequestBody AdminAdjustRequest request) {
        Long adminId = getUserId(auth);
        // TODO: Check admin role

        TransactionResponse result = pointsService.adminAdjust(
                request.getUserId(), request.getAmount(), request.getReason(), adminId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), result));
    }

    // ==================== HELPER ====================

    private Long getUserId(Authentication auth) {
        if (auth == null || auth.getName() == null)
            return null;
        try {
            return Long.parseLong(auth.getName());
        } catch (NumberFormatException e) {
            // May need to look up by phone/email
            return null;
        }
    }

    // ==================== REQUEST DTOs ====================

    @lombok.Data
    public static class RedeemRequest {
        private Long orderId;
        private Integer pointsAmount;
    }

    @lombok.Data
    public static class AdminAdjustRequest {
        private Long userId;
        private Integer amount;
        private String reason;
    }
}

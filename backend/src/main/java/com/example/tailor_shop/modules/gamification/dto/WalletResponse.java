package com.example.tailor_shop.modules.gamification.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * Wallet Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {
    private Long userId;
    private Integer balance;
    private Integer totalEarned;
    private Integer totalSpent;
    private Integer totalExpired;

    // Calculated fields
    private Long valueInVnd; // balance * 500
    private Integer expiringInDays; // Points expiring soon
    private Integer expiringPoints;
}

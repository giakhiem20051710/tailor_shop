package com.example.tailor_shop.modules.gamification.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * Transaction Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private Long userId;
    private Integer amount;
    private Integer balanceAfter;
    private String transactionType; // EARN, SPEND, EXPIRED
    private String source; // ORDER, CHECKIN, REVIEW, etc.
    private Long sourceId;
    private String description;
    private LocalDateTime expiresAt;
    private Boolean isExpired;
    private LocalDateTime createdAt;

    // Calculated
    private Long valueInVnd; // |amount| * 500
}

package com.example.tailor_shop.modules.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO cho review statistics (giống Shopee)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatisticsResponse {

    private Long totalReviews;
    private BigDecimal averageRating; // 0.00 - 5.00
    private Map<Integer, Long> ratingDistribution; // {1: 10, 2: 5, 3: 20, 4: 50, 5: 100}
    private Long reviewsWithImages;
    private Long reviewsWithReply;
    private Long verifiedPurchaseReviews;
}


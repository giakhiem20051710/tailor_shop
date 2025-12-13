package com.example.tailor_shop.modules.review.dto;

import com.example.tailor_shop.modules.review.domain.ReviewStatus;
import com.example.tailor_shop.modules.review.domain.ReviewType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho filter reviews
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewFilterRequest {

    private ReviewType type; // PRODUCT or ORDER
    private Long productId;
    private Long orderId;
    private Long userId; // Reviewer
    private Integer rating; // Filter by rating (1-5)
    private ReviewStatus status; // For admin: PENDING, APPROVED, etc.
    private Boolean hasImages; // Only reviews with images
    private Boolean hasReply; // Only reviews with shop reply
    private Boolean isVerifiedPurchase; // Only verified purchases
    private String keyword; // Search in title/comment
}


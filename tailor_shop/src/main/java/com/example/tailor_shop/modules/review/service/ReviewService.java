package com.example.tailor_shop.modules.review.service;

import com.example.tailor_shop.modules.review.domain.ReviewType;
import com.example.tailor_shop.modules.review.dto.ReplyReviewRequest;
import com.example.tailor_shop.modules.review.dto.ReviewFilterRequest;
import com.example.tailor_shop.modules.review.dto.ReviewRequest;
import com.example.tailor_shop.modules.review.dto.ReviewResponse;
import com.example.tailor_shop.modules.review.dto.ReviewStatisticsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface cho Review module
 */
public interface ReviewService {

    /**
     * List reviews với filter
     */
    Page<ReviewResponse> list(ReviewFilterRequest filter, Pageable pageable, Long currentUserId);

    /**
     * Get review detail
     */
    ReviewResponse detail(Long id, Long currentUserId);

    /**
     * Create product review
     */
    ReviewResponse createProductReview(Long productId, ReviewRequest request, Long userId);

    /**
     * Create order review
     */
    ReviewResponse createOrderReview(Long orderId, ReviewRequest request, Long userId);

    /**
     * Update review (chỉ owner mới được update)
     */
    ReviewResponse update(Long id, ReviewRequest request, Long userId);

    /**
     * Delete review (soft delete, chỉ owner)
     */
    void delete(Long id, Long userId);

    /**
     * Reply to review (shop reply, chỉ staff/admin)
     */
    ReviewResponse reply(Long id, ReplyReviewRequest request, Long repliedBy);

    /**
     * Vote helpful (like review)
     */
    void voteHelpful(Long id, Long userId);

    /**
     * Unvote helpful (unlike review)
     */
    void unvoteHelpful(Long id, Long userId);

    /**
     * Moderate review (approve/reject/hide, chỉ admin)
     */
    ReviewResponse moderate(Long id, String action, String note, Long moderatedBy);

    /**
     * Get review statistics (giống Shopee)
     */
    ReviewStatisticsResponse getStatistics(Long productId, Long orderId, ReviewType type);

    /**
     * Check user đã review product chưa
     */
    boolean hasReviewedProduct(Long productId, Long userId);

    /**
     * Check user đã review order chưa
     */
    boolean hasReviewedOrder(Long orderId, Long userId);
}


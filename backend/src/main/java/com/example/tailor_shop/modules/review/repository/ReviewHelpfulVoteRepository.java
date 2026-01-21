package com.example.tailor_shop.modules.review.repository;

import com.example.tailor_shop.modules.review.domain.ReviewHelpfulVoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewHelpfulVoteRepository extends JpaRepository<ReviewHelpfulVoteEntity, Long> {

    /**
     * Check user đã vote helpful cho review chưa
     */
    Optional<ReviewHelpfulVoteEntity> findByReviewIdAndUserId(Long reviewId, Long userId);

    /**
     * Đếm số helpful votes cho review
     */
    Long countByReviewId(Long reviewId);
}


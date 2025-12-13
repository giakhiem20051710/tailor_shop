package com.example.tailor_shop.modules.review.repository;

import com.example.tailor_shop.modules.review.domain.ReviewImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewImageRepository extends JpaRepository<ReviewImageEntity, Long> {

    List<ReviewImageEntity> findByReviewIdAndIsDeletedFalseOrderByImageOrderAsc(Long reviewId);
}


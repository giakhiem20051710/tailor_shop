package com.example.tailor_shop.modules.review.event;

import com.example.tailor_shop.modules.review.domain.ReviewType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Event được publish khi review được approve
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewApprovedEvent {
    private Long reviewId;
    private ReviewType type;
    private Long productId;
    private Long orderId;
    private Long userId;
    private Integer rating;
    private OffsetDateTime approvedAt;
    private Long moderatedBy;
}


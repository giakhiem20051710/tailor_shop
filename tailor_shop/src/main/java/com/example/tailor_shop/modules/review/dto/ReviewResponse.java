package com.example.tailor_shop.modules.review.dto;

import com.example.tailor_shop.modules.review.domain.ReviewStatus;
import com.example.tailor_shop.modules.review.domain.ReviewType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * DTO cho review response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private ReviewType type;
    private Long productId;
    private String productName;
    private String productImage;
    private Long orderId;
    private String orderCode;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Boolean isAnonymous;
    private Integer rating;
    private String title;
    private String comment;
    private List<String> imageUrls;
    private Integer helpfulCount;
    private Boolean isHelpfulByCurrentUser; // Current user đã vote helpful chưa
    private String replyText;
    private Long repliedById;
    private String repliedByName;
    private OffsetDateTime repliedAt;
    private ReviewStatus status;
    private Boolean isVerifiedPurchase;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


package com.example.tailor_shop.modules.review.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.repository.OrderRepository;
import com.example.tailor_shop.modules.product.domain.ProductEntity;
import com.example.tailor_shop.modules.product.repository.ProductRepository;
import com.example.tailor_shop.modules.review.domain.ReviewEntity;
import com.example.tailor_shop.modules.review.domain.ReviewHelpfulVoteEntity;
import com.example.tailor_shop.modules.review.domain.ReviewImageEntity;
import com.example.tailor_shop.modules.review.domain.ReviewStatus;
import com.example.tailor_shop.modules.review.domain.ReviewType;
import com.example.tailor_shop.modules.review.dto.ReplyReviewRequest;
import com.example.tailor_shop.modules.review.dto.ReviewFilterRequest;
import com.example.tailor_shop.modules.review.dto.ReviewRequest;
import com.example.tailor_shop.modules.review.dto.ReviewResponse;
import com.example.tailor_shop.modules.review.dto.ReviewStatisticsResponse;
import com.example.tailor_shop.modules.review.event.ReviewApprovedEvent;
import com.example.tailor_shop.modules.review.event.ReviewCreatedEvent;
import com.example.tailor_shop.modules.review.repository.ReviewHelpfulVoteRepository;
import com.example.tailor_shop.modules.review.repository.ReviewImageRepository;
import com.example.tailor_shop.modules.review.repository.ReviewRepository;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.modules.review.service.ReviewService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final ReviewHelpfulVoteRepository reviewHelpfulVoteRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> list(ReviewFilterRequest filter, Pageable pageable, Long currentUserId) {
        Page<ReviewEntity> page = reviewRepository.searchReviews(
                filter != null ? filter.getType() : null,
                filter != null ? filter.getProductId() : null,
                filter != null ? filter.getOrderId() : null,
                filter != null ? filter.getUserId() : null,
                filter != null ? filter.getRating() : null,
                filter != null ? filter.getStatus() : ReviewStatus.APPROVED, // Default: chỉ hiển thị approved
                filter != null ? filter.getHasImages() : null,
                filter != null ? filter.getHasReply() : null,
                filter != null ? filter.getIsVerifiedPurchase() : null,
                filter != null ? filter.getKeyword() : null,
                pageable
        );
        return page.map(entity -> toResponse(entity, currentUserId));
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse detail(Long id, Long currentUserId) {
        ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));
        return toResponse(entity, currentUserId);
    }

    @Override
    @Transactional
    public ReviewResponse createProductReview(Long productId, ReviewRequest request, Long userId) {
        // Validate product exists
        ProductEntity product = productRepository.findById(productId)
                .filter(p -> Boolean.FALSE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Product not found"));

        // Check user đã review chưa
        if (reviewRepository.findByProductIdAndUserIdAndIsDeletedFalse(productId, userId).isPresent()) {
            throw new BadRequestException("You have already reviewed this product");
        }

        // Validate order exists và user đã mua (verified purchase)
        // TODO: Check user đã mua product này chưa (từ order_items)
        boolean isVerifiedPurchase = true; // Placeholder

        // Create review
        ReviewEntity entity = ReviewEntity.builder()
                .type(ReviewType.PRODUCT)
                .product(product)
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new NotFoundException("User not found")))
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .isAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false)
                .isVerifiedPurchase(isVerifiedPurchase)
                .status(ReviewStatus.PENDING) // Auto-approve hoặc pending tùy config
                .helpfulCount(0)
                .build();

        entity = reviewRepository.save(entity);

        // Save images
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<ReviewImageEntity> images = new ArrayList<>();
            for (int i = 0; i < request.getImageUrls().size() && i < 9; i++) {
                ReviewImageEntity image = ReviewImageEntity.builder()
                        .review(entity)
                        .imageUrl(request.getImageUrls().get(i))
                        .imageOrder(i)
                        .build();
                images.add(image);
            }
            reviewImageRepository.saveAll(images);
            entity.setImages(images);
        }

        // Update product rating (tính lại average rating)
        updateProductRating(productId);

        // Publish event (side effect)
        ReviewCreatedEvent event = ReviewCreatedEvent.builder()
                .reviewId(entity.getId())
                .type(ReviewType.PRODUCT)
                .productId(productId)
                .userId(userId)
                .rating(request.getRating())
                .createdAt(entity.getCreatedAt())
                .build();
        eventPublisher.publishEvent(event);

        log.info("[TraceId: {}] Product review created: productId={}, userId={}, rating={}",
                TraceIdUtil.getTraceId(), productId, userId, request.getRating());

        return toResponse(entity, userId);
    }

    @Override
    @Transactional
    public ReviewResponse createOrderReview(Long orderId, ReviewRequest request, Long userId) {
        // Validate order exists
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Check order belongs to user
        if (!order.getCustomer().getId().equals(userId)) {
            throw new BadRequestException("You can only review your own orders");
        }

        // Check user đã review chưa
        if (reviewRepository.findByOrderIdAndUserIdAndIsDeletedFalse(orderId, userId).isPresent()) {
            throw new BadRequestException("You have already reviewed this order");
        }

        // Create review
        ReviewEntity entity = ReviewEntity.builder()
                .type(ReviewType.ORDER)
                .order(order)
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new NotFoundException("User not found")))
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .isAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false)
                .isVerifiedPurchase(true) // Order review luôn là verified
                .status(ReviewStatus.PENDING)
                .helpfulCount(0)
                .build();

        entity = reviewRepository.save(entity);

        // Save images
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<ReviewImageEntity> images = new ArrayList<>();
            for (int i = 0; i < request.getImageUrls().size() && i < 9; i++) {
                ReviewImageEntity image = ReviewImageEntity.builder()
                        .review(entity)
                        .imageUrl(request.getImageUrls().get(i))
                        .imageOrder(i)
                        .build();
                images.add(image);
            }
            reviewImageRepository.saveAll(images);
            entity.setImages(images);
        }

        // Publish event (side effect)
        ReviewCreatedEvent event = ReviewCreatedEvent.builder()
                .reviewId(entity.getId())
                .type(ReviewType.ORDER)
                .orderId(orderId)
                .userId(userId)
                .rating(request.getRating())
                .createdAt(entity.getCreatedAt())
                .build();
        eventPublisher.publishEvent(event);

        log.info("[TraceId: {}] Order review created: orderId={}, userId={}, rating={}",
                TraceIdUtil.getTraceId(), orderId, userId, request.getRating());

        return toResponse(entity, userId);
    }

    @Override
    @Transactional
    public ReviewResponse update(Long id, ReviewRequest request, Long userId) {
        ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        // Check ownership
        if (!entity.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only update your own reviews");
        }

        // Check status (chỉ update được nếu chưa được reply)
        if (entity.getReplyText() != null) {
            throw new BadRequestException("Cannot update review that has been replied");
        }

        // Update fields
        entity.setRating(request.getRating());
        entity.setTitle(request.getTitle());
        entity.setComment(request.getComment());
        entity.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false);

        // Update images
        if (request.getImageUrls() != null) {
            // Delete old images
            reviewImageRepository.deleteAll(entity.getImages());
            entity.getImages().clear();

            // Add new images
            List<ReviewImageEntity> images = new ArrayList<>();
            for (int i = 0; i < request.getImageUrls().size() && i < 9; i++) {
                ReviewImageEntity image = ReviewImageEntity.builder()
                        .review(entity)
                        .imageUrl(request.getImageUrls().get(i))
                        .imageOrder(i)
                        .build();
                images.add(image);
            }
            reviewImageRepository.saveAll(images);
            entity.setImages(images);
        }

        entity = reviewRepository.save(entity);

        // Update product rating if product review
        if (entity.getType() == ReviewType.PRODUCT && entity.getProduct() != null) {
            updateProductRating(entity.getProduct().getId());
        }

        return toResponse(entity, userId);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        // Check ownership
        if (!entity.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only delete your own reviews");
        }

        entity.setIsDeleted(true);
        reviewRepository.save(entity);

        // Update product rating if product review
        if (entity.getType() == ReviewType.PRODUCT && entity.getProduct() != null) {
            updateProductRating(entity.getProduct().getId());
        }

        log.info("[TraceId: {}] Review deleted: id={}, userId={}",
                com.example.tailor_shop.common.TraceIdUtil.getTraceId(), id, userId);
    }

    @Override
    @Transactional
    public ReviewResponse reply(Long id, ReplyReviewRequest request, Long repliedBy) {
        ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        if (entity.getReplyText() != null) {
            throw new BadRequestException("Review already has a reply");
        }

        entity.setReplyText(request.getReplyText());
        entity.setRepliedBy(userRepository.findById(repliedBy)
                .orElseThrow(() -> new NotFoundException("User not found")));
        entity.setRepliedAt(OffsetDateTime.now());

        entity = reviewRepository.save(entity);

        log.info("[TraceId: {}] Review replied: id={}, repliedBy={}",
                com.example.tailor_shop.common.TraceIdUtil.getTraceId(), id, repliedBy);

        return toResponse(entity, null);
    }

    @Override
    @Transactional
    public void voteHelpful(Long id, Long userId) {
        ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        // Check đã vote chưa
        if (reviewHelpfulVoteRepository.findByReviewIdAndUserId(id, userId).isPresent()) {
            throw new BadRequestException("You have already voted helpful for this review");
        }

        // Create vote
        ReviewHelpfulVoteEntity vote = ReviewHelpfulVoteEntity.builder()
                .review(entity)
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new NotFoundException("User not found")))
                .build();
        reviewHelpfulVoteRepository.save(vote);

        // Update helpful count
        entity.setHelpfulCount(reviewHelpfulVoteRepository.countByReviewId(id).intValue());
        reviewRepository.save(entity);
    }

    @Override
    @Transactional
    public void unvoteHelpful(Long id, Long userId) {
        ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        ReviewHelpfulVoteEntity vote = reviewHelpfulVoteRepository.findByReviewIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("You have not voted helpful for this review"));

        reviewHelpfulVoteRepository.delete(vote);

        // Update helpful count
        entity.setHelpfulCount(reviewHelpfulVoteRepository.countByReviewId(id).intValue());
        reviewRepository.save(entity);
    }

    @Override
    @Transactional
    public ReviewResponse moderate(Long id, String action, String note, Long moderatedBy) {
        ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        ReviewStatus newStatus;
        switch (action.toUpperCase()) {
            case "APPROVE":
                newStatus = ReviewStatus.APPROVED;
                break;
            case "REJECT":
                newStatus = ReviewStatus.REJECTED;
                break;
            case "HIDE":
                newStatus = ReviewStatus.HIDDEN;
                break;
            default:
                throw new BadRequestException("Invalid action. Must be: APPROVE, REJECT, or HIDE");
        }

        entity.setStatus(newStatus);
        entity.setModerationNote(note);
        entity.setModeratedBy(userRepository.findById(moderatedBy)
                .orElseThrow(() -> new NotFoundException("User not found")));
        entity.setModeratedAt(OffsetDateTime.now());

        entity = reviewRepository.save(entity);

        // Update product rating if approved/rejected
        if (entity.getType() == ReviewType.PRODUCT && entity.getProduct() != null) {
            updateProductRating(entity.getProduct().getId());
        }

        // Publish event nếu được approve (side effect)
        if (newStatus == ReviewStatus.APPROVED) {
            ReviewApprovedEvent event = ReviewApprovedEvent.builder()
                    .reviewId(entity.getId())
                    .type(entity.getType())
                    .productId(entity.getProduct() != null ? entity.getProduct().getId() : null)
                    .orderId(entity.getOrder() != null ? entity.getOrder().getId() : null)
                    .userId(entity.getUser().getId())
                    .rating(entity.getRating())
                    .approvedAt(entity.getModeratedAt())
                    .moderatedBy(moderatedBy)
                    .build();
            eventPublisher.publishEvent(event);
        }

        log.info("[TraceId: {}] Review moderated: id={}, action={}, moderatedBy={}",
                TraceIdUtil.getTraceId(), id, action, moderatedBy);

        return toResponse(entity, null);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewStatisticsResponse getStatistics(Long productId, Long orderId, ReviewType type) {
        ReviewFilterRequest filter = ReviewFilterRequest.builder()
                .type(type)
                .productId(productId)
                .orderId(orderId)
                .status(ReviewStatus.APPROVED)
                .build();

        Page<ReviewEntity> allReviews = reviewRepository.searchReviews(
                filter.getType(),
                filter.getProductId(),
                filter.getOrderId(),
                null,
                null,
                filter.getStatus(),
                null,
                null,
                null,
                null,
                Pageable.unpaged()
        );

        List<ReviewEntity> reviews = allReviews.getContent();

        // Calculate statistics
        long totalReviews = reviews.size();
        double avgRating = reviews.stream()
                .mapToInt(ReviewEntity::getRating)
                .average()
                .orElse(0.0);

        // Rating distribution
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            final int rating = i;
            long count = reviews.stream()
                    .filter(r -> r.getRating() == rating)
                    .count();
            ratingDistribution.put(rating, count);
        }

        // Reviews with images
        long reviewsWithImages = reviews.stream()
                .filter(r -> !r.getImages().isEmpty())
                .count();

        // Reviews with reply
        long reviewsWithReply = reviews.stream()
                .filter(r -> r.getReplyText() != null)
                .count();

        // Verified purchase reviews
        long verifiedPurchaseReviews = reviews.stream()
                .filter(ReviewEntity::getIsVerifiedPurchase)
                .count();

        return ReviewStatisticsResponse.builder()
                .totalReviews(totalReviews)
                .averageRating(BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP))
                .ratingDistribution(ratingDistribution)
                .reviewsWithImages(reviewsWithImages)
                .reviewsWithReply(reviewsWithReply)
                .verifiedPurchaseReviews(verifiedPurchaseReviews)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasReviewedProduct(Long productId, Long userId) {
        return reviewRepository.findByProductIdAndUserIdAndIsDeletedFalse(productId, userId).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasReviewedOrder(Long orderId, Long userId) {
        return reviewRepository.findByOrderIdAndUserIdAndIsDeletedFalse(orderId, userId).isPresent();
    }

    /**
     * Convert entity to response DTO
     */
    private ReviewResponse toResponse(ReviewEntity entity, Long currentUserId) {
        // Load images
        List<ReviewImageEntity> images = reviewImageRepository.findByReviewIdAndIsDeletedFalseOrderByImageOrderAsc(entity.getId());
        List<String> imageUrls = images.stream()
                .map(ReviewImageEntity::getImageUrl)
                .collect(Collectors.toList());

        // Check if current user voted helpful
        Boolean isHelpfulByCurrentUser = null;
        if (currentUserId != null) {
            isHelpfulByCurrentUser = reviewHelpfulVoteRepository.findByReviewIdAndUserId(entity.getId(), currentUserId)
                    .isPresent();
        }

        return ReviewResponse.builder()
                .id(entity.getId())
                .type(entity.getType())
                .productId(entity.getProduct() != null ? entity.getProduct().getId() : null)
                .productName(entity.getProduct() != null ? entity.getProduct().getName() : null)
                .productImage(entity.getProduct() != null ? entity.getProduct().getImage() : null)
                .orderId(entity.getOrder() != null ? entity.getOrder().getId() : null)
                .orderCode(entity.getOrder() != null ? entity.getOrder().getCode() : null)
                .userId(entity.getUser().getId())
                .userName(entity.getIsAnonymous() ? "Anonymous" : entity.getUser().getName())
                .userAvatar(null) // TODO: Add avatar field to UserEntity if needed
                .isAnonymous(entity.getIsAnonymous())
                .rating(entity.getRating())
                .title(entity.getTitle())
                .comment(entity.getComment())
                .imageUrls(imageUrls)
                .helpfulCount(entity.getHelpfulCount())
                .isHelpfulByCurrentUser(isHelpfulByCurrentUser)
                .replyText(entity.getReplyText())
                .repliedById(entity.getRepliedBy() != null ? entity.getRepliedBy().getId() : null)
                .repliedByName(entity.getRepliedBy() != null ? entity.getRepliedBy().getName() : null)
                .repliedAt(entity.getRepliedAt())
                .status(entity.getStatus())
                .isVerifiedPurchase(entity.getIsVerifiedPurchase())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Update product average rating
     */
    private void updateProductRating(Long productId) {
        Double avgRating = reviewRepository.calculateAverageRatingByProductId(productId);
        if (avgRating != null) {
            ProductEntity product = productRepository.findById(productId)
                    .orElseThrow(() -> new NotFoundException("Product not found"));
            product.setRating(BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP));
            productRepository.save(product);
        }
    }
}


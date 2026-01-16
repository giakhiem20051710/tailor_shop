package com.example.tailor_shop.modules.review.service.impl;

import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.repository.OrderRepository;
import com.example.tailor_shop.modules.product.domain.ImageAssetEntity;
import com.example.tailor_shop.modules.product.domain.ProductEntity;
import com.example.tailor_shop.modules.product.repository.ImageAssetRepository;
import com.example.tailor_shop.modules.product.repository.ProductRepository;
import com.example.tailor_shop.modules.review.domain.*;
import com.example.tailor_shop.modules.review.dto.ReplyReviewRequest;
import com.example.tailor_shop.modules.review.dto.ReviewFilterRequest;
import com.example.tailor_shop.modules.review.dto.ReviewRequest;
import com.example.tailor_shop.modules.review.dto.ReviewResponse;
import com.example.tailor_shop.modules.review.dto.ReviewStatisticsResponse;
import com.example.tailor_shop.modules.review.event.ReviewCreatedEvent;
import com.example.tailor_shop.modules.review.repository.ReviewHelpfulVoteRepository;
import com.example.tailor_shop.modules.review.repository.ReviewImageRepository;
import com.example.tailor_shop.modules.review.repository.ReviewRepository;
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
import java.util.List;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;

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
        private final ImageAssetRepository imageAssetRepository;
        private final ApplicationEventPublisher eventPublisher;

        @Override
        @Transactional(readOnly = true)
        public Page<ReviewResponse> list(ReviewFilterRequest filter, Pageable pageable, Long currentUserId) {
                Page<ReviewEntity> page = reviewRepository.searchReviews(
                                filter != null ? filter.getType() : null,
                                filter != null ? filter.getProductId() : null,
                                filter != null ? filter.getImageAssetId() : null,
                                filter != null ? filter.getOrderId() : null,
                                filter != null ? filter.getUserId() : null,
                                filter != null ? filter.getRating() : null,
                                filter != null ? filter.getStatus() : ReviewStatus.APPROVED,
                                filter != null ? filter.getHasImages() : null,
                                filter != null ? filter.getHasReply() : null,
                                filter != null ? filter.getIsVerifiedPurchase() : null,
                                filter != null ? filter.getKeyword() : null,
                                pageable);
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
                ProductEntity product = productRepository.findById(productId)
                                .orElseThrow(() -> new NotFoundException("Product not found"));

                if (reviewRepository.findByProductIdAndUserIdAndIsDeletedFalse(productId, userId).isPresent()) {
                        throw new BadRequestException("You have already reviewed this product");
                }

                boolean isVerified = true;

                ReviewEntity entity = ReviewEntity.builder()
                                .type(ReviewType.PRODUCT)
                                .product(product)
                                .user(userRepository.findById(userId)
                                                .orElseThrow(() -> new NotFoundException("User not found")))
                                .rating(request.getRating())
                                .title(request.getTitle())
                                .comment(request.getComment())
                                .isAnonymous(Boolean.TRUE.equals(request.getIsAnonymous()))
                                .isVerifiedPurchase(isVerified)
                                .status(ReviewStatus.PENDING)
                                .helpfulCount(0)
                                .build();

                entity = reviewRepository.save(entity);
                saveImages(entity, request.getImageUrls());

                updateProductRating(productId);

                publishReviewCreatedEvent(entity, userId);

                return toResponse(entity, userId);
        }

        @Override
        @Transactional
        public ReviewResponse createOrderReview(Long orderId, ReviewRequest request, Long userId) {
                OrderEntity order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new NotFoundException("Order not found"));

                if (!order.getCustomer().getId().equals(userId)) {
                        throw new BadRequestException("You can only review your own orders"); // Changed to BadRequest
                                                                                              // if Forbidden missing
                }

                ReviewEntity entity = ReviewEntity.builder()
                                .type(ReviewType.ORDER)
                                .order(order)
                                .user(userRepository.findById(userId)
                                                .orElseThrow(() -> new NotFoundException("User not found")))
                                .rating(request.getRating())
                                .title(request.getTitle())
                                .comment(request.getComment())
                                .isAnonymous(Boolean.TRUE.equals(request.getIsAnonymous()))
                                .isVerifiedPurchase(true)
                                .status(ReviewStatus.PENDING)
                                .helpfulCount(0)
                                .build();

                entity = reviewRepository.save(entity);
                saveImages(entity, request.getImageUrls());

                publishReviewCreatedEvent(entity, userId);

                return toResponse(entity, userId);
        }

        @Override
        @Transactional
        public ReviewResponse createImageAssetReview(Long imageAssetId, ReviewRequest request, Long userId) {
                ImageAssetEntity imageAsset = imageAssetRepository.findById(imageAssetId)
                                .orElseThrow(() -> new NotFoundException("Image Asset not found"));

                if (reviewRepository.findByImageAssetIdAndUserIdAndIsDeletedFalse(imageAssetId, userId).isPresent()) {
                        throw new BadRequestException("You have already reviewed this design");
                }

                ReviewEntity entity = ReviewEntity.builder()
                                .type(ReviewType.IMAGE_ASSET)
                                .imageAsset(imageAsset)
                                .user(userRepository.findById(userId)
                                                .orElseThrow(() -> new NotFoundException("User not found")))
                                .rating(request.getRating())
                                .title(request.getTitle())
                                .comment(request.getComment())
                                .isAnonymous(Boolean.TRUE.equals(request.getIsAnonymous()))
                                .isVerifiedPurchase(false)
                                .status(ReviewStatus.PENDING)
                                .helpfulCount(0)
                                .build();

                entity = reviewRepository.save(entity);
                saveImages(entity, request.getImageUrls());

                publishReviewCreatedEvent(entity, userId);

                return toResponse(entity, userId);
        }

        @Override
        @Transactional
        public ReviewResponse update(Long id, ReviewRequest request, Long userId) {
                ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException("Review not found"));

                if (!entity.getUser().getId().equals(userId)) {
                        throw new BadRequestException("You can only update your own review");
                }

                entity.setRating(request.getRating());
                entity.setTitle(request.getTitle());
                entity.setComment(request.getComment());
                entity.setIsAnonymous(Boolean.TRUE.equals(request.getIsAnonymous()));
                entity.setStatus(ReviewStatus.PENDING);

                reviewImageRepository.deleteAll(entity.getImages());
                entity.getImages().clear();
                saveImages(entity, request.getImageUrls());

                ReviewEntity saved = reviewRepository.save(entity);

                if (entity.getType() == ReviewType.PRODUCT && entity.getProduct() != null) {
                        updateProductRating(entity.getProduct().getId());
                }

                return toResponse(saved, userId);
        }

        @Override
        @Transactional
        public void delete(Long id, Long userId) {
                ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException("Review not found"));

                if (!entity.getUser().getId().equals(userId)) {
                        throw new BadRequestException("You can only delete your own review");
                }

                entity.setIsDeleted(true);
                reviewRepository.save(entity);

                if (entity.getType() == ReviewType.PRODUCT && entity.getProduct() != null) {
                        updateProductRating(entity.getProduct().getId());
                }
        }

        @Override
        @Transactional
        public ReviewResponse reply(Long id, ReplyReviewRequest request, Long repliedBy) {
                ReviewEntity entity = reviewRepository.findByIdAndIsDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException("Review not found"));

                entity.setReplyText(request.getReplyText());
                entity.setRepliedBy(userRepository.findById(repliedBy).orElse(null));
                entity.setRepliedAt(OffsetDateTime.now());

                return toResponse(reviewRepository.save(entity), repliedBy);
        }

        @Override
        @Transactional
        public void voteHelpful(Long id, Long userId) {
                ReviewEntity review = reviewRepository.findByIdAndIsDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException("Review not found"));

                if (!reviewHelpfulVoteRepository.findByReviewIdAndUserId(id, userId).isPresent()) {
                        UserEntity user = userRepository.findById(userId)
                                        .orElseThrow(() -> new NotFoundException("User not found"));
                        ReviewHelpfulVoteEntity vote = ReviewHelpfulVoteEntity.builder()
                                        .review(review)
                                        .user(user)
                                        .build();
                        reviewHelpfulVoteRepository.save(vote);

                        review.setHelpfulCount(review.getHelpfulCount() + 1);
                        reviewRepository.save(review);
                }
        }

        @Override
        @Transactional
        public void unvoteHelpful(Long id, Long userId) {
                ReviewEntity review = reviewRepository.findByIdAndIsDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException("Review not found"));

                reviewHelpfulVoteRepository.findByReviewIdAndUserId(id, userId).ifPresent(vote -> {
                        reviewHelpfulVoteRepository.delete(vote);
                        review.setHelpfulCount(Math.max(0, review.getHelpfulCount() - 1));
                        reviewRepository.save(review);
                });
        }

        @Override
        @Transactional
        public ReviewResponse moderate(Long id, String action, String note, Long moderatedBy) {
                ReviewEntity entity = reviewRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Review not found"));

                switch (action.toUpperCase()) {
                        case "APPROVE":
                                entity.setStatus(ReviewStatus.APPROVED);
                                break;
                        case "REJECT":
                                entity.setStatus(ReviewStatus.REJECTED);
                                break;
                        case "HIDE":
                                entity.setStatus(ReviewStatus.HIDDEN);
                                break;
                        default:
                                throw new BadRequestException("Invalid action: " + action);
                }

                entity.setModerationNote(note);
                entity.setModeratedBy(userRepository.findById(moderatedBy).orElse(null));
                entity.setModeratedAt(OffsetDateTime.now());

                ReviewEntity saved = reviewRepository.save(entity);

                if (entity.getType() == ReviewType.PRODUCT && entity.getProduct() != null) {
                        updateProductRating(entity.getProduct().getId());
                }

                return toResponse(saved, moderatedBy);
        }

        @Override
        @Transactional(readOnly = true)
        public ReviewStatisticsResponse getStatistics(Long productId, Long imageAssetId, Long orderId,
                        ReviewType type) {
                Double avgRating = 0.0;

                ReviewStatisticsResponse.ReviewStatisticsResponseBuilder builder = ReviewStatisticsResponse.builder();
                long totalReviews = 0;
                Map<Integer, Long> distribution = new HashMap<>();
                for (int i = 1; i <= 5; i++) {
                        distribution.put(i, 0L);
                }

                if (productId != null) {
                        avgRating = reviewRepository.calculateAverageRatingByProductId(productId);
                        totalReviews = reviewRepository.countByProductIdAndStatusAndIsDeletedFalse(productId,
                                        ReviewStatus.APPROVED);
                        List<Object[]> stats = reviewRepository.countReviewsByRatingForProduct(productId);
                        for (Object[] stat : stats) {
                                Integer rating = (Integer) stat[0];
                                Long count = (Long) stat[1];
                                distribution.put(rating, count);
                        }
                } else if (imageAssetId != null) {
                        avgRating = reviewRepository.calculateAverageRatingByImageAssetId(imageAssetId);
                        totalReviews = reviewRepository.countByImageAssetIdAndStatusAndIsDeletedFalse(imageAssetId,
                                        ReviewStatus.APPROVED);
                        List<Object[]> stats = reviewRepository.countReviewsByRatingForImageAsset(imageAssetId);
                        for (Object[] stat : stats) {
                                Integer rating = (Integer) stat[0];
                                Long count = (Long) stat[1];
                                distribution.put(rating, count);
                        }
                }

                if (avgRating == null)
                        avgRating = 0.0;

                return builder
                                .averageRating(BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP))
                                .totalReviews(totalReviews)
                                .ratingDistribution(distribution)
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
                return false;
        }

        @Override
        @Transactional(readOnly = true)
        public boolean hasReviewedImageAsset(Long imageAssetId, Long userId) {
                return reviewRepository.findByImageAssetIdAndUserIdAndIsDeletedFalse(imageAssetId, userId).isPresent();
        }

        // === Helpers ===

        private void saveImages(ReviewEntity review, List<String> imageUrls) {
                if (imageUrls != null && !imageUrls.isEmpty()) {
                        List<ReviewImageEntity> images = new ArrayList<>();
                        for (int i = 0; i < imageUrls.size() && i < 9; i++) {
                                ReviewImageEntity image = ReviewImageEntity.builder()
                                                .review(review)
                                                .imageUrl(imageUrls.get(i))
                                                .imageOrder(i)
                                                .build();
                                images.add(image);
                        }
                        reviewImageRepository.saveAll(images);
                }
        }

        private void updateProductRating(Long productId) {
                Double avgRating = reviewRepository.calculateAverageRatingByProductId(productId);
                if (avgRating != null) {
                        ProductEntity product = productRepository.findById(productId)
                                        .orElseThrow(() -> new NotFoundException("Product not found"));
                        product.setRating(BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP));
                        productRepository.save(product);
                }
        }

        private void publishReviewCreatedEvent(ReviewEntity entity, Long userId) {
                ReviewCreatedEvent event = ReviewCreatedEvent.builder()
                                .reviewId(entity.getId())
                                .type(entity.getType())
                                .userId(userId)
                                .rating(entity.getRating())
                                .createdAt(entity.getCreatedAt())
                                .build();
                eventPublisher.publishEvent(event);
                log.info("[TraceId: {}] Review created: type={}, id={}, userId={}, rating={}",
                                TraceIdUtil.getTraceId(), entity.getType(), entity.getId(), userId, entity.getRating());
        }

        private ReviewResponse toResponse(ReviewEntity entity, Long currentUserId) {
                boolean isHelpfulByCurrentUser = false;
                if (currentUserId != null) {
                        isHelpfulByCurrentUser = reviewHelpfulVoteRepository
                                        .findByReviewIdAndUserId(entity.getId(), currentUserId).isPresent();
                }

                ReviewResponse.ReviewResponseBuilder builder = ReviewResponse.builder()
                                .id(entity.getId())
                                .type(entity.getType())
                                .userId(entity.getUser().getId())
                                .userAvatar(null)
                                .isAnonymous(entity.getIsAnonymous())
                                .rating(entity.getRating())
                                .title(entity.getTitle())
                                .comment(entity.getComment())
                                .helpfulCount(entity.getHelpfulCount())
                                .isHelpfulByCurrentUser(isHelpfulByCurrentUser)
                                .replyText(entity.getReplyText())
                                .status(entity.getStatus())
                                .isVerifiedPurchase(entity.getIsVerifiedPurchase())
                                .createdAt(entity.getCreatedAt())
                                .updatedAt(entity.getUpdatedAt());

                if (Boolean.TRUE.equals(entity.getIsAnonymous())) {
                        builder.userName(maskUserName(entity.getUser().getName()));
                        builder.userAvatar(null);
                } else {
                        builder.userName(entity.getUser().getName());
                }

                if (entity.getImages() != null) {
                        builder.imageUrls(entity.getImages().stream()
                                        .map(ReviewImageEntity::getImageUrl)
                                        .collect(Collectors.toList()));
                }

                if (entity.getProduct() != null) {
                        builder.productId(entity.getProduct().getId())
                                        .productName(entity.getProduct().getName())
                                        .productImage(entity.getProduct().getImage());
                }
                if (entity.getOrder() != null) {
                        builder.orderId(entity.getOrder().getId())
                                        .orderCode(entity.getOrder().getCode());
                }

                if (entity.getRepliedBy() != null) {
                        builder.repliedById(entity.getRepliedBy().getId())
                                        .repliedByName(entity.getRepliedBy().getName())
                                        .repliedAt(entity.getRepliedAt());
                }

                return builder.build();
        }

        private String maskUserName(String name) {
                if (name == null || name.length() < 2)
                        return "***";
                return name.charAt(0) + "***" + name.charAt(name.length() - 1);
        }
}

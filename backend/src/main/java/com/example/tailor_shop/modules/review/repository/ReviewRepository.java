package com.example.tailor_shop.modules.review.repository;

import com.example.tailor_shop.modules.review.domain.ReviewEntity;
import com.example.tailor_shop.modules.review.domain.ReviewStatus;
import com.example.tailor_shop.modules.review.domain.ReviewType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {

        /**
         * Tìm review theo ID và không bị xóa
         */
        Optional<ReviewEntity> findByIdAndIsDeletedFalse(Long id);

        /**
         * Tìm review theo product và user (để check đã review chưa)
         */
        Optional<ReviewEntity> findByProductIdAndUserIdAndIsDeletedFalse(Long productId, Long userId);

        /**
         * Tìm review theo image asset và user (để check đã review chưa)
         */
        Optional<ReviewEntity> findByImageAssetIdAndUserIdAndIsDeletedFalse(Long imageAssetId, Long userId);

        /**
         * Search reviews với filter
         */
        @Query("SELECT r FROM ReviewEntity r " +
                        "WHERE r.isDeleted = false " +
                        "AND (:type IS NULL OR r.type = :type) " +
                        "AND (:productId IS NULL OR r.product.id = :productId) " +
                        "AND (:imageAssetId IS NULL OR r.imageAsset.id = :imageAssetId) " +
                        "AND (:orderId IS NULL OR r.order.id = :orderId) " +
                        "AND (:userId IS NULL OR r.user.id = :userId) " +
                        "AND (:rating IS NULL OR r.rating = :rating) " +
                        "AND (:status IS NULL OR r.status = :status) " +
                        "AND (:hasImages IS NULL OR :hasImages = true OR :hasImages = false) " +
                        "AND ( " +
                        "     :hasReply IS NULL " +
                        "     OR (:hasReply = true AND r.replyText IS NOT NULL) " +
                        "     OR (:hasReply = false AND r.replyText IS NULL) " +
                        ") " +
                        "AND (:isVerifiedPurchase IS NULL OR r.isVerifiedPurchase = :isVerifiedPurchase) " +
                        "AND ( " +
                        "     :keyword IS NULL " +
                        "     OR LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "     OR LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        ")")
        Page<ReviewEntity> searchReviews(
                        @Param("type") ReviewType type,
                        @Param("productId") Long productId,
                        @Param("imageAssetId") Long imageAssetId,
                        @Param("orderId") Long orderId,
                        @Param("userId") Long userId,
                        @Param("rating") Integer rating,
                        @Param("status") ReviewStatus status,
                        @Param("hasImages") Boolean hasImages,
                        @Param("hasReply") Boolean hasReply,
                        @Param("isVerifiedPurchase") Boolean isVerifiedPurchase,
                        @Param("keyword") String keyword,
                        Pageable pageable);

        /**
         * Đếm số review theo product và status
         */
        Long countByProductIdAndStatusAndIsDeletedFalse(Long productId, ReviewStatus status);

        /**
         * Đếm số review theo order và status
         */
        Long countByOrderIdAndStatusAndIsDeletedFalse(Long orderId, ReviewStatus status);

        /**
         * Tính average rating theo product
         */
        @Query("SELECT AVG(r.rating) FROM ReviewEntity r " +
                        "WHERE r.product.id = :productId AND r.status = 'APPROVED' AND r.isDeleted = false")
        Double calculateAverageRatingByProductId(@Param("productId") Long productId);

        /**
         * Tính average rating theo image asset
         */
        @Query("SELECT AVG(r.rating) FROM ReviewEntity r " +
                        "WHERE r.imageAsset.id = :imageAssetId AND r.status = 'APPROVED' AND r.isDeleted = false")
        Double calculateAverageRatingByImageAssetId(@Param("imageAssetId") Long imageAssetId);

        /**
         * Đếm số review theo image asset và status
         */
        Long countByImageAssetIdAndStatusAndIsDeletedFalse(Long imageAssetId, ReviewStatus status);

        /**
         * Lấy distribution rating cho product
         */
        @Query("SELECT r.rating, COUNT(r) FROM ReviewEntity r " +
                        "WHERE r.product.id = :productId AND r.status = 'APPROVED' AND r.isDeleted = false " +
                        "GROUP BY r.rating")
        List<Object[]> countReviewsByRatingForProduct(@Param("productId") Long productId);

        /**
         * Lấy distribution rating cho image asset
         */
        @Query("SELECT r.rating, COUNT(r) FROM ReviewEntity r " +
                        "WHERE r.imageAsset.id = :imageAssetId AND r.status = 'APPROVED' AND r.isDeleted = false " +
                        "GROUP BY r.rating")
        List<Object[]> countReviewsByRatingForImageAsset(@Param("imageAssetId") Long imageAssetId);
}

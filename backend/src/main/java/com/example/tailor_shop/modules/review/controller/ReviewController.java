package com.example.tailor_shop.modules.review.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.review.dto.ReplyReviewRequest;
import com.example.tailor_shop.modules.review.dto.ReviewFilterRequest;
import com.example.tailor_shop.modules.review.dto.ReviewRequest;
import com.example.tailor_shop.modules.review.dto.ReviewResponse;
import com.example.tailor_shop.modules.review.dto.ReviewStatisticsResponse;
import com.example.tailor_shop.modules.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Review Controller - Hỗ trợ Product Review và Order Review (giống Shopee)
 */
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * List reviews với filter (public - chỉ hiển thị approved)
     */
    @GetMapping
    public ResponseEntity<CommonResponse<Page<ReviewResponse>>> list(
            @Valid ReviewFilterRequest filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Long currentUserId = principal != null ? principal.getId() : null;
        Page<ReviewResponse> data = reviewService.list(filter, pageable, currentUserId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Get review detail (public)
     */
    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<ReviewResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Long currentUserId = principal != null ? principal.getId() : null;
        ReviewResponse data = reviewService.detail(id, currentUserId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Create product review (customer only)
     */
    @PostMapping("/products/{productId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<ReviewResponse>> createProductReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        ReviewResponse data = reviewService.createProductReview(productId, request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Create order review (customer only)
     */
    @PostMapping("/orders/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<ReviewResponse>> createOrderReview(
            @PathVariable Long orderId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        ReviewResponse data = reviewService.createOrderReview(orderId, request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Create image asset review (customer only)
     */
    @PostMapping("/image-assets/{imageAssetId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<ReviewResponse>> createImageAssetReview(
            @PathVariable Long imageAssetId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        ReviewResponse data = reviewService.createImageAssetReview(imageAssetId, request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Update review (chỉ owner)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<ReviewResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        ReviewResponse data = reviewService.update(id, request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    // ... (keep delete, reply, votes, moderate as is)
    /**
     * Delete review (chỉ owner)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        reviewService.delete(id, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Reply to review (shop reply, staff/admin only)
     */
    @PostMapping("/{id}/reply")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<ReviewResponse>> reply(
            @PathVariable Long id,
            @Valid @RequestBody ReplyReviewRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        ReviewResponse data = reviewService.reply(id, request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Vote helpful (like review)
     */
    @PostMapping("/{id}/helpful")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Void>> voteHelpful(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        reviewService.voteHelpful(id, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Unvote helpful (unlike review)
     */
    @DeleteMapping("/{id}/helpful")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Void>> unvoteHelpful(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        reviewService.unvoteHelpful(id, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Moderate review (approve/reject/hide, admin only)
     */
    @PatchMapping("/{id}/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonResponse<ReviewResponse>> moderate(
            @PathVariable Long id,
            @RequestParam String action, // APPROVE, REJECT, HIDE
            @RequestParam(required = false) String note,
            @AuthenticationPrincipal CustomUserDetails principal) {
        ReviewResponse data = reviewService.moderate(id, action, note, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Get review statistics (giống Shopee)
     */
    @GetMapping("/statistics")
    public ResponseEntity<CommonResponse<ReviewStatisticsResponse>> getStatistics(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long imageAssetId,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) String type // PRODUCT or ORDER or IMAGE_ASSET
    ) {
        com.example.tailor_shop.modules.review.domain.ReviewType reviewType = null;
        if (type != null) {
            reviewType = com.example.tailor_shop.modules.review.domain.ReviewType.valueOf(type.toUpperCase());
        }
        ReviewStatisticsResponse data = reviewService.getStatistics(productId, imageAssetId, orderId, reviewType);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Check if user has reviewed product
     */
    @GetMapping("/products/{productId}/check")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<Boolean>> hasReviewedProduct(
            @PathVariable Long productId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        boolean hasReviewed = reviewService.hasReviewedProduct(productId, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), hasReviewed));
    }

    /**
     * Check if user has reviewed order
     */
    @GetMapping("/orders/{orderId}/check")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<Boolean>> hasReviewedOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        boolean hasReviewed = reviewService.hasReviewedOrder(orderId, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), hasReviewed));
    }

    /**
     * Check if user has reviewed image asset
     */
    @GetMapping("/image-assets/{imageAssetId}/check")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<Boolean>> hasReviewedImageAsset(
            @PathVariable Long imageAssetId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        boolean hasReviewed = reviewService.hasReviewedImageAsset(imageAssetId, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), hasReviewed));
    }
}

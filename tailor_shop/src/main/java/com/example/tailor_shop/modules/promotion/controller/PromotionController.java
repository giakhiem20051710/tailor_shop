package com.example.tailor_shop.modules.promotion.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeRequest;
import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeResponse;
import com.example.tailor_shop.modules.promotion.dto.PromotionFilterRequest;
import com.example.tailor_shop.modules.promotion.dto.PromotionRequest;
import com.example.tailor_shop.modules.promotion.dto.PromotionResponse;
import com.example.tailor_shop.modules.promotion.dto.PromotionSuggestionRequest;
import com.example.tailor_shop.modules.promotion.dto.PromotionSuggestionResponse;
import com.example.tailor_shop.modules.promotion.dto.PromotionUsageResponse;
import com.example.tailor_shop.modules.promotion.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping
    public ResponseEntity<CommonResponse<Page<PromotionResponse>>> list(
            @Valid PromotionFilterRequest filter,
            @PageableDefault(size = 20, sort = "priority,desc") Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long currentUserId = principal != null ? principal.getId() : null;
        Page<PromotionResponse> data = promotionService.list(filter, pageable, currentUserId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/active")
    public ResponseEntity<CommonResponse<Page<PromotionResponse>>> listActivePublic(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long currentUserId = principal != null ? principal.getId() : null;
        Page<PromotionResponse> data = promotionService.listActivePublic(pageable, currentUserId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<PromotionResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long currentUserId = principal != null ? principal.getId() : null;
        PromotionResponse data = promotionService.detail(id, currentUserId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<CommonResponse<PromotionResponse>> detailByCode(
            @PathVariable String code,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long currentUserId = principal != null ? principal.getId() : null;
        PromotionResponse data = promotionService.detailByCode(code, currentUserId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<PromotionResponse>> create(
            @Valid @RequestBody PromotionRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long createdBy = principal != null ? principal.getId() : null;
        PromotionResponse data = promotionService.create(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<PromotionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PromotionRequest request
    ) {
        PromotionResponse data = promotionService.update(id, request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Void>> delete(@PathVariable Long id) {
        promotionService.delete(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Void>> activate(@PathVariable Long id) {
        promotionService.activate(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Void>> deactivate(@PathVariable Long id) {
        promotionService.deactivate(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    @PostMapping("/apply")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<ApplyPromoCodeResponse>> applyPromoCode(
            @Valid @RequestBody ApplyPromoCodeRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long userId = principal != null ? principal.getId() : null;
        ApplyPromoCodeResponse data = promotionService.applyPromoCode(request, userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}/usages")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Page<PromotionUsageResponse>>> listUsages(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId,
            @PageableDefault(size = 20, sort = "usedAt,desc") Pageable pageable
    ) {
        Page<PromotionUsageResponse> data = promotionService.listUsages(id, userId, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/my-usages")
    @PreAuthorize("hasAnyRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<Page<PromotionUsageResponse>>> listMyUsages(
            @PageableDefault(size = 20, sort = "usedAt,desc") Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long userId = principal != null ? principal.getId() : null;
        Page<PromotionUsageResponse> data = promotionService.listMyUsages(userId, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    // Shopee-like features

    @GetMapping("/suggestions")
    public ResponseEntity<CommonResponse<List<PromotionSuggestionResponse>>> getSuggestions(
            @Valid PromotionSuggestionRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long userId = principal != null ? principal.getId() : null;
        List<PromotionSuggestionResponse> data = promotionService.getSuggestions(request, userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/available-for-cart")
    public ResponseEntity<CommonResponse<List<PromotionSuggestionResponse>>> getAvailableForCart(
            @Valid PromotionSuggestionRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long userId = principal != null ? principal.getId() : null;
        List<PromotionSuggestionResponse> data = promotionService.getAvailableForCart(request, userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping("/auto-apply")
    @PreAuthorize("hasAnyRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<ApplyPromoCodeResponse>> autoApplyBestPromo(
            @Valid @RequestBody PromotionSuggestionRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long userId = principal != null ? principal.getId() : null;
        ApplyPromoCodeResponse data = promotionService.autoApplyBestPromo(request, userId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }
}


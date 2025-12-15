package com.example.tailor_shop.modules.favorite.controller;

import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.favorite.domain.FavoriteItemType;
import com.example.tailor_shop.modules.favorite.dto.AddFavoriteRequest;
import com.example.tailor_shop.modules.favorite.dto.FavoriteCheckResponse;
import com.example.tailor_shop.modules.favorite.dto.FavoriteResponse;
import com.example.tailor_shop.modules.favorite.service.FavoriteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Favorite Controller - Module riêng, có thể tái sử dụng cho nhiều loại sản phẩm
 * Giống Shopee, FPT Shop: Favorite là module độc lập
 */
@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * Danh sách yêu thích (tất cả loại)
     */
    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<Page<FavoriteResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt,desc") Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Page<FavoriteResponse> data = favoriteService.list(principal.getId(), pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Danh sách yêu thích theo loại (PRODUCT, FABRIC, SERVICE)
     */
    @GetMapping("/type/{itemType}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<Page<FavoriteResponse>>> listByType(
            @PathVariable FavoriteItemType itemType,
            @PageableDefault(size = 20, sort = "createdAt,desc") Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Page<FavoriteResponse> data = favoriteService.listByType(itemType, principal.getId(), pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Thêm vào danh sách yêu thích (generic - hỗ trợ Product, Fabric, Service)
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<FavoriteResponse>> add(
            @Valid @RequestBody AddFavoriteRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        FavoriteResponse data = favoriteService.add(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Xóa khỏi danh sách yêu thích (generic)
     */
    @DeleteMapping("/{itemType}/{itemId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<Void>> remove(
            @PathVariable FavoriteItemType itemType,
            @PathVariable Long itemId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        favoriteService.remove(principal.getId(), itemType, itemId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Xóa khỏi danh sách yêu thích (by key - backward compatibility)
     */
    @DeleteMapping("/key/{itemKey}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<Void>> removeByKey(
            @PathVariable String itemKey,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        favoriteService.removeByKey(principal.getId(), itemKey);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Kiểm tra sản phẩm có trong danh sách yêu thích không (generic)
     */
    @GetMapping("/check/{itemType}/{itemId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<FavoriteCheckResponse>> check(
            @PathVariable FavoriteItemType itemType,
            @PathVariable Long itemId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        FavoriteCheckResponse data = favoriteService.check(principal.getId(), itemType, itemId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Kiểm tra sản phẩm có trong danh sách yêu thích không (by key - backward compatibility)
     */
    @GetMapping("/check")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<com.example.tailor_shop.common.CommonResponse<FavoriteCheckResponse>> checkByKey(
            @RequestParam String itemKey,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        FavoriteCheckResponse data = favoriteService.checkByKey(principal.getId(), itemKey);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }
}


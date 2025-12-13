package com.example.tailor_shop.modules.product.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.product.dto.AddFavoriteRequest;
import com.example.tailor_shop.modules.product.dto.FavoriteCheckResponse;
import com.example.tailor_shop.modules.product.dto.FavoriteResponse;
import com.example.tailor_shop.modules.product.service.FavoriteService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<Page<FavoriteResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt,desc") Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long customerId = principal != null ? principal.getId() : null;
        Page<FavoriteResponse> data = favoriteService.list(customerId, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<FavoriteResponse>> add(
            @Valid @RequestBody AddFavoriteRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long customerId = principal != null ? principal.getId() : null;
        FavoriteResponse data = favoriteService.add(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @DeleteMapping("/{productKey}")
    @PreAuthorize("hasAnyRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<Void>> remove(
            @PathVariable String productKey,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long customerId = principal != null ? principal.getId() : null;
        favoriteService.remove(customerId, productKey);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    @GetMapping("/check")
    @PreAuthorize("hasAnyRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<FavoriteCheckResponse>> check(
            @RequestParam String productKey,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long customerId = principal != null ? principal.getId() : null;
        FavoriteCheckResponse data = favoriteService.check(customerId, productKey);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }
}


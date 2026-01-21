package com.example.tailor_shop.modules.fabric.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.fabric.dto.ApplyFabricPromoRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricFilterRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricHoldRequestRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricHoldRequestResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricInventoryRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricInventoryResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricOrderResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricAIAnalysisRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricAIAnalysisResponse;
import com.example.tailor_shop.modules.fabric.dto.UpdateHoldRequestStatusRequest;
import com.example.tailor_shop.modules.fabric.service.FabricService;
import com.example.tailor_shop.modules.fabric.service.FabricAIService;
import com.example.tailor_shop.config.storage.S3StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Fabric Controller - Quản lý vải (giống Shopee)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/fabrics")
@RequiredArgsConstructor
public class FabricController {

    private final FabricService fabricService;
    private final FabricAIService fabricAIService;
    private final S3StorageService s3StorageService;

    /**
     * List fabrics với filter (public)
     */
    @GetMapping
    public ResponseEntity<CommonResponse<Page<FabricResponse>>> list(
            @Valid FabricFilterRequest filter,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<FabricResponse> data = fabricService.list(filter, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Get fabric detail by ID (public)
     */
    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<FabricResponse>> detail(@PathVariable Long id) {
        FabricResponse data = fabricService.detail(id);
        // Increment view count
        fabricService.incrementViewCount(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Get fabric detail by code (public)
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<CommonResponse<FabricResponse>> detailByCode(@PathVariable String code) {
        FabricResponse data = fabricService.detailByCode(code);
        if (data != null && data.getId() != null) {
            fabricService.incrementViewCount(data.getId());
        }
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Get fabric detail by slug (public)
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<CommonResponse<FabricResponse>> detailBySlug(@PathVariable String slug) {
        FabricResponse data = fabricService.detailBySlug(slug);
        if (data != null && data.getId() != null) {
            fabricService.incrementViewCount(data.getId());
        }
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Create fabric (admin/staff only)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<FabricResponse>> create(
            @Valid @RequestBody FabricRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        FabricResponse data = fabricService.create(request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Update fabric (admin/staff only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<FabricResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody FabricRequest request) {
        FabricResponse data = fabricService.update(id, request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Delete fabric (admin/staff only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Void>> delete(@PathVariable Long id) {
        fabricService.delete(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Upload fabric image to S3 (admin/staff only)
     * Returns the S3 URL of the uploaded image
     */
    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<java.util.Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "File is empty"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(
                        ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "400", "Only image files are allowed"));
            }

            // Upload to S3
            String s3Url = s3StorageService.upload("fabrics", file);
            log.info("📷 Uploaded fabric image to S3: {}", s3Url);

            java.util.Map<String, String> result = new java.util.HashMap<>();
            result.put("url", s3Url);
            result.put("fileName", file.getOriginalFilename());

            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), result));
        } catch (Exception e) {
            log.error("❌ Error uploading fabric image: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                    ResponseUtil.error(TraceIdUtil.getOrCreateTraceId(), "500", "Upload failed: " + e.getMessage()));
        }
    }

    /**
     * AI analyze fabric image (admin/staff only)
     * Gửi ảnh vải để AI phân tích và gợi ý thông tin
     */
    @PostMapping("/ai-analyze")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<FabricAIAnalysisResponse>> aiAnalyzeImage(
            @Valid @RequestBody FabricAIAnalysisRequest request) {
        FabricAIAnalysisResponse data = fabricAIService.analyzeImage(request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Get fabric inventory (admin/staff only)
     */
    @GetMapping("/{id}/inventory")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Page<FabricInventoryResponse>>> getInventory(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<FabricInventoryResponse> data = fabricService.getInventory(id, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Update fabric inventory (admin/staff only)
     */
    @PutMapping("/{id}/inventory")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<FabricInventoryResponse>> updateInventory(
            @PathVariable Long id,
            @Valid @RequestBody FabricInventoryRequest request) {
        FabricInventoryResponse data = fabricService.updateInventory(id, request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Create hold/visit request (customer only)
     */
    @PostMapping("/hold-requests")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<FabricHoldRequestResponse>> createHoldRequest(
            @Valid @RequestBody FabricHoldRequestRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        FabricHoldRequestResponse data = fabricService.createHoldRequest(request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * List hold/visit requests (customer: own requests, staff/admin: all)
     */
    @GetMapping("/hold-requests")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Page<FabricHoldRequestResponse>>> listHoldRequests(
            @RequestParam(required = false) Long fabricId,
            @RequestParam(required = false) Long userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal) {
        // Customer can only see own requests
        if (principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            userId = principal.getId();
        }
        Page<FabricHoldRequestResponse> data = fabricService.listHoldRequests(
                fabricId, userId, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Get hold request detail
     */
    @GetMapping("/hold-requests/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<FabricHoldRequestResponse>> getHoldRequestDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        FabricHoldRequestResponse data = fabricService.getHoldRequestDetail(id);
        // Check ownership for customer
        if (principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            if (data != null && data.getUserId() != null && !data.getUserId().equals(principal.getId())) {
                return ResponseEntity.status(403).build();
            }
        }
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Update hold request status (staff/admin only)
     */
    @PatchMapping("/hold-requests/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<FabricHoldRequestResponse>> updateHoldRequestStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateHoldRequestStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        FabricHoldRequestResponse data = fabricService.updateHoldRequestStatus(
                id, request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Cancel hold request (customer only)
     */
    @DeleteMapping("/hold-requests/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<Void>> cancelHoldRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        fabricService.cancelHoldRequest(id, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Apply promo code khi mua fabric (customer only)
     */
    @PostMapping("/apply-promo")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<FabricOrderResponse>> applyPromoCode(
            @Valid @RequestBody ApplyFabricPromoRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        FabricOrderResponse data = fabricService.applyPromoCode(request, principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }
}

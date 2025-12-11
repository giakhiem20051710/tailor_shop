package com.example.tailor_shop.modules.measurement.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.measurement.dto.MeasurementRequest;
import com.example.tailor_shop.modules.measurement.dto.MeasurementResponse;
import com.example.tailor_shop.modules.measurement.service.MeasurementService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/measurements")
public class MeasurementController {

    private final MeasurementService measurementService;

    public MeasurementController(MeasurementService measurementService) {
        this.measurementService = measurementService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<Page<MeasurementResponse>>> list(
            @RequestParam(value = "customerId", required = false) Long customerId,
            @RequestParam(value = "orderId", required = false) Long orderId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isCustomer = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        Page<MeasurementResponse> data = measurementService.list(customerId, orderId, principal != null ? principal.getId() : null, isCustomer, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<MeasurementResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isCustomer = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        MeasurementResponse data = measurementService.detail(id, principal != null ? principal.getId() : null, isCustomer);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<MeasurementResponse>> create(
            @Valid @RequestBody MeasurementRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        MeasurementResponse data = measurementService.create(request, principal != null ? principal.getId() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<MeasurementResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody MeasurementRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        MeasurementResponse data = measurementService.update(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<List<MeasurementResponse>>> history(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isCustomer = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        List<MeasurementResponse> data = measurementService.history(id, principal != null ? principal.getId() : null, isCustomer);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}/latest")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<MeasurementResponse>> latest(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isCustomer = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        MeasurementResponse data = measurementService.latest(id, principal != null ? principal.getId() : null, isCustomer);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }
}


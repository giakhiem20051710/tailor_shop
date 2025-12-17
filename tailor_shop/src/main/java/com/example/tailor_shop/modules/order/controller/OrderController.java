package com.example.tailor_shop.modules.order.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.modules.order.domain.OrderStatus;
import com.example.tailor_shop.modules.order.dto.OrderResquest;
import com.example.tailor_shop.modules.order.dto.OrderResponse;
import com.example.tailor_shop.modules.order.dto.OrderWizardRequest;
import com.example.tailor_shop.modules.order.dto.UpdateOrderStatusRequest;
import com.example.tailor_shop.modules.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CUSTOMER')")
    public ResponseEntity<CommonResponse<Page<OrderResponse>>> list(
            @RequestParam(value = "status", required = false) OrderStatus status,
            @RequestParam(value = "customerId", required = false) Long customerId,
            @RequestParam(value = "tailorId", required = false) Long tailorId,
            @RequestParam(value = "fromDate", required = false) Instant fromDate,
            @RequestParam(value = "toDate", required = false) Instant toDate,
            @RequestParam(value = "appointmentDate", required = false) java.time.LocalDate appointmentDate,
            @RequestParam(value = "dueDate", required = false) java.time.LocalDate dueDate,
            @RequestParam(value = "search", required = false) String search,
            @PageableDefault(size = 20, sort = "updatedAt") Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        // Nếu là CUSTOMER, chỉ cho phép xem đơn của chính họ
        if (principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            customerId = principal.getId();
        }
        Page<OrderResponse> data = orderService.list(status, customerId, tailorId, fromDate, toDate, appointmentDate, dueDate, search, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<OrderResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        OrderResponse data = orderService.detail(id);
        
        // Nếu là CUSTOMER, chỉ cho phép xem đơn của chính họ
        if (principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            // Kiểm tra quyền truy cập
            if (data.getCustomer() == null || !data.getCustomer().getId().equals(principal.getId())) {
                throw new BadRequestException("Access denied");
            }
        }
        
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping(consumes = {"application/json"})
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<OrderResponse>> create(@Valid @RequestBody OrderResquest request) {
        OrderResponse data = orderService.create(request, null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<OrderResponse>> createWithFiles(
            @RequestPart("request") @Valid OrderResquest request,
            @RequestPart(value = "files", required = false) java.util.List<org.springframework.web.multipart.MultipartFile> files,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        OrderResponse data = orderService.create(request, files != null ? files : java.util.Collections.emptyList());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping("/wizard")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<OrderResponse>> createWizard(
            @Valid @RequestBody OrderWizardRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        if (principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            if (request.getCustomerId() != null && !request.getCustomerId().equals(principal.getId())) {
                throw new BadRequestException("Access denied");
            }
            request.setCustomerId(principal.getId());
        }

        OrderResponse data = orderService.createWizard(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        OrderResponse data = orderService.updateStatus(id, request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}/tracking")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<OrderResponse>> tracking(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isCustomer = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        OrderResponse data = orderService.tracking(id, principal != null ? principal.getId() : null, isCustomer);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping(value = "/{id}/attachments", consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<OrderResponse>> uploadAttachment(
            @PathVariable Long id,
            @RequestPart("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        OrderResponse data = orderService.uploadAttachment(id, file, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }
}

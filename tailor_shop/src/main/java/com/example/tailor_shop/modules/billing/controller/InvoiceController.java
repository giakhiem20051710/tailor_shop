package com.example.tailor_shop.modules.billing.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.billing.dto.InvoiceFilterRequest;
import com.example.tailor_shop.modules.billing.dto.InvoiceRequest;
import com.example.tailor_shop.modules.billing.dto.InvoiceResponse;
import com.example.tailor_shop.modules.billing.dto.PaymentCallbackRequest;
import com.example.tailor_shop.modules.billing.dto.PaymentRequest;
import com.example.tailor_shop.modules.billing.dto.PaymentResponse;
import com.example.tailor_shop.modules.billing.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<Page<InvoiceResponse>>> list(
            @Valid InvoiceFilterRequest filter,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<InvoiceResponse> data = invoiceService.list(filter, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<InvoiceResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isCustomer = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        InvoiceResponse data = invoiceService.detail(
                id,
                principal != null ? principal.getId() : null,
                isCustomer
        );
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<InvoiceResponse>> create(
            @Valid @RequestBody InvoiceRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        InvoiceResponse data = invoiceService.create(request, principal != null ? principal.getId() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping("/{id}/void")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Void>> voidInvoice(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        invoiceService.voidInvoice(id, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CUSTOMER')")
    public ResponseEntity<CommonResponse<PaymentResponse>> addPayment(
            @Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        PaymentResponse data = invoiceService.addPayment(request, principal != null ? principal.getId() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping("/payments/callback")
    public ResponseEntity<CommonResponse<PaymentResponse>> handleCallback(
            @Valid @RequestBody PaymentCallbackRequest request
    ) {
        PaymentResponse data = invoiceService.handleCallback(request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }
}



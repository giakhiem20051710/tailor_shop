package com.example.tailor_shop.modules.product.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.modules.product.dto.StyleFilterRequest;
import com.example.tailor_shop.modules.product.dto.StyleRequest;
import com.example.tailor_shop.modules.product.dto.StyleResponse;
import com.example.tailor_shop.modules.product.service.StyleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/styles")
@RequiredArgsConstructor
public class StyleController {

    private final StyleService styleService;

    @GetMapping
    public ResponseEntity<CommonResponse<Page<StyleResponse>>> list(
            @Valid StyleFilterRequest filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<StyleResponse> data = styleService.list(filter, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<StyleResponse>> detail(@PathVariable Long id) {
        StyleResponse data = styleService.detail(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<StyleResponse>> create(
            @Valid @RequestBody StyleRequest request) {
        StyleResponse data = styleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<StyleResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody StyleRequest request) {
        StyleResponse data = styleService.update(id, request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<Void>> delete(@PathVariable Long id) {
        styleService.delete(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }
}

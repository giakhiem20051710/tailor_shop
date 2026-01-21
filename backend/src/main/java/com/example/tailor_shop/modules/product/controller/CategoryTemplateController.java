package com.example.tailor_shop.modules.product.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.modules.product.dto.CategoryTemplateRequest;
import com.example.tailor_shop.modules.product.dto.CategoryTemplateResponse;
import com.example.tailor_shop.modules.product.service.CategoryTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/product-configurations/templates")
@RequiredArgsConstructor
public class CategoryTemplateController {

    private final CategoryTemplateService categoryTemplateService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<CategoryTemplateResponse>>> getAll() {
        return ResponseEntity
                .ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), categoryTemplateService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<CategoryTemplateResponse>> getById(@PathVariable Long id) {
        return ResponseEntity
                .ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), categoryTemplateService.getById(id)));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<CommonResponse<CategoryTemplateResponse>> getByCode(@PathVariable String code) {
        return ResponseEntity
                .ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), categoryTemplateService.getByCode(code)));
    }

    @PostMapping
    public ResponseEntity<CommonResponse<CategoryTemplateResponse>> create(
            @RequestBody CategoryTemplateRequest request) {
        return ResponseEntity
                .ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), categoryTemplateService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommonResponse<CategoryTemplateResponse>> update(@PathVariable Long id,
            @RequestBody CategoryTemplateRequest request) {
        return ResponseEntity.ok(
                ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), categoryTemplateService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<CommonResponse<String>> delete(@PathVariable Long id) {
        categoryTemplateService.delete(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), "Deleted successfully"));
    }
}

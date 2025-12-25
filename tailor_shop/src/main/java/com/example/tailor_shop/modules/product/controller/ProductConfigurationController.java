package com.example.tailor_shop.modules.product.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.modules.fabric.dto.FabricResponse;
import com.example.tailor_shop.modules.product.dto.ProductConfigurationRequest;
import com.example.tailor_shop.modules.product.dto.ProductConfigurationResponse;
import com.example.tailor_shop.modules.product.dto.ProductTemplateResponse;
import com.example.tailor_shop.modules.product.dto.StyleResponse;
import com.example.tailor_shop.modules.product.service.ProductConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/**
 * Controller cho ProductConfiguration (Mix & Match)
 */
@RestController
@RequestMapping("/api/v1/product-configurations")
@RequiredArgsConstructor
public class ProductConfigurationController {

    private final ProductConfigurationService productConfigurationService;

    /**
     * Tạo ProductConfiguration mới
     */
    @PostMapping
    public ResponseEntity<CommonResponse<ProductConfigurationResponse>> create(
            @Valid @RequestBody ProductConfigurationRequest request
    ) {
        ProductConfigurationResponse data = productConfigurationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Lấy ProductConfiguration theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<ProductConfigurationResponse>> getById(
            @PathVariable Long id
    ) {
        ProductConfigurationResponse data = productConfigurationService.getById(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Lấy danh sách templates
     */
    @GetMapping("/templates")
    public ResponseEntity<CommonResponse<List<ProductTemplateResponse>>> getAllTemplates() {
        List<ProductTemplateResponse> data = productConfigurationService.getAllTemplates();
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Lấy danh sách fabrics theo template
     */
    @GetMapping("/templates/{templateId}/fabrics")
    public ResponseEntity<CommonResponse<Page<FabricResponse>>> getFabricsByTemplate(
            @PathVariable Long templateId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<FabricResponse> data = productConfigurationService.getFabricsByTemplate(templateId, page, size);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Lấy danh sách styles theo template
     */
    @GetMapping("/templates/{templateId}/styles")
    public ResponseEntity<CommonResponse<Page<StyleResponse>>> getStylesByTemplate(
            @PathVariable Long templateId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<StyleResponse> data = productConfigurationService.getStylesByTemplate(templateId, page, size);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    /**
     * Tính giá tự động
     */
    @GetMapping("/calculate-price")
    public ResponseEntity<CommonResponse<BigDecimal>> calculatePrice(
            @RequestParam Long templateId,
            @RequestParam Long fabricId,
            @RequestParam(required = false) Long styleId
    ) {
        BigDecimal price = productConfigurationService.calculatePrice(templateId, fabricId, styleId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), price));
    }
}


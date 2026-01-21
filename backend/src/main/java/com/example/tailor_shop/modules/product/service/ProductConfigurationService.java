package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.fabric.dto.FabricResponse;
import com.example.tailor_shop.modules.product.dto.ProductConfigurationRequest;
import com.example.tailor_shop.modules.product.dto.ProductConfigurationResponse;
import com.example.tailor_shop.modules.product.dto.ProductTemplateResponse;
import com.example.tailor_shop.modules.product.dto.StyleResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductConfigurationService {

    /**
     * Tạo ProductConfiguration mới
     */
    ProductConfigurationResponse create(ProductConfigurationRequest request);

    /**
     * Lấy danh sách fabrics theo template
     */
    Page<FabricResponse> getFabricsByTemplate(Long templateId, int page, int size);

    /**
     * Lấy danh sách styles theo template
     */
    Page<StyleResponse> getStylesByTemplate(Long templateId, int page, int size);

    /**
     * Lấy danh sách templates
     */
    List<ProductTemplateResponse> getAllTemplates();

    /**
     * Lấy ProductConfiguration theo ID
     */
    ProductConfigurationResponse getById(Long id);

    /**
     * Tính giá tự động: templatePrice + fabricPrice + stylePrice
     */
    java.math.BigDecimal calculatePrice(Long templateId, Long fabricId, Long styleId);
}


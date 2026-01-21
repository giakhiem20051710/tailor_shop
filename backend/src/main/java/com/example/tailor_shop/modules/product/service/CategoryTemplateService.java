package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.dto.CategoryTemplateRequest;
import com.example.tailor_shop.modules.product.dto.CategoryTemplateResponse;

import java.util.List;

public interface CategoryTemplateService {
    List<CategoryTemplateResponse> getAll();

    CategoryTemplateResponse getById(Long id);

    CategoryTemplateResponse getByCode(String code);

    CategoryTemplateResponse create(CategoryTemplateRequest request);

    CategoryTemplateResponse update(Long id, CategoryTemplateRequest request);

    void delete(Long id);
}

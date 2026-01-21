package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.dto.ProductDetailResponse;
import com.example.tailor_shop.modules.product.dto.ProductFilterRequest;
import com.example.tailor_shop.modules.product.dto.ProductListItemResponse;
import com.example.tailor_shop.modules.product.dto.ProductRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    Page<ProductListItemResponse> list(
            ProductFilterRequest filter,
            Pageable pageable,
            Long currentUserId
    );

    ProductDetailResponse detail(String key, Long currentUserId);

    ProductDetailResponse create(ProductRequest request);

    ProductDetailResponse update(String key, ProductRequest request);

    void delete(String key);
}


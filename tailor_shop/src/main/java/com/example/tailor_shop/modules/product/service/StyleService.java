package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.dto.StyleFilterRequest;
import com.example.tailor_shop.modules.product.dto.StyleRequest;
import com.example.tailor_shop.modules.product.dto.StyleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StyleService {

    Page<StyleResponse> list(StyleFilterRequest filter, Pageable pageable);

    StyleResponse detail(Long id);

    StyleResponse create(StyleRequest request);

    StyleResponse update(Long id, StyleRequest request);

    void delete(Long id);
}


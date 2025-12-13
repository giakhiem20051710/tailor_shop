package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.dto.AddFavoriteRequest;
import com.example.tailor_shop.modules.product.dto.FavoriteCheckResponse;
import com.example.tailor_shop.modules.product.dto.FavoriteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FavoriteService {

    Page<FavoriteResponse> list(Long customerId, Pageable pageable);

    FavoriteResponse add(Long customerId, AddFavoriteRequest request);

    void remove(Long customerId, String productKey);

    FavoriteCheckResponse check(Long customerId, String productKey);
}


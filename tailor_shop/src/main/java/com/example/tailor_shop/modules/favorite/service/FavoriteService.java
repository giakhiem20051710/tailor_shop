package com.example.tailor_shop.modules.favorite.service;

import com.example.tailor_shop.modules.favorite.dto.AddFavoriteRequest;
import com.example.tailor_shop.modules.favorite.dto.FavoriteCheckResponse;
import com.example.tailor_shop.modules.favorite.dto.FavoriteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service cho Favorite module (generic, có thể dùng cho nhiều loại sản phẩm)
 */
public interface FavoriteService {

    Page<FavoriteResponse> list(Long userId, Pageable pageable);

    Page<FavoriteResponse> listByType(com.example.tailor_shop.modules.favorite.domain.FavoriteItemType itemType, Long userId, Pageable pageable);

    FavoriteResponse add(Long userId, AddFavoriteRequest request);

    void remove(Long userId, com.example.tailor_shop.modules.favorite.domain.FavoriteItemType itemType, Long itemId);

    void removeByKey(Long userId, String itemKey); // Backward compatibility

    FavoriteCheckResponse check(Long userId, com.example.tailor_shop.modules.favorite.domain.FavoriteItemType itemType, Long itemId);

    FavoriteCheckResponse checkByKey(Long userId, String itemKey); // Backward compatibility
}


package com.example.tailor_shop.modules.favorite.dto;

import com.example.tailor_shop.modules.favorite.domain.FavoriteItemType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho thêm vào danh sách yêu thích (generic)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddFavoriteRequest {

    @NotNull(message = "Item type is required")
    private FavoriteItemType itemType;

    @NotNull(message = "Item ID is required")
    private Long itemId;

    private String itemKey; // Optional: để backward compatibility
}


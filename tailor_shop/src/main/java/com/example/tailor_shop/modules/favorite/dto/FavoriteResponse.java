package com.example.tailor_shop.modules.favorite.dto;

import com.example.tailor_shop.modules.favorite.domain.FavoriteItemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * DTO cho favorite response (generic)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteResponse {

    private Long id;
    private FavoriteItemType itemType;
    private Long itemId;
    private String itemKey;
    private String itemName; // Tên sản phẩm (lấy từ Product/Fabric service)
    private String itemCode; // Code sản phẩm
    private String itemImage; // Hình ảnh
    private java.math.BigDecimal itemPrice; // Giá sản phẩm
    private java.math.BigDecimal itemRating; // Rating (nếu có)
    private Boolean isAvailable; // Còn hàng không
    private OffsetDateTime addedAt;
}


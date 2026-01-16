package com.example.tailor_shop.modules.favorite.domain;

/**
 * Loại sản phẩm trong danh sách yêu thích
 */
public enum FavoriteItemType {
    PRODUCT, // Sản phẩm từ Product module
    FABRIC, // Vải từ Fabric module
    SERVICE, // Dịch vụ (có thể mở rộng sau)
    IMAGE_ASSET // Ảnh từ thư viện ảnh
}

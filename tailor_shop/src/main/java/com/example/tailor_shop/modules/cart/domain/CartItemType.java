package com.example.tailor_shop.modules.cart.domain;

/**
 * Loại sản phẩm trong giỏ hàng
 */
public enum CartItemType {
    PRODUCT,  // Sản phẩm từ Product module
    FABRIC,   // Vải từ Fabric module
    SERVICE   // Dịch vụ (có thể mở rộng sau)
}


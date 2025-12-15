package com.example.tailor_shop.modules.fabric.domain;

/**
 * Trạng thái đơn hàng vải (giống FPT Shop)
 */
public enum FabricOrderStatus {
    PENDING,      // Đang chờ xử lý
    CONFIRMED,    // Đã xác nhận
    PROCESSING,   // Đang xử lý
    SHIPPED,      // Đã giao hàng
    DELIVERED,    // Đã nhận hàng
    CANCELLED     // Đã hủy
}


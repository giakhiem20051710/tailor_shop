package com.example.tailor_shop.modules.flashsale.domain;

/**
 * Flash Sale Order Status Enum
 */
public enum FlashSaleOrderStatus {
    PENDING, // Chờ thanh toán
    PAID, // Đã thanh toán
    CANCELLED, // Bị hủy
    EXPIRED, // Hết thời gian thanh toán
    REFUNDED // Đã hoàn tiền
}

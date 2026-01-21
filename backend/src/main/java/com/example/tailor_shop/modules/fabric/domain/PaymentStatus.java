package com.example.tailor_shop.modules.fabric.domain;

/**
 * Trạng thái thanh toán
 */
public enum PaymentStatus {
    PENDING,   // Chưa thanh toán
    PAID,      // Đã thanh toán
    FAILED,    // Thanh toán thất bại
    REFUNDED   // Đã hoàn tiền
}


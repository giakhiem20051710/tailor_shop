package com.example.tailor_shop.modules.flashsale.domain;

/**
 * Flash Sale Reservation Status Enum
 */
public enum FlashSaleReservationStatus {
    ACTIVE, // Đang giữ hàng
    CONVERTED, // Đã chuyển thành đơn hàng
    EXPIRED, // Hết thời gian giữ
    CANCELLED // Bị hủy
}

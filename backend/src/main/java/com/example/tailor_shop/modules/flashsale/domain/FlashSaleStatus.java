package com.example.tailor_shop.modules.flashsale.domain;

/**
 * Flash Sale Status Enum
 */
public enum FlashSaleStatus {
    SCHEDULED, // Đã lên lịch, chưa bắt đầu
    ACTIVE, // Đang diễn ra
    ENDED, // Đã kết thúc (hết thời gian)
    CANCELLED, // Bị hủy bởi admin
    SOLD_OUT // Đã bán hết
}

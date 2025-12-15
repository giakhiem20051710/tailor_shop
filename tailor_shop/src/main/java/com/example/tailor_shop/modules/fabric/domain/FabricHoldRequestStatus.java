package com.example.tailor_shop.modules.fabric.domain;

/**
 * Trạng thái yêu cầu
 */
public enum FabricHoldRequestStatus {
    PENDING,    // Đang chờ xử lý
    APPROVED,   // Đã duyệt
    REJECTED,   // Từ chối
    COMPLETED,  // Hoàn thành
    CANCELLED   // Đã hủy
}


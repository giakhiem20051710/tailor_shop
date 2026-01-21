package com.example.tailor_shop.modules.review.domain;

/**
 * Trạng thái review
 */
public enum ReviewStatus {
    PENDING,   // Đang chờ duyệt
    APPROVED,  // Đã duyệt, hiển thị công khai
    REJECTED,  // Từ chối (không hiển thị)
    HIDDEN     // Ẩn (admin ẩn review)
}


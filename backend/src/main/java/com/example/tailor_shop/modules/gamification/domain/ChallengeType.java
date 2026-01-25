package com.example.tailor_shop.modules.gamification.domain;

/**
 * Challenge Type Enum - Loại điều kiện challenge
 */
public enum ChallengeType {
    ORDER_COUNT("Số lượng đơn hàng"),
    ORDER_VALUE("Giá trị đơn hàng"),
    PRODUCT_CATEGORY("Mua theo danh mục"),
    FABRIC_PURCHASE("Mua vải"),
    REVIEW_COUNT("Số lượng đánh giá"),
    REFERRAL_COUNT("Giới thiệu bạn bè"),
    CHECKIN_STREAK("Điểm danh liên tiếp"),
    COMBO("Hoàn thành combo challenges");

    private final String displayName;

    ChallengeType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

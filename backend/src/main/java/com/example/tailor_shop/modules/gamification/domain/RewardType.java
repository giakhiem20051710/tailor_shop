package com.example.tailor_shop.modules.gamification.domain;

/**
 * Reward Type Enum - Loại phần thưởng
 */
public enum RewardType {
    POINTS("Xu/Điểm"),
    VOUCHER("Mã giảm giá"),
    BADGE("Huy hiệu"),
    FREE_SHIPPING("Miễn phí vận chuyển"),
    MYSTERY_BOX("Hộp bí ẩn"),
    EXCLUSIVE_ACCESS("Quyền truy cập sớm");

    private final String displayName;

    RewardType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

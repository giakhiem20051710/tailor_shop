package com.example.tailor_shop.modules.gamification.domain;

/**
 * Season Enum - Các mùa/dịp lễ trong năm
 */
public enum Season {
    TET("Tết Nguyên Đán"),
    VALENTINE("Valentine"),
    WOMEN_DAY("Ngày Phụ Nữ 8/3"),
    SUMMER("Mùa Hè"),
    BACK_TO_SCHOOL("Mùa Tựu Trường"),
    MID_AUTUMN("Trung Thu"),
    HALLOWEEN("Halloween"),
    CHRISTMAS("Giáng Sinh"),
    NEW_YEAR("Năm Mới");

    private final String displayName;

    Season(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

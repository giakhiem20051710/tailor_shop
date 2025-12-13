package com.example.tailor_shop.modules.promotion.dto;

import com.example.tailor_shop.modules.promotion.domain.PromotionStatus;
import com.example.tailor_shop.modules.promotion.domain.PromotionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionFilterRequest {

    private PromotionStatus status;
    private PromotionType type;
    private String keyword;
    private Boolean isPublic;
}


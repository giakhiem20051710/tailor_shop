package com.example.tailor_shop.modules.promotion.service;

import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeRequest;
import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeResponse;
import com.example.tailor_shop.modules.promotion.dto.PromotionFilterRequest;
import com.example.tailor_shop.modules.promotion.dto.PromotionRequest;
import com.example.tailor_shop.modules.promotion.dto.PromotionResponse;
import com.example.tailor_shop.modules.promotion.dto.PromotionSuggestionRequest;
import com.example.tailor_shop.modules.promotion.dto.PromotionSuggestionResponse;
import com.example.tailor_shop.modules.promotion.dto.PromotionUsageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PromotionService {

    Page<PromotionResponse> list(PromotionFilterRequest filter, Pageable pageable, Long currentUserId);

    Page<PromotionResponse> listActivePublic(Pageable pageable, Long currentUserId);

    PromotionResponse detail(Long id, Long currentUserId);

    PromotionResponse detailByCode(String code, Long currentUserId);

    PromotionResponse create(PromotionRequest request, Long createdBy);

    PromotionResponse update(Long id, PromotionRequest request);

    void delete(Long id);

    void activate(Long id);

    void deactivate(Long id);

    ApplyPromoCodeResponse applyPromoCode(ApplyPromoCodeRequest request, Long userId);

    Page<PromotionUsageResponse> listUsages(Long promotionId, Long userId, Pageable pageable);

    Page<PromotionUsageResponse> listMyUsages(Long userId, Pageable pageable);

    // Shopee-like features
    List<PromotionSuggestionResponse> getSuggestions(PromotionSuggestionRequest request, Long userId);

    List<PromotionSuggestionResponse> getAvailableForCart(PromotionSuggestionRequest request, Long userId);

    ApplyPromoCodeResponse autoApplyBestPromo(PromotionSuggestionRequest request, Long userId);
}


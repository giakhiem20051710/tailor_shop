package com.example.tailor_shop.modules.promotion.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.promotion.domain.PromotionEntity;
import com.example.tailor_shop.modules.promotion.domain.PromotionStatus;
import com.example.tailor_shop.modules.promotion.domain.PromotionType;
import com.example.tailor_shop.modules.promotion.domain.PromotionUsageEntity;
import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeRequest;
import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeResponse;
import com.example.tailor_shop.modules.promotion.dto.PromotionFilterRequest;
import com.example.tailor_shop.modules.promotion.dto.PromotionRequest;
import com.example.tailor_shop.modules.promotion.dto.PromotionResponse;
import com.example.tailor_shop.modules.promotion.dto.PromotionSuggestionRequest;
import com.example.tailor_shop.modules.promotion.dto.PromotionSuggestionResponse;
import com.example.tailor_shop.modules.promotion.dto.PromotionUsageResponse;
import com.example.tailor_shop.modules.promotion.event.PromotionActivatedEvent;
import com.example.tailor_shop.modules.promotion.event.PromotionAppliedEvent;
import com.example.tailor_shop.modules.promotion.event.PromotionDeactivatedEvent;
import com.example.tailor_shop.modules.promotion.event.PromotionExpiredEvent;
import com.example.tailor_shop.modules.promotion.event.PromotionUsageLimitReachedEvent;
import com.example.tailor_shop.modules.promotion.repository.PromotionRepository;
import com.example.tailor_shop.modules.promotion.repository.PromotionUsageRepository;
import com.example.tailor_shop.modules.promotion.service.PromotionService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionResponse> list(PromotionFilterRequest filter, Pageable pageable, Long currentUserId) {
        Page<PromotionEntity> page = promotionRepository.searchPromotions(
                filter != null ? filter.getStatus() : null,
                filter != null ? filter.getType() : null,
                filter != null ? filter.getKeyword() : null,
                filter != null ? filter.getIsPublic() : null,
                pageable
        );

        return page.map(entity -> toResponse(entity, currentUserId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionResponse> listActivePublic(Pageable pageable, Long currentUserId) {
        // Create Pageable with priority DESC, createdAt DESC sorting
        org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Order.desc("priority"),
                org.springframework.data.domain.Sort.Order.desc("createdAt")
        );
        org.springframework.data.domain.Pageable sortedPageable = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                sort
        );
        Page<PromotionEntity> page = promotionRepository.findActivePublicPromotions(LocalDate.now(), sortedPageable);
        return page.map(entity -> toResponse(entity, currentUserId));
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse detail(Long id, Long currentUserId) {
        PromotionEntity entity = promotionRepository.findById(id)
                .filter(p -> Boolean.FALSE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Promotion not found"));
        return toResponse(entity, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse detailByCode(String code, Long currentUserId) {
        if (code == null || code.trim().isEmpty()) {
            throw new BadRequestException("Promotion code is required");
        }
        PromotionEntity entity = promotionRepository.findByCodeAndIsDeletedFalse(code.toUpperCase())
                .orElseThrow(() -> new NotFoundException("Promotion not found"));
        return toResponse(entity, currentUserId);
    }

    @Override
    @Transactional
    public PromotionResponse create(PromotionRequest request, Long createdBy) {
        if (promotionRepository.findByCodeAndIsDeletedFalse(request.getCode()).isPresent()) {
            throw new BadRequestException("Promotion code already exists");
        }

        validatePromotionRequest(request);

        UserEntity creator = userRepository.findById(createdBy)
                .orElseThrow(() -> new NotFoundException("User not found"));

        PromotionEntity entity = PromotionEntity.builder()
                .code(request.getCode().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .status(PromotionStatus.INACTIVE)
                .discountPercentage(request.getDiscountPercentage())
                .discountAmount(request.getDiscountAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderValue(request.getMinOrderValue())
                .applicableProductIds(toJsonString(request.getApplicableProductIds()))
                .applicableCategoryIds(toJsonString(request.getApplicableCategoryIds()))
                .applicableUserGroup(request.getApplicableUserGroup())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .maxUsageTotal(request.getMaxUsageTotal())
                .maxUsagePerUser(request.getMaxUsagePerUser())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .isSingleUse(request.getIsSingleUse() != null ? request.getIsSingleUse() : false)
                .buyQuantity(request.getBuyQuantity())
                .getQuantity(request.getGetQuantity())
                .getProductId(request.getGetProductId())
                .image(request.getImage())
                .bannerText(request.getBannerText())
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .createdBy(creator)
                .build();

        entity = promotionRepository.save(entity);
        return toResponse(entity, null);
    }

    @Override
    @Transactional
    public PromotionResponse update(Long id, PromotionRequest request) {
        PromotionEntity entity = promotionRepository.findById(id)
                .filter(p -> Boolean.FALSE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Promotion not found"));

        if (!entity.getCode().equalsIgnoreCase(request.getCode()) &&
                promotionRepository.findByCodeAndIsDeletedFalse(request.getCode()).isPresent()) {
            throw new BadRequestException("Promotion code already exists");
        }

        validatePromotionRequest(request);

        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setType(request.getType());
        entity.setDiscountPercentage(request.getDiscountPercentage());
        entity.setDiscountAmount(request.getDiscountAmount());
        entity.setMaxDiscountAmount(request.getMaxDiscountAmount());
        entity.setMinOrderValue(request.getMinOrderValue());
        entity.setApplicableProductIds(toJsonString(request.getApplicableProductIds()));
        entity.setApplicableCategoryIds(toJsonString(request.getApplicableCategoryIds()));
        entity.setApplicableUserGroup(request.getApplicableUserGroup());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        entity.setMaxUsageTotal(request.getMaxUsageTotal());
        entity.setMaxUsagePerUser(request.getMaxUsagePerUser());
        if (request.getIsPublic() != null) {
            entity.setIsPublic(request.getIsPublic());
        }
        if (request.getIsSingleUse() != null) {
            entity.setIsSingleUse(request.getIsSingleUse());
        }
        entity.setBuyQuantity(request.getBuyQuantity());
        entity.setGetQuantity(request.getGetQuantity());
        entity.setGetProductId(request.getGetProductId());
        entity.setImage(request.getImage());
        entity.setBannerText(request.getBannerText());
        if (request.getPriority() != null) {
            entity.setPriority(request.getPriority());
        }

        entity = promotionRepository.save(entity);
        return toResponse(entity, null);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        try {
            PromotionEntity entity = promotionRepository.findById(id)
                    .filter(p -> Boolean.FALSE.equals(p.getIsDeleted()))
                    .orElseThrow(() -> new NotFoundException("Promotion not found"));
            entity.setIsDeleted(true);
            promotionRepository.save(entity);
            log.info("[TraceId: {}] Promotion {} deleted successfully", 
                    com.example.tailor_shop.common.TraceIdUtil.getTraceId(), id);
        } catch (NotFoundException e) {
            throw e; // Re-throw business exceptions
        } catch (Exception e) {
            log.error("[TraceId: {}] Error deleting promotion {}: {}", 
                    com.example.tailor_shop.common.TraceIdUtil.getTraceId(), id, e.getMessage(), e);
            throw new BadRequestException("Failed to delete promotion: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void activate(Long id) {
        try {
            PromotionEntity entity = promotionRepository.findById(id)
                    .filter(p -> Boolean.FALSE.equals(p.getIsDeleted()))
                    .orElseThrow(() -> new NotFoundException("Promotion not found"));

            if (PromotionStatus.ACTIVE.equals(entity.getStatus())) {
                throw new BadRequestException("Promotion is already active");
            }

            // Validate dates if they exist
            LocalDate startDate = entity.getStartDate();
            LocalDate endDate = entity.getEndDate();
            if (startDate != null && endDate != null) {
                LocalDate today = LocalDate.now();
                if (today.isBefore(startDate)) {
                    throw new BadRequestException("Cannot activate promotion before start date: " + startDate);
                }
                if (today.isAfter(endDate)) {
                    throw new BadRequestException("Cannot activate promotion after end date: " + endDate);
                }
            }

            entity.setStatus(PromotionStatus.ACTIVE);
            promotionRepository.save(entity);
            
            // Publish event
            PromotionActivatedEvent event = PromotionActivatedEvent.builder()
                    .promotionId(entity.getId())
                    .code(entity.getCode())
                    .name(entity.getName())
                    .startDate(entity.getStartDate())
                    .endDate(entity.getEndDate())
                    .activatedAt(OffsetDateTime.now())
                    .activatedBy(null) // TODO: Get from security context if needed
                    .build();
            eventPublisher.publishEvent(event);
            
            log.info("[TraceId: {}] Promotion {} activated successfully", 
                    com.example.tailor_shop.common.TraceIdUtil.getTraceId(), id);
        } catch (BadRequestException | NotFoundException e) {
            throw e; // Re-throw business exceptions
        } catch (Exception e) {
            log.error("[TraceId: {}] Error activating promotion {}: {}", 
                    com.example.tailor_shop.common.TraceIdUtil.getTraceId(), id, e.getMessage(), e);
            throw new BadRequestException("Failed to activate promotion: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        try {
            PromotionEntity entity = promotionRepository.findById(id)
                    .filter(p -> Boolean.FALSE.equals(p.getIsDeleted()))
                    .orElseThrow(() -> new NotFoundException("Promotion not found"));

            if (PromotionStatus.INACTIVE.equals(entity.getStatus())) {
                throw new BadRequestException("Promotion is already inactive");
            }

            if (PromotionStatus.CANCELLED.equals(entity.getStatus())) {
                throw new BadRequestException("Cannot deactivate a cancelled promotion");
            }

            entity.setStatus(PromotionStatus.INACTIVE);
            promotionRepository.save(entity);
            
            // Publish event
            PromotionDeactivatedEvent event = PromotionDeactivatedEvent.builder()
                    .promotionId(entity.getId())
                    .code(entity.getCode())
                    .name(entity.getName())
                    .deactivatedAt(OffsetDateTime.now())
                    .deactivatedBy(null) // TODO: Get from security context if needed
                    .build();
            eventPublisher.publishEvent(event);
            
            log.info("[TraceId: {}] Promotion {} deactivated successfully", 
                    com.example.tailor_shop.common.TraceIdUtil.getTraceId(), id);
        } catch (BadRequestException | NotFoundException e) {
            throw e; // Re-throw business exceptions
        } catch (Exception e) {
            log.error("[TraceId: {}] Error deactivating promotion {}: {}", 
                    com.example.tailor_shop.common.TraceIdUtil.getTraceId(), id, e.getMessage(), e);
            throw new BadRequestException("Failed to deactivate promotion: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ApplyPromoCodeResponse applyPromoCode(ApplyPromoCodeRequest request, Long userId) {
        if (request == null || request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new BadRequestException("Promotion code is required");
        }

        PromotionEntity promotion = promotionRepository.findByCodeAndIsDeletedFalse(request.getCode().toUpperCase().trim())
                .orElseThrow(() -> new NotFoundException("Promotion code not found"));

        // Validate promotion status
        if (!PromotionStatus.ACTIVE.equals(promotion.getStatus())) {
            throw new BadRequestException("Promotion is not active");
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate = promotion.getStartDate();
        LocalDate endDate = promotion.getEndDate();
        if (startDate != null && today.isBefore(startDate)) {
            throw new BadRequestException("Promotion is not valid yet. Start date: " + startDate);
        }
        if (endDate != null && today.isAfter(endDate)) {
            throw new BadRequestException("Promotion has expired. End date: " + endDate);
        }

        // Validate minimum order value
        if (promotion.getMinOrderValue() != null &&
                request.getOrderAmount().compareTo(promotion.getMinOrderValue()) < 0) {
            throw new BadRequestException(
                    String.format("Minimum order value is %s", promotion.getMinOrderValue())
            );
        }

        // Validate applicable products/categories
        if (!isApplicable(promotion, request.getProductIds(), request.getCategoryIds())) {
            throw new BadRequestException("Promotion is not applicable to selected products");
        }

        // Validate usage limits
        if (userId != null) {
            validateUsageLimits(promotion, userId);
        }

        // Calculate discount
        BigDecimal discountAmount = calculateDiscount(promotion, request.getOrderAmount());
        BigDecimal finalAmount = request.getOrderAmount().subtract(discountAmount);

        return ApplyPromoCodeResponse.builder()
                .promotionId(promotion.getId())
                .code(promotion.getCode())
                .name(promotion.getName())
                .type(promotion.getType())
                .originalAmount(request.getOrderAmount())
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .message(String.format("Applied promotion: %s", promotion.getName()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionUsageResponse> listUsages(Long promotionId, Long userId, Pageable pageable) {
        if (userId != null) {
            Page<PromotionUsageEntity> page = promotionUsageRepository.findByPromotionIdAndUserId(
                    promotionId, userId, pageable
            );
            return page.map(this::toUsageResponse);
        }
        return Page.empty();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionUsageResponse> listMyUsages(Long userId, Pageable pageable) {
        Page<PromotionUsageEntity> page = promotionUsageRepository.findByUserId(userId, pageable);
        return page.map(this::toUsageResponse);
    }

    // Helper methods

    private PromotionResponse toResponse(PromotionEntity entity, Long currentUserId) {
        Long totalUsage = promotionRepository.countUsagesByPromotionId(entity.getId());
        Long userUsage = null;
        Boolean isEligible = null;
        Boolean isUsed = null;

        if (currentUserId != null) {
            userUsage = promotionRepository.countUsagesByPromotionIdAndUserId(entity.getId(), currentUserId);
            isEligible = isEligibleForUser(entity, currentUserId);
            isUsed = userUsage > 0 && entity.getIsSingleUse();
        }

        return PromotionResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .type(entity.getType())
                .status(entity.getStatus())
                .discountPercentage(entity.getDiscountPercentage())
                .discountAmount(entity.getDiscountAmount())
                .maxDiscountAmount(entity.getMaxDiscountAmount())
                .minOrderValue(entity.getMinOrderValue())
                .applicableProductIds(fromJsonString(entity.getApplicableProductIds(), Long.class))
                .applicableCategoryIds(fromJsonString(entity.getApplicableCategoryIds(), String.class))
                .applicableUserGroup(entity.getApplicableUserGroup())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .maxUsageTotal(entity.getMaxUsageTotal())
                .maxUsagePerUser(entity.getMaxUsagePerUser())
                .isPublic(entity.getIsPublic())
                .isSingleUse(entity.getIsSingleUse())
                .buyQuantity(entity.getBuyQuantity())
                .getQuantity(entity.getGetQuantity())
                .getProductId(entity.getGetProductId())
                .image(entity.getImage())
                .bannerText(entity.getBannerText())
                .priority(entity.getPriority())
                .totalUsageCount(totalUsage)
                .isEligible(isEligible)
                .isUsed(isUsed)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private PromotionUsageResponse toUsageResponse(PromotionUsageEntity entity) {
        return PromotionUsageResponse.builder()
                .id(entity.getId())
                .promotionId(entity.getPromotion().getId())
                .promotionCode(entity.getPromotion().getCode())
                .promotionName(entity.getPromotion().getName())
                .orderId(entity.getOrderId())
                .invoiceId(entity.getInvoiceId())
                .discountAmount(entity.getDiscountAmount())
                .originalAmount(entity.getOriginalAmount())
                .finalAmount(entity.getFinalAmount())
                .usedAt(entity.getUsedAt())
                .build();
    }

    private void validatePromotionRequest(PromotionRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }

        if (request.getType() == PromotionType.PERCENTAGE) {
            if (request.getDiscountPercentage() == null || request.getDiscountPercentage().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Discount percentage is required and must be positive");
            }
            if (request.getDiscountPercentage().compareTo(new BigDecimal("100")) > 0) {
                throw new BadRequestException("Discount percentage cannot exceed 100");
            }
        } else if (request.getType() == PromotionType.FIXED_AMOUNT) {
            if (request.getDiscountAmount() == null || request.getDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Discount amount is required and must be positive");
            }
        } else if (request.getType() == PromotionType.BUY_X_GET_Y) {
            if (request.getBuyQuantity() == null || request.getBuyQuantity() <= 0) {
                throw new BadRequestException("Buy quantity is required and must be positive");
            }
            if (request.getGetQuantity() == null || request.getGetQuantity() <= 0) {
                throw new BadRequestException("Get quantity is required and must be positive");
            }
        }
    }

    private void validatePromotionDates(PromotionEntity entity) {
        if (entity.getStartDate() == null || entity.getEndDate() == null) {
            return; // Skip validation if dates are null
        }
        LocalDate today = LocalDate.now();
        if (today.isBefore(entity.getStartDate())) {
            throw new BadRequestException("Cannot activate promotion before start date: " + entity.getStartDate());
        }
        if (today.isAfter(entity.getEndDate())) {
            throw new BadRequestException("Cannot activate promotion after end date: " + entity.getEndDate());
        }
    }

    private boolean isApplicable(PromotionEntity promotion, List<Long> productIds, List<String> categoryIds) {
        List<Long> applicableProductIds = fromJsonString(promotion.getApplicableProductIds(), Long.class);
        List<String> applicableCategoryIds = fromJsonString(promotion.getApplicableCategoryIds(), String.class);

        if (applicableProductIds == null && applicableCategoryIds == null) {
            return true; // No restrictions
        }

        if (applicableProductIds != null && productIds != null) {
            Set<Long> productSet = Set.copyOf(productIds);
            if (applicableProductIds.stream().anyMatch(productSet::contains)) {
                return true;
            }
        }

        if (applicableCategoryIds != null && categoryIds != null) {
            Set<String> categorySet = Set.copyOf(categoryIds);
            if (applicableCategoryIds.stream().anyMatch(categorySet::contains)) {
                return true;
            }
        }

        return applicableProductIds == null && applicableCategoryIds == null;
    }

    private void validateUsageLimits(PromotionEntity promotion, Long userId) {
        Long totalUsage = promotionRepository.countUsagesByPromotionId(promotion.getId());
        if (promotion.getMaxUsageTotal() != null && totalUsage >= promotion.getMaxUsageTotal()) {
            throw new BadRequestException("Promotion has reached maximum usage limit");
        }

        Long userUsage = promotionRepository.countUsagesByPromotionIdAndUserId(promotion.getId(), userId);
        if (promotion.getIsSingleUse() && userUsage > 0) {
            throw new BadRequestException("Promotion can only be used once per user");
        }
        if (promotion.getMaxUsagePerUser() != null && userUsage >= promotion.getMaxUsagePerUser()) {
            throw new BadRequestException("You have reached maximum usage limit for this promotion");
        }
    }

    private BigDecimal calculateDiscount(PromotionEntity promotion, BigDecimal orderAmount) {
        BigDecimal discount = BigDecimal.ZERO;

        if (promotion.getType() == PromotionType.PERCENTAGE) {
            discount = orderAmount.multiply(promotion.getDiscountPercentage())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            if (promotion.getMaxDiscountAmount() != null) {
                discount = discount.min(promotion.getMaxDiscountAmount());
            }
        } else if (promotion.getType() == PromotionType.FIXED_AMOUNT) {
            discount = promotion.getDiscountAmount();
            if (discount.compareTo(orderAmount) > 0) {
                discount = orderAmount;
            }
        } else if (promotion.getType() == PromotionType.FREE_SHIPPING) {
            // Free shipping discount would be calculated separately
            discount = BigDecimal.ZERO;
        }

        return discount;
    }

    private boolean isEligibleForUser(PromotionEntity promotion, Long userId) {
        LocalDate today = LocalDate.now();
        if (today.isBefore(promotion.getStartDate()) || today.isAfter(promotion.getEndDate())) {
            return false;
        }

        if (promotion.getStatus() != PromotionStatus.ACTIVE) {
            return false;
        }

        Long userUsage = promotionRepository.countUsagesByPromotionIdAndUserId(promotion.getId(), userId);
        if (promotion.getIsSingleUse() && userUsage > 0) {
            return false;
        }
        if (promotion.getMaxUsagePerUser() != null && userUsage >= promotion.getMaxUsagePerUser()) {
            return false;
        }

        return true;
    }

    private String toJsonString(List<?> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            log.error("Error converting list to JSON", e);
            return null;
        }
    }

    private <T> List<T> fromJsonString(String json, Class<T> clazz) {
        if (json == null || json.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<T>>() {});
        } catch (Exception e) {
            log.error("Error converting JSON to list", e);
            return new ArrayList<>();
        }
    }

    // Shopee-like features

    @Override
    @Transactional(readOnly = true)
    public List<PromotionSuggestionResponse> getSuggestions(PromotionSuggestionRequest request, Long userId) {
        LocalDate today = LocalDate.now();
        org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Order.desc("priority"),
                org.springframework.data.domain.Sort.Order.desc("createdAt")
        );
        org.springframework.data.domain.PageRequest pageable = org.springframework.data.domain.PageRequest.of(0, 50, sort);
        Page<PromotionEntity> activePromotions = promotionRepository.findActivePublicPromotions(today, pageable);

        List<PromotionSuggestionResponse> suggestions = new ArrayList<>();

        for (PromotionEntity promotion : activePromotions.getContent()) {
            // Check if applicable
            if (!isApplicable(promotion, request.getProductIds(), request.getCategoryIds())) {
                continue;
            }

            // Check minimum order value
            if (promotion.getMinOrderValue() != null &&
                    request.getOrderAmount().compareTo(promotion.getMinOrderValue()) < 0) {
                continue;
            }

            // Check eligibility for user
            boolean isEligible = true;
            if (userId != null) {
                isEligible = isEligibleForUser(promotion, userId);
            }

            // Calculate discount
            BigDecimal discountAmount = calculateDiscount(promotion, request.getOrderAmount());
            BigDecimal finalAmount = request.getOrderAmount().subtract(discountAmount);

            // Only add if discount > 0
            if (discountAmount.compareTo(BigDecimal.ZERO) > 0) {
                suggestions.add(PromotionSuggestionResponse.builder()
                        .promotionId(promotion.getId())
                        .code(promotion.getCode())
                        .name(promotion.getName())
                        .type(promotion.getType())
                        .originalAmount(request.getOrderAmount())
                        .discountAmount(discountAmount)
                        .finalAmount(finalAmount)
                        .message(String.format("Giảm %sđ", formatCurrency(discountAmount)))
                        .isEligible(isEligible)
                        .priority(promotion.getPriority())
                        .build());
            }
        }

        // Sort by discount amount (descending), then by priority (descending)
        suggestions.sort((a, b) -> {
            int discountCompare = b.getDiscountAmount().compareTo(a.getDiscountAmount());
            if (discountCompare != 0) {
                return discountCompare;
            }
            return Integer.compare(
                    b.getPriority() != null ? b.getPriority() : 0,
                    a.getPriority() != null ? a.getPriority() : 0
            );
        });

        return suggestions;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionSuggestionResponse> getAvailableForCart(PromotionSuggestionRequest request, Long userId) {
        // Same as getSuggestions, but only return eligible ones
        List<PromotionSuggestionResponse> allSuggestions = getSuggestions(request, userId);
        return allSuggestions.stream()
                .filter(PromotionSuggestionResponse::getIsEligible)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ApplyPromoCodeResponse autoApplyBestPromo(PromotionSuggestionRequest request, Long userId) {
        List<PromotionSuggestionResponse> suggestions = getAvailableForCart(request, userId);

        if (suggestions.isEmpty()) {
            throw new NotFoundException("No applicable promotion found");
        }

        // Get the best one (first in sorted list = highest discount)
        PromotionSuggestionResponse best = suggestions.get(0);

        // Validate usage limits before returning
        PromotionEntity promotion = promotionRepository.findById(best.getPromotionId())
                .orElseThrow(() -> new NotFoundException("Promotion not found"));

        if (userId != null) {
            validateUsageLimits(promotion, userId);
        }

        return ApplyPromoCodeResponse.builder()
                .promotionId(best.getPromotionId())
                .code(best.getCode())
                .name(best.getName())
                .type(best.getType())
                .originalAmount(best.getOriginalAmount())
                .discountAmount(best.getDiscountAmount())
                .finalAmount(best.getFinalAmount())
                .message(String.format("Đã tự động áp dụng mã %s, giảm %sđ", best.getCode(), formatCurrency(best.getDiscountAmount())))
                .build();
    }

    private String formatCurrency(BigDecimal amount) {
        return String.format("%,d", amount.longValue());
    }
}


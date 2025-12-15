package com.example.tailor_shop.modules.fabric.service.impl;

import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestEntity;
import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestStatus;
import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestType;
import com.example.tailor_shop.modules.fabric.domain.FabricInventoryEntity;
import com.example.tailor_shop.modules.fabric.dto.ApplyFabricPromoRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricFilterRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricHoldRequestRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricHoldRequestResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricInventoryRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricInventoryResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricOrderResponse;
import com.example.tailor_shop.modules.fabric.dto.FabricRequest;
import com.example.tailor_shop.modules.fabric.dto.FabricResponse;
import com.example.tailor_shop.modules.fabric.dto.UpdateHoldRequestStatusRequest;
import com.example.tailor_shop.modules.fabric.repository.FabricHoldRequestRepository;
import com.example.tailor_shop.modules.fabric.repository.FabricInventoryRepository;
import com.example.tailor_shop.modules.fabric.repository.FabricRepository;
import com.example.tailor_shop.modules.fabric.service.FabricService;
import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeRequest;
import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeResponse;
import com.example.tailor_shop.modules.promotion.service.PromotionService;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FabricServiceImpl implements FabricService {

    private final FabricRepository fabricRepository;
    private final FabricInventoryRepository fabricInventoryRepository;
    private final FabricHoldRequestRepository fabricHoldRequestRepository;
    private final UserRepository userRepository;
    private final PromotionService promotionService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<FabricResponse> list(FabricFilterRequest filter, Pageable pageable) {
        // Filter by low stock if needed
        Page<FabricEntity> page = fabricRepository.searchFabrics(
                filter != null ? filter.getCategory() : null,
                filter != null ? filter.getColor() : null,
                filter != null ? filter.getPattern() : null,
                filter != null ? filter.getMaterial() : null,
                filter != null ? filter.getOrigin() : null,
                filter != null ? filter.getIsAvailable() : null,
                filter != null ? filter.getIsFeatured() : null,
                filter != null ? filter.getMinPrice() : null,
                filter != null ? filter.getMaxPrice() : null,
                filter != null ? filter.getKeyword() : null,
                pageable
        );

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FabricResponse detail(Long id) {
        FabricEntity entity = fabricRepository.findById(id)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));
        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public FabricResponse detailByCode(String code) {
        FabricEntity entity = fabricRepository.findByCodeAndIsDeletedFalse(code)
                .orElseThrow(() -> new NotFoundException("Fabric not found"));
        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public FabricResponse detailBySlug(String slug) {
        FabricEntity entity = fabricRepository.findBySlugAndIsDeletedFalse(slug)
                .orElseThrow(() -> new NotFoundException("Fabric not found"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public FabricResponse create(FabricRequest request, Long createdBy) {
        // Check code exists
        if (fabricRepository.existsByCodeAndIsDeletedFalse(request.getCode())) {
            throw new BadRequestException("Fabric code already exists");
        }

        // Generate slug if not provided
        String slug = request.getSlug();
        if (slug == null || slug.isEmpty()) {
            slug = generateSlug(request.getName());
        }

        // Check slug exists
        if (fabricRepository.existsBySlugAndIsDeletedFalse(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        FabricEntity entity = FabricEntity.builder()
                .code(request.getCode())
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .category(request.getCategory())
                .material(request.getMaterial())
                .color(request.getColor())
                .pattern(request.getPattern())
                .width(request.getWidth())
                .weight(request.getWeight())
                .pricePerMeter(request.getPricePerMeter())
                .image(request.getImage())
                .gallery(convertGalleryToString(request.getGallery()))
                .origin(request.getOrigin())
                .careInstructions(request.getCareInstructions())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .viewCount(0)
                .isDeleted(false)
                .createdBy(createdBy != null ? userRepository.findById(createdBy)
                        .orElseThrow(() -> new NotFoundException("User not found")) : null)
                .build();

        entity = fabricRepository.save(entity);

        log.info("[TraceId: {}] Fabric created: id={}, code={}, name={}",
                TraceIdUtil.getTraceId(), entity.getId(), entity.getCode(), entity.getName());

        return toResponse(entity);
    }

    @Override
    @Transactional
    public FabricResponse update(Long id, FabricRequest request) {
        FabricEntity entity = fabricRepository.findById(id)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));

        // Check code change
        if (!entity.getCode().equals(request.getCode())) {
            if (fabricRepository.existsByCodeAndIsDeletedFalse(request.getCode())) {
                throw new BadRequestException("Fabric code already exists");
            }
            entity.setCode(request.getCode());
        }

        // Update slug
        if (request.getSlug() != null && !request.getSlug().isEmpty()) {
            String newSlug = request.getSlug();
            if (!newSlug.equals(entity.getSlug()) &&
                    fabricRepository.existsBySlugAndIsDeletedFalse(newSlug)) {
                throw new BadRequestException("Slug already exists");
            }
            entity.setSlug(newSlug);
        } else if (request.getName() != null && !request.getName().equals(entity.getName())) {
            entity.setSlug(generateSlug(request.getName()));
        }

        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setCategory(request.getCategory());
        entity.setMaterial(request.getMaterial());
        entity.setColor(request.getColor());
        entity.setPattern(request.getPattern());
        entity.setWidth(request.getWidth());
        entity.setWeight(request.getWeight());
        entity.setPricePerMeter(request.getPricePerMeter());
        entity.setImage(request.getImage());
        entity.setGallery(convertGalleryToString(request.getGallery()));
        entity.setOrigin(request.getOrigin());
        entity.setCareInstructions(request.getCareInstructions());
        entity.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true);
        entity.setIsFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false);
        entity.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);

        entity = fabricRepository.save(entity);

        log.info("[TraceId: {}] Fabric updated: id={}, code={}",
                TraceIdUtil.getTraceId(), entity.getId(), entity.getCode());

        return toResponse(entity);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        FabricEntity entity = fabricRepository.findById(id)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));

        entity.setIsDeleted(true);
        fabricRepository.save(entity);

        log.info("[TraceId: {}] Fabric deleted: id={}, code={}",
                TraceIdUtil.getTraceId(), id, entity.getCode());
    }

    @Override
    @Transactional
    public void incrementViewCount(Long id) {
        FabricEntity entity = fabricRepository.findById(id)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));

        entity.setViewCount(entity.getViewCount() + 1);
        fabricRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FabricInventoryResponse> getInventory(Long fabricId, Pageable pageable) {
        FabricEntity fabric = fabricRepository.findById(fabricId)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));

        List<FabricInventoryEntity> inventories = fabricInventoryRepository
                .findByFabricIdAndIsDeletedFalse(fabricId);

        // Convert to response
        List<FabricInventoryResponse> responses = inventories.stream()
                .map(inv -> toInventoryResponse(inv, fabric))
                .collect(Collectors.toList());

        // Manual pagination (simple approach)
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), responses.size());
        List<FabricInventoryResponse> pagedList = start < responses.size()
                ? responses.subList(start, end)
                : new ArrayList<>();

        return new org.springframework.data.domain.PageImpl<>(
                pagedList, pageable, responses.size()
        );
    }

    @Override
    @Transactional
    public FabricInventoryResponse updateInventory(Long fabricId, FabricInventoryRequest request) {
        FabricEntity fabric = fabricRepository.findById(fabricId)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));

        // Find or create inventory
        FabricInventoryEntity inventory = fabricInventoryRepository
                .findByFabricIdAndLocationAndIsDeletedFalse(fabricId, request.getLocation())
                .orElse(FabricInventoryEntity.builder()
                        .fabric(fabric)
                        .location(request.getLocation())
                        .build());

        inventory.setQuantity(request.getQuantity());
        inventory.setReservedQuantity(request.getReservedQuantity() != null
                ? request.getReservedQuantity() : BigDecimal.ZERO);
        inventory.setMinStockLevel(request.getMinStockLevel());
        inventory.setMaxStockLevel(request.getMaxStockLevel());
        inventory.setUnit(request.getUnit() != null ? request.getUnit() : "METER");
        inventory.setNotes(request.getNotes());

        // Update last restocked if quantity increased
        if (inventory.getId() == null || request.getQuantity()
                .compareTo(inventory.getQuantity()) > 0) {
            inventory.setLastRestockedAt(java.time.OffsetDateTime.now());
        }

        inventory = fabricInventoryRepository.save(inventory);

        log.info("[TraceId: {}] Fabric inventory updated: fabricId={}, location={}, quantity={}",
                TraceIdUtil.getTraceId(), fabricId, request.getLocation(), request.getQuantity());

        return toInventoryResponse(inventory, fabric);
    }

    @Override
    @Transactional
    public FabricHoldRequestResponse createHoldRequest(
            FabricHoldRequestRequest request, Long userId
    ) {
        FabricEntity fabric = fabricRepository.findById(request.getFabricId())
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));

        if (!Boolean.TRUE.equals(fabric.getIsAvailable())) {
            throw new BadRequestException("Fabric is not available");
        }

        // Validate request type
        if (request.getType() == FabricHoldRequestType.HOLD) {
            if (request.getQuantity() == null || request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Quantity is required for HOLD request");
            }

            // Check available quantity
            BigDecimal totalQuantity = fabricInventoryRepository
                    .calculateTotalQuantityByFabricId(fabric.getId());
            BigDecimal totalReserved = fabricInventoryRepository
                    .calculateTotalReservedQuantityByFabricId(fabric.getId());
            BigDecimal available = totalQuantity.subtract(totalReserved);

            if (request.getQuantity().compareTo(available) > 0) {
                throw new BadRequestException(
                        String.format("Insufficient quantity. Available: %s", available)
                );
            }

            // Set expiry date (default 7 days if not provided)
            LocalDate expiryDate = request.getExpiryDate();
            if (expiryDate == null) {
                expiryDate = LocalDate.now().plusDays(7);
            }
        } else if (request.getType() == FabricHoldRequestType.VISIT) {
            if (request.getRequestedDate() == null) {
                throw new BadRequestException("Requested date is required for VISIT request");
            }
            if (request.getRequestedDate().isBefore(LocalDate.now())) {
                throw new BadRequestException("Requested date cannot be in the past");
            }
        }

        FabricHoldRequestEntity entity = FabricHoldRequestEntity.builder()
                .fabric(fabric)
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new NotFoundException("User not found")))
                .type(request.getType())
                .quantity(request.getQuantity())
                .requestedDate(request.getRequestedDate())
                .requestedTime(request.getRequestedTime())
                .status(FabricHoldRequestStatus.PENDING)
                .expiryDate(request.getType() == FabricHoldRequestType.HOLD
                        ? (request.getExpiryDate() != null ? request.getExpiryDate()
                        : LocalDate.now().plusDays(7)) : null)
                .notes(request.getNotes())
                .isDeleted(false)
                .build();

        entity = fabricHoldRequestRepository.save(entity);

        log.info("[TraceId: {}] Fabric hold request created: id={}, type={}, fabricId={}, userId={}",
                TraceIdUtil.getTraceId(), entity.getId(), request.getType(), request.getFabricId(), userId);

        return toHoldRequestResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FabricHoldRequestResponse> listHoldRequests(
            Long fabricId, Long userId, Pageable pageable
    ) {
        Page<FabricHoldRequestEntity> page = fabricHoldRequestRepository.searchRequests(
                fabricId, userId, null, null, null, pageable
        );
        return page.map(this::toHoldRequestResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FabricHoldRequestResponse getHoldRequestDetail(Long id) {
        FabricHoldRequestEntity entity = fabricHoldRequestRepository
                .findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Hold request not found"));
        return toHoldRequestResponse(entity);
    }

    @Override
    @Transactional
    public FabricHoldRequestResponse updateHoldRequestStatus(
            Long id, UpdateHoldRequestStatusRequest request, Long handledBy
    ) {
        FabricHoldRequestEntity entity = fabricHoldRequestRepository
                .findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Hold request not found"));

        // Validate status transition
        FabricHoldRequestStatus currentStatus = entity.getStatus();
        FabricHoldRequestStatus newStatus = request.getStatus();

        if (currentStatus == FabricHoldRequestStatus.COMPLETED ||
                currentStatus == FabricHoldRequestStatus.CANCELLED) {
            throw new BadRequestException("Cannot update completed or cancelled request");
        }

        entity.setStatus(newStatus);
        entity.setStaffNotes(request.getStaffNotes());
        entity.setHandledBy(userRepository.findById(handledBy)
                .orElseThrow(() -> new NotFoundException("User not found")));
        entity.setHandledAt(java.time.OffsetDateTime.now());

        // If approved HOLD request, reserve quantity
        if (newStatus == FabricHoldRequestStatus.APPROVED &&
                entity.getType() == FabricHoldRequestType.HOLD) {
            // Find or create inventory entry
            FabricInventoryEntity inventory = fabricInventoryRepository
                    .findByFabricIdAndLocationAndIsDeletedFalse(
                            entity.getFabric().getId(), null
                    ).orElse(FabricInventoryEntity.builder()
                            .fabric(entity.getFabric())
                            .location("DEFAULT")
                            .quantity(BigDecimal.ZERO)
                            .reservedQuantity(BigDecimal.ZERO)
                            .build());

            inventory.setReservedQuantity(
                    inventory.getReservedQuantity().add(entity.getQuantity())
            );
            fabricInventoryRepository.save(inventory);
        }

        entity = fabricHoldRequestRepository.save(entity);

        log.info("[TraceId: {}] Hold request status updated: id={}, status={}, handledBy={}",
                TraceIdUtil.getTraceId(), id, newStatus, handledBy);

        return toHoldRequestResponse(entity);
    }

    @Override
    @Transactional
    public void cancelHoldRequest(Long id, Long userId) {
        FabricHoldRequestEntity entity = fabricHoldRequestRepository
                .findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Hold request not found"));

        // Check ownership
        if (!entity.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only cancel your own requests");
        }

        // Check status
        if (entity.getStatus() == FabricHoldRequestStatus.COMPLETED ||
                entity.getStatus() == FabricHoldRequestStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel completed or cancelled request");
        }

        // If approved HOLD request, release reserved quantity
        if (entity.getStatus() == FabricHoldRequestStatus.APPROVED &&
                entity.getType() == FabricHoldRequestType.HOLD) {
            FabricInventoryEntity inventory = fabricInventoryRepository
                    .findByFabricIdAndLocationAndIsDeletedFalse(
                            entity.getFabric().getId(), null
                    ).orElse(null);

            if (inventory != null) {
                inventory.setReservedQuantity(
                        inventory.getReservedQuantity().subtract(entity.getQuantity())
                );
                fabricInventoryRepository.save(inventory);
            }
        }

        entity.setStatus(FabricHoldRequestStatus.CANCELLED);
        fabricHoldRequestRepository.save(entity);

        log.info("[TraceId: {}] Hold request cancelled: id={}, userId={}",
                TraceIdUtil.getTraceId(), id, userId);
    }

    /**
     * Convert entity to response DTO
     */
    private FabricResponse toResponse(FabricEntity entity) {
        // Calculate inventory totals
        BigDecimal totalQuantity = fabricInventoryRepository
                .calculateTotalQuantityByFabricId(entity.getId());
        BigDecimal totalReserved = fabricInventoryRepository
                .calculateTotalReservedQuantityByFabricId(entity.getId());
        BigDecimal availableQuantity = totalQuantity.subtract(totalReserved);

        // Check low stock
        List<FabricInventoryEntity> lowStockInventories = fabricInventoryRepository
                .findLowStockInventories(entity.getId());
        Boolean isLowStock = !lowStockInventories.isEmpty();

        // Parse gallery
        List<String> gallery = parseGallery(entity.getGallery());

        return FabricResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .slug(entity.getSlug())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .material(entity.getMaterial())
                .color(entity.getColor())
                .pattern(entity.getPattern())
                .width(entity.getWidth())
                .weight(entity.getWeight())
                .pricePerMeter(entity.getPricePerMeter())
                .image(entity.getImage())
                .gallery(gallery)
                .origin(entity.getOrigin())
                .careInstructions(entity.getCareInstructions())
                .isAvailable(entity.getIsAvailable())
                .isFeatured(entity.getIsFeatured())
                .displayOrder(entity.getDisplayOrder())
                .viewCount(entity.getViewCount())
                .totalQuantity(totalQuantity)
                .availableQuantity(availableQuantity)
                .isLowStock(isLowStock)
                .createdById(entity.getCreatedBy() != null ? entity.getCreatedBy().getId() : null)
                .createdByName(entity.getCreatedBy() != null ? entity.getCreatedBy().getName() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Convert inventory entity to response DTO
     */
    private FabricInventoryResponse toInventoryResponse(
            FabricInventoryEntity inventory, FabricEntity fabric
    ) {
        return FabricInventoryResponse.builder()
                .id(inventory.getId())
                .fabricId(fabric.getId())
                .fabricName(fabric.getName())
                .location(inventory.getLocation())
                .quantity(inventory.getQuantity())
                .reservedQuantity(inventory.getReservedQuantity())
                .availableQuantity(inventory.getAvailableQuantity())
                .minStockLevel(inventory.getMinStockLevel())
                .maxStockLevel(inventory.getMaxStockLevel())
                .isLowStock(inventory.isLowStock())
                .unit(inventory.getUnit())
                .lastRestockedAt(inventory.getLastRestockedAt())
                .notes(inventory.getNotes())
                .createdAt(inventory.getCreatedAt())
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }

    /**
     * Convert hold request entity to response DTO
     */
    private FabricHoldRequestResponse toHoldRequestResponse(FabricHoldRequestEntity entity) {
        return FabricHoldRequestResponse.builder()
                .id(entity.getId())
                .fabricId(entity.getFabric().getId())
                .fabricName(entity.getFabric().getName())
                .fabricImage(entity.getFabric().getImage())
                .userId(entity.getUser().getId())
                .userName(entity.getUser().getName())
                .type(entity.getType())
                .quantity(entity.getQuantity())
                .requestedDate(entity.getRequestedDate())
                .requestedTime(entity.getRequestedTime())
                .status(entity.getStatus())
                .expiryDate(entity.getExpiryDate())
                .notes(entity.getNotes())
                .staffNotes(entity.getStaffNotes())
                .handledById(entity.getHandledBy() != null ? entity.getHandledBy().getId() : null)
                .handledByName(entity.getHandledBy() != null ? entity.getHandledBy().getName() : null)
                .handledAt(entity.getHandledAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Generate slug from name
     */
    private String generateSlug(String name) {
        if (name == null || name.isEmpty()) {
            return null;
        }
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    /**
     * Convert gallery list to JSON string
     */
    private String convertGalleryToString(List<String> gallery) {
        if (gallery == null || gallery.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(gallery);
        } catch (Exception e) {
            log.error("[TraceId: {}] Error converting gallery to JSON: {}",
                    TraceIdUtil.getTraceId(), e.getMessage());
            return null;
        }
    }

    /**
     * Parse gallery JSON string to list
     */
    private List<String> parseGallery(String galleryJson) {
        if (galleryJson == null || galleryJson.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(galleryJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.error("[TraceId: {}] Error parsing gallery JSON: {}",
                    TraceIdUtil.getTraceId(), e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public FabricOrderResponse applyPromoCode(ApplyFabricPromoRequest request, Long userId) {
        // Validate fabric
        FabricEntity fabric = fabricRepository.findById(request.getFabricId())
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));

        if (!Boolean.TRUE.equals(fabric.getIsAvailable())) {
            throw new BadRequestException("Fabric is not available");
        }

        // Check available quantity
        BigDecimal totalQuantity = fabricInventoryRepository
                .calculateTotalQuantityByFabricId(fabric.getId());
        BigDecimal totalReserved = fabricInventoryRepository
                .calculateTotalReservedQuantityByFabricId(fabric.getId());
        BigDecimal availableQuantity = totalQuantity.subtract(totalReserved);

        if (request.getQuantity().compareTo(availableQuantity) > 0) {
            throw new BadRequestException(
                    String.format("Insufficient quantity. Available: %s", availableQuantity)
            );
        }

        // Calculate subtotal
        BigDecimal subtotal = fabric.getPricePerMeter()
                .multiply(request.getQuantity());

        // Prepare category IDs for promotion (convert enum to string)
        List<String> categoryIds = null;
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            categoryIds = request.getCategoryIds().stream()
                    .map(String::valueOf)
                    .collect(java.util.stream.Collectors.toList());
        } else if (fabric.getCategory() != null) {
            categoryIds = List.of(fabric.getCategory().name());
        }

        // Apply promo code via PromotionService
        ApplyPromoCodeRequest promoRequest = ApplyPromoCodeRequest.builder()
                .code(request.getPromoCode())
                .orderAmount(subtotal)
                .productIds(List.of(fabric.getId())) // Fabric ID as product ID
                .categoryIds(categoryIds)
                .build();

        ApplyPromoCodeResponse promoResponse = promotionService.applyPromoCode(promoRequest, userId);

        // Build response
        return FabricOrderResponse.builder()
                    .fabricId(fabric.getId())
                .fabricName(fabric.getName())
                .fabricCode(fabric.getCode())
                .quantity(request.getQuantity())
                .pricePerMeter(fabric.getPricePerMeter())
                .subtotal(subtotal)
                .promoCode(promoResponse.getCode())
                .promotionId(promoResponse.getPromotionId())
                .promotionName(promoResponse.getName())
                .discountAmount(promoResponse.getDiscountAmount())
                .finalAmount(promoResponse.getFinalAmount())
                .message(promoResponse.getMessage())
                .appliedAt(java.time.OffsetDateTime.now())
                .build();
    }
}


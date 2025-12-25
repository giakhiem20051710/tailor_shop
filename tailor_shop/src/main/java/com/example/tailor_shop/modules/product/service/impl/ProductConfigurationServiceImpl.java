package com.example.tailor_shop.modules.product.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import com.example.tailor_shop.modules.fabric.dto.FabricResponse;
import com.example.tailor_shop.modules.fabric.repository.FabricRepository;
import com.example.tailor_shop.modules.fabric.service.FabricService;
import com.example.tailor_shop.modules.product.domain.ProductConfigurationEntity;
import com.example.tailor_shop.modules.product.domain.ProductTemplateEntity;
import com.example.tailor_shop.modules.product.domain.StyleEntity;
import com.example.tailor_shop.modules.product.dto.ProductConfigurationRequest;
import com.example.tailor_shop.modules.product.dto.ProductConfigurationResponse;
import com.example.tailor_shop.modules.product.dto.ProductTemplateResponse;
import com.example.tailor_shop.modules.product.dto.StyleResponse;
import com.example.tailor_shop.modules.product.repository.ProductConfigurationRepository;
import com.example.tailor_shop.modules.product.repository.ProductTemplateRepository;
import com.example.tailor_shop.modules.product.repository.StyleRepository;
import com.example.tailor_shop.modules.product.service.ProductConfigurationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý ProductConfiguration (Mix & Match)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductConfigurationServiceImpl implements ProductConfigurationService {

    private final ProductConfigurationRepository productConfigurationRepository;
    private final ProductTemplateRepository productTemplateRepository;
    private final FabricRepository fabricRepository;
    private final StyleRepository styleRepository;

    // Giá mặc định cho template (có thể config sau)
    private static final BigDecimal DEFAULT_TEMPLATE_PRICE = BigDecimal.valueOf(500000); // 500k
    // Số mét vải ước tính cho một sản phẩm
    private static final BigDecimal ESTIMATED_FABRIC_METERS = BigDecimal.valueOf(2.0);

    @Override
    @Transactional
    public ProductConfigurationResponse create(ProductConfigurationRequest request) {
        log.info("Creating ProductConfiguration: templateId={}, fabricId={}, styleId={}",
                request.getTemplateId(), request.getFabricId(), request.getStyleId());

        // Validate và lấy entities
        ProductTemplateEntity template = productTemplateRepository
                .findByIdAndIsDeletedFalse(request.getTemplateId())
                .orElseThrow(() -> new NotFoundException("Template not found"));

        FabricEntity fabric = fabricRepository
                .findById(request.getFabricId())
                .orElseThrow(() -> new NotFoundException("Fabric not found"));

        if (fabric.getIsDeleted() != null && fabric.getIsDeleted()) {
            throw new BadRequestException("Fabric is deleted");
        }

        StyleEntity style = null;
        if (request.getStyleId() != null) {
            style = styleRepository
                    .findByIdAndIsDeletedFalse(request.getStyleId())
                    .orElseThrow(() -> new NotFoundException("Style not found"));
        }

        // Kiểm tra xem đã tồn tại chưa
        productConfigurationRepository.findByTemplateAndFabric(
                template.getId(), fabric.getId()
        ).ifPresent(existing -> {
            throw new BadRequestException("ProductConfiguration already exists for this template and fabric");
        });

        // Tính giá tự động
        BigDecimal basePrice = calculatePrice(
                template.getId(),
                fabric.getId(),
                style != null ? style.getId() : null
        );

        // Tạo ProductConfiguration
        ProductConfigurationEntity entity = ProductConfigurationEntity.builder()
                .template(template)
                .fabric(fabric)
                .style(style)
                .basePrice(basePrice)
                .isAvailable(true)
                .viewCount(0)
                .isDeleted(false)
                .build();

        entity = productConfigurationRepository.save(entity);

        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FabricResponse> getFabricsByTemplate(Long templateId, int page, int size) {
        log.info("Getting fabrics for template: templateId={}, page={}, size={}", templateId, page, size);

        // Validate template
        productTemplateRepository.findByIdAndIsDeletedFalse(templateId)
                .orElseThrow(() -> new NotFoundException("Template not found"));

        // Lấy tất cả fabrics available (có thể filter theo category sau)
        Pageable pageable = PageRequest.of(page, size);
        Page<FabricEntity> fabricPage = fabricRepository.searchFabrics(
                null, // category
                null, // color
                null, // pattern
                null, // material
                null, // origin
                true, // isAvailable
                null, // isFeatured
                null, // minPrice
                null, // maxPrice
                null, // keyword
                pageable
        );

        return fabricPage.map(this::toFabricResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StyleResponse> getStylesByTemplate(Long templateId, int page, int size) {
        log.info("Getting styles for template: templateId={}, page={}, size={}", templateId, page, size);

        // Validate template
        productTemplateRepository.findByIdAndIsDeletedFalse(templateId)
                .orElseThrow(() -> new NotFoundException("Template not found"));

        // Lấy tất cả styles (có thể filter theo category sau)
        Pageable pageable = PageRequest.of(page, size);
        Page<StyleEntity> stylePage = styleRepository.search(
                null, // category
                null, // keyword
                pageable
        );

        return stylePage.map(this::toStyleResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductTemplateResponse> getAllTemplates() {
        log.info("Getting all templates");
        List<ProductTemplateEntity> templates = productTemplateRepository
                .findByIsDeletedFalseAndIsActiveTrueOrderByDisplayOrderAsc();
        return templates.stream()
                .map(this::toTemplateResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductConfigurationResponse getById(Long id) {
        log.info("Getting ProductConfiguration: id={}", id);
        ProductConfigurationEntity entity = productConfigurationRepository
                .findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("ProductConfiguration not found"));
        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculatePrice(Long templateId, Long fabricId, Long styleId) {
        BigDecimal totalPrice = BigDecimal.ZERO;

        // Template price (mặc định)
        totalPrice = totalPrice.add(DEFAULT_TEMPLATE_PRICE);

        // Fabric price
        if (fabricId != null) {
            FabricEntity fabric = fabricRepository.findById(fabricId)
                    .orElseThrow(() -> new NotFoundException("Fabric not found"));
            if (fabric.getPricePerMeter() != null) {
                BigDecimal fabricPrice = fabric.getPricePerMeter()
                        .multiply(ESTIMATED_FABRIC_METERS);
                totalPrice = totalPrice.add(fabricPrice);
            }
        }

        // Style price
        if (styleId != null) {
            StyleEntity style = styleRepository.findByIdAndIsDeletedFalse(styleId)
                    .orElse(null);
            if (style != null && style.getPrice() != null) {
                totalPrice = totalPrice.add(style.getPrice());
            }
        }

        return totalPrice.setScale(0, RoundingMode.HALF_UP);
    }

    private ProductConfigurationResponse toResponse(ProductConfigurationEntity entity) {
        return ProductConfigurationResponse.builder()
                .id(entity.getId())
                .templateId(entity.getTemplate().getId())
                .templateName(entity.getTemplate().getName())
                .templateImage(entity.getTemplate().getBaseImage())
                .fabricId(entity.getFabric().getId())
                .fabricName(entity.getFabric().getName())
                .fabricImage(entity.getFabric().getImage())
                .fabricColor(entity.getFabric().getColor())
                .styleId(entity.getStyle() != null ? entity.getStyle().getId() : null)
                .styleName(entity.getStyle() != null ? entity.getStyle().getName() : null)
                .styleImage(entity.getStyle() != null ? entity.getStyle().getImage() : null)
                .generatedImage(entity.getGeneratedImage())
                .basePrice(entity.getBasePrice())
                .isAvailable(entity.getIsAvailable())
                .viewCount(entity.getViewCount())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private ProductTemplateResponse toTemplateResponse(ProductTemplateEntity entity) {
        return ProductTemplateResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .slug(entity.getSlug())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .baseImage(entity.getBaseImage())
                .isActive(entity.getIsActive())
                .displayOrder(entity.getDisplayOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private FabricResponse toFabricResponse(FabricEntity entity) {
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
                .gallery(parseGallery(entity.getGallery()))
                .origin(entity.getOrigin())
                .careInstructions(entity.getCareInstructions())
                .isAvailable(entity.getIsAvailable())
                .isFeatured(entity.getIsFeatured())
                .displayOrder(entity.getDisplayOrder())
                .viewCount(entity.getViewCount())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private StyleResponse toStyleResponse(StyleEntity entity) {
        return StyleResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .category(entity.getCategory())
                .image(entity.getImage())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private List<String> parseGallery(String galleryJson) {
        if (galleryJson == null || galleryJson.trim().isEmpty()) {
            return List.of();
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(galleryJson, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse gallery JSON: {}", galleryJson, e);
            return List.of();
        }
    }
}


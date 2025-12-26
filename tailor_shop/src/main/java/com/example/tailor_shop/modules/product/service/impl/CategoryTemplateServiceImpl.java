package com.example.tailor_shop.modules.product.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.product.domain.CategoryTemplateEntity;
import com.example.tailor_shop.modules.product.dto.CategoryTemplateRequest;
import com.example.tailor_shop.modules.product.dto.CategoryTemplateResponse;
import com.example.tailor_shop.modules.product.repository.CategoryTemplateRepository;
import com.example.tailor_shop.modules.product.service.CategoryTemplateService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryTemplateServiceImpl implements CategoryTemplateService {

    private final CategoryTemplateRepository categoryTemplateRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryTemplateResponse> getAll() {
        return categoryTemplateRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryTemplateResponse getById(Long id) {
        CategoryTemplateEntity entity = categoryTemplateRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category Template not found"));
        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryTemplateResponse getByCode(String code) {
        CategoryTemplateEntity entity = categoryTemplateRepository.findByCategoryCode(code)
                .orElseThrow(() -> new NotFoundException("Category Template not found for code: " + code));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public CategoryTemplateResponse create(CategoryTemplateRequest request) {
        if (categoryTemplateRepository.findByCategoryCode(request.getCategoryCode()).isPresent()) {
            throw new BadRequestException("Template for category code already exists: " + request.getCategoryCode());
        }

        CategoryTemplateEntity entity = new CategoryTemplateEntity();
        mapRequestToEntity(request, entity);

        // Initial creation
        if (request.getCategoryCode() != null)
            entity.setCategoryCode(request.getCategoryCode());
        if (request.getCategoryName() != null)
            entity.setCategoryName(request.getCategoryName());

        return toResponse(categoryTemplateRepository.save(entity));
    }

    @Override
    @Transactional
    public CategoryTemplateResponse update(Long id, CategoryTemplateRequest request) {
        CategoryTemplateEntity entity = categoryTemplateRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category Template not found"));

        mapRequestToEntity(request, entity);

        // Allowed to update Name but Code usually stays creating key
        if (request.getCategoryName() != null)
            entity.setCategoryName(request.getCategoryName());

        return toResponse(categoryTemplateRepository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!categoryTemplateRepository.existsById(id)) {
            throw new NotFoundException("Category Template not found");
        }
        categoryTemplateRepository.deleteById(id);
    }

    private void mapRequestToEntity(CategoryTemplateRequest request, CategoryTemplateEntity entity) {
        entity.setTailoringTime(request.getTailoringTime());
        entity.setFittingCount(request.getFittingCount());
        entity.setWarranty(request.getWarranty());
        entity.setSilhouette(request.getSilhouette());
        entity.setLengthInfo(request.getLengthInfo());
        entity.setLining(request.getLining());
        entity.setAccessories(request.getAccessories());

        // JSON Fields
        entity.setMaterials(convertListToJson(request.getMaterials()));
        entity.setColors(convertListToJson(request.getColors()));
        entity.setOccasions(convertListToJson(request.getOccasions()));
        entity.setCustomerStyles(convertListToJson(request.getCustomerStyles()));
        entity.setCareInstructions(convertListToJson(request.getCareInstructions()));
    }

    private CategoryTemplateResponse toResponse(CategoryTemplateEntity entity) {
        return CategoryTemplateResponse.builder()
                .id(entity.getId())
                .categoryCode(entity.getCategoryCode())
                .categoryName(entity.getCategoryName())
                .tailoringTime(entity.getTailoringTime())
                .fittingCount(entity.getFittingCount())
                .warranty(entity.getWarranty())
                .silhouette(entity.getSilhouette())
                .materials(convertJsonToList(entity.getMaterials()))
                .colors(convertJsonToList(entity.getColors()))
                .lengthInfo(entity.getLengthInfo())
                .lining(entity.getLining())
                .accessories(entity.getAccessories())
                .occasions(convertJsonToList(entity.getOccasions()))
                .customerStyles(convertJsonToList(entity.getCustomerStyles()))
                .careInstructions(convertJsonToList(entity.getCareInstructions()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String convertListToJson(List<String> list) {
        if (list == null)
            return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            log.error("Error converting list to JSON", e);
            return null;
        }
    }

    private List<String> convertJsonToList(String json) {
        if (json == null || json.isEmpty())
            return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            log.error("Error converting JSON to list", e);
            return new ArrayList<>();
        }
    }
}

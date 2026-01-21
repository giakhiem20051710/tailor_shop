package com.example.tailor_shop.modules.product.service.impl;

import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.product.domain.StyleEntity;
import com.example.tailor_shop.modules.product.dto.StyleFilterRequest;
import com.example.tailor_shop.modules.product.dto.StyleRequest;
import com.example.tailor_shop.modules.product.dto.StyleResponse;
import com.example.tailor_shop.modules.product.repository.StyleRepository;
import com.example.tailor_shop.modules.product.service.StyleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StyleServiceImpl implements StyleService {

    private final StyleRepository styleRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<StyleResponse> list(StyleFilterRequest filter, Pageable pageable) {
        Page<StyleEntity> page = styleRepository.search(
                filter != null ? filter.getCategory() : null,
                filter != null ? filter.getKeyword() : null,
                pageable
        );
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public StyleResponse detail(Long id) {
        StyleEntity entity = styleRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Style not found"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public StyleResponse create(StyleRequest request) {
        StyleEntity entity = new StyleEntity();
        entity.setName(request.getName());
        entity.setCategory(request.getCategory());
        entity.setImage(request.getImage());
        entity.setDescription(request.getDescription());
        entity.setPrice(request.getPrice());
        entity.setIsDeleted(false);

        StyleEntity saved = styleRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public StyleResponse update(Long id, StyleRequest request) {
        StyleEntity entity = styleRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Style not found"));

        entity.setName(request.getName());
        entity.setCategory(request.getCategory());
        entity.setImage(request.getImage());
        entity.setDescription(request.getDescription());
        entity.setPrice(request.getPrice());

        StyleEntity saved = styleRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        StyleEntity entity = styleRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Style not found"));

        entity.setIsDeleted(true);
        styleRepository.save(entity);
    }

    private StyleResponse toResponse(StyleEntity entity) {
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
}


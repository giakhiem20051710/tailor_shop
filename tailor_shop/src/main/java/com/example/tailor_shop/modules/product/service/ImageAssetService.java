package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.domain.ImageAssetEntity;
import com.example.tailor_shop.modules.product.dto.ImageAssetRequest;
import com.example.tailor_shop.modules.product.dto.ImageAssetResponse;
import com.example.tailor_shop.modules.product.repository.ImageAssetRepository;
import com.example.tailor_shop.modules.fabric.repository.FabricRepository;
import com.example.tailor_shop.modules.product.repository.ImageAssetRepository;
import com.example.tailor_shop.modules.product.repository.ProductTemplateRepository;
import com.example.tailor_shop.modules.product.repository.StyleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageAssetService {

    private final ImageAssetRepository imageAssetRepository;
    private final ProductTemplateRepository productTemplateRepository;
    private final FabricRepository fabricRepository;
    private final StyleRepository styleRepository;
    private final ImageClassificationService classificationService;

    @Transactional
    public ImageAssetResponse create(ImageAssetRequest request) {
        ImageAssetEntity entity = ImageAssetEntity.builder()
                .s3Key(request.getS3Key())
                .url(request.getUrl())
                .category(request.getCategory())
                .type(request.getType())
                .gender(request.getGender() != null ? request.getGender() : "unisex")
                .tags(request.getTags())
                .productTemplate(request.getProductTemplateId() != null ?
                        productTemplateRepository.findById(request.getProductTemplateId()).orElse(null) : null)
                .fabric(request.getFabricId() != null ?
                        fabricRepository.findById(request.getFabricId()).orElse(null) : null)
                .style(request.getStyleId() != null ?
                        styleRepository.findById(request.getStyleId()).orElse(null) : null)
                .build();

        entity = imageAssetRepository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public ImageAssetResponse createWithAutoClassification(String s3Key, String url, String description, String fileName) {
        // Tự động phân loại
        ImageClassificationService.ImageClassificationResult classification =
                classificationService.classify(description, fileName);

        ImageAssetRequest request = ImageAssetRequest.builder()
                .s3Key(s3Key)
                .url(url)
                .category(classification.getCategory())
                .type(classification.getType())
                .gender(classification.getGender())
                .tags(classification.getTags())
                .build();

        return create(request);
    }

    public ImageAssetResponse getById(Long id) {
        ImageAssetEntity entity = imageAssetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Image asset not found"));
        return toResponse(entity);
    }

    public Page<ImageAssetResponse> getAll(Pageable pageable) {
        return imageAssetRepository.findAll(pageable)
                .map(this::toResponse);
    }

    public Page<ImageAssetResponse> getByCategory(String category, Pageable pageable) {
        return imageAssetRepository.findByCategory(category, pageable)
                .map(this::toResponse);
    }

    public Page<ImageAssetResponse> getByCategoryAndType(String category, String type, Pageable pageable) {
        return imageAssetRepository.findByCategoryAndType(category, type, pageable)
                .map(this::toResponse);
    }

    public Page<ImageAssetResponse> getByCategoryTypeAndGender(String category, String type, String gender, Pageable pageable) {
        return imageAssetRepository.findByCategoryTypeAndGender(category, type, gender, pageable)
                .map(this::toResponse);
    }

    public List<ImageAssetResponse> getByTemplateId(Long templateId) {
        return imageAssetRepository.findByProductTemplateId(templateId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ImageAssetResponse toResponse(ImageAssetEntity entity) {
        return ImageAssetResponse.builder()
                .id(entity.getId())
                .s3Key(entity.getS3Key())
                .url(entity.getUrl())
                .category(entity.getCategory())
                .type(entity.getType())
                .gender(entity.getGender())
                .tags(entity.getTags())
                .productTemplateId(entity.getProductTemplate() != null ? entity.getProductTemplate().getId() : null)
                .fabricId(entity.getFabric() != null ? entity.getFabric().getId() : null)
                .styleId(entity.getStyle() != null ? entity.getStyle().getId() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}


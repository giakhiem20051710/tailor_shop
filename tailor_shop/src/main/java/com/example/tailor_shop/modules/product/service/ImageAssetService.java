package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.domain.ImageAssetEntity;
import com.example.tailor_shop.modules.product.dto.ImageAssetRequest;
import com.example.tailor_shop.modules.product.dto.ImageAssetResponse;
import com.example.tailor_shop.modules.product.repository.ImageAssetRepository;
import com.example.tailor_shop.modules.fabric.repository.FabricRepository;
import com.example.tailor_shop.modules.product.repository.ImageAssetRepository;
import com.example.tailor_shop.modules.product.repository.ProductTemplateRepository;
import com.example.tailor_shop.modules.product.repository.StyleRepository;
import com.example.tailor_shop.modules.product.repository.BulkUploadJobFileRepository;
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
    private final BulkUploadJobFileRepository bulkUploadJobFileRepository;

    @Transactional
    public ImageAssetResponse create(ImageAssetRequest request) {
        ImageAssetEntity entity = ImageAssetEntity.builder()
                .s3Key(request.getS3Key())
                .url(request.getUrl())
                .thumbnailUrl(request.getThumbnailUrl())
                .largeUrl(request.getLargeUrl())
                .category(request.getCategory())
                .type(request.getType())
                .gender(request.getGender() != null ? request.getGender() : "unisex")
                .tags(request.getTags())
                // AI Analysis Fields
                .description(request.getDescription())
                .occasion(request.getOccasion())
                .season(request.getSeason())
                .styleCategory(request.getStyleCategory())
                .silhouette(request.getSilhouette())
                .lengthInfo(request.getLengthInfo())
                .lining(request.getLining())
                .accessories(request.getAccessories())
                .tailoringTime(request.getTailoringTime())
                .fittingCount(request.getFittingCount())
                .warranty(request.getWarranty())
                .materials(request.getMaterials())
                .colors(request.getColors())
                .occasions(request.getOccasions())
                .customerStyles(request.getCustomerStyles())
                .careInstructions(request.getCareInstructions())
                .confidence(request.getConfidence())
                // Relations
                .productTemplate(request.getProductTemplateId() != null
                        ? productTemplateRepository.findById(request.getProductTemplateId()).orElse(null)
                        : null)
                .fabric(request.getFabricId() != null ? fabricRepository.findById(request.getFabricId()).orElse(null)
                        : null)
                .style(request.getStyleId() != null ? styleRepository.findById(request.getStyleId()).orElse(null)
                        : null)
                .build();

        entity = imageAssetRepository.save(entity);
        log.info("✅ Created ImageAsset ID: {} with type: {}, description: {}",
                entity.getId(), entity.getType(),
                entity.getDescription() != null
                        ? entity.getDescription().substring(0, Math.min(50, entity.getDescription().length())) + "..."
                        : "null");
        return toResponse(entity);
    }

    @Transactional
    public ImageAssetResponse createWithAutoClassification(String s3Key, String url, String description,
            String fileName) {
        // Tự động phân loại
        ImageClassificationService.ImageClassificationResult classification = classificationService
                .classify(description, fileName);

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

    public Page<ImageAssetResponse> getByCategoryTypeAndGender(String category, String type, String gender,
            Pageable pageable) {
        return imageAssetRepository.findByCategoryTypeAndGender(category, type, gender, pageable)
                .map(this::toResponse);
    }

    public List<ImageAssetResponse> getByTemplateId(Long templateId) {
        return imageAssetRepository.findByProductTemplateId(templateId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) {
        ImageAssetEntity entity = imageAssetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Image asset not found with id: " + id));

        // Xóa checksum từ bulk_upload_job_files để có thể upload lại cùng file sau này
        try {
            int deletedChecksums = bulkUploadJobFileRepository.findByImageAssetId(id).size();
            bulkUploadJobFileRepository.deleteByImageAssetId(id);
            if (deletedChecksums > 0) {
                log.info(" Deleted {} checksum records for ImageAsset ID: {} (can now re-upload same file)",
                        deletedChecksums, id);
            }
        } catch (Exception e) {
            log.warn(" Failed to delete checksum records for ImageAsset ID {}: {}", id, e.getMessage());
            // Tiếp tục xóa ImageAsset dù có lỗi khi xóa checksum
        }

        // Note: S3 files sẽ được xóa trong Controller để có thể log chi tiết
        // Ở đây chỉ xóa từ database
        imageAssetRepository.delete(entity);
        log.info("✅ Deleted ImageAsset with ID: {}", id);
    }

    /**
     * Cleanup các checksum orphan (không có ImageAsset tương ứng)
     * Dùng để xử lý các checksum còn sót lại sau khi xóa ImageAsset trước khi có
     * code cleanup
     * 
     * @return Số lượng checksum đã xóa
     */
    @Transactional
    public int cleanupOrphanChecksums() {
        try {
            // Tìm tất cả các checksum có imageAssetId
            List<com.example.tailor_shop.modules.product.domain.BulkUploadJobFileEntity> allWithImageAssetId = bulkUploadJobFileRepository
                    .findAllWithImageAssetId();

            int orphanCount = 0;
            for (var fileEntity : allWithImageAssetId) {
                // Kiểm tra xem ImageAsset có tồn tại không
                boolean exists = imageAssetRepository.existsById(fileEntity.getImageAssetId());
                if (!exists) {
                    orphanCount++;
                }
            }

            // Xóa các orphan checksums
            int deletedCount = bulkUploadJobFileRepository.deleteOrphanChecksums();

            log.info("🧹 Cleanup orphan checksums: found {} orphan checksums, deleted {} records", orphanCount,
                    deletedCount);
            return deletedCount;
        } catch (Exception e) {
            log.error("❌ Error cleaning up orphan checksums: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to cleanup orphan checksums: " + e.getMessage(), e);
        }
    }

    private ImageAssetResponse toResponse(ImageAssetEntity entity) {
        return ImageAssetResponse.builder()
                .id(entity.getId())
                .s3Key(entity.getS3Key())
                .url(entity.getUrl())
                .thumbnailUrl(entity.getThumbnailUrl())
                .largeUrl(entity.getLargeUrl())
                .category(entity.getCategory())
                .type(entity.getType())
                .gender(entity.getGender())
                .tags(entity.getTags())
                .productTemplateId(entity.getProductTemplate() != null ? entity.getProductTemplate().getId() : null)
                .fabricId(entity.getFabric() != null ? entity.getFabric().getId() : null)
                .styleId(entity.getStyle() != null ? entity.getStyle().getId() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                // AI Analysis Fields
                .description(entity.getDescription())
                .occasion(entity.getOccasion())
                .season(entity.getSeason())
                .styleCategory(entity.getStyleCategory())
                .silhouette(entity.getSilhouette())
                .lengthInfo(entity.getLengthInfo())
                .lining(entity.getLining())
                .accessories(entity.getAccessories())
                .tailoringTime(entity.getTailoringTime())
                .fittingCount(entity.getFittingCount())
                .warranty(entity.getWarranty())
                .materials(entity.getMaterials())
                .colors(entity.getColors())
                .occasions(entity.getOccasions())
                .customerStyles(entity.getCustomerStyles())
                .careInstructions(entity.getCareInstructions())
                .confidence(entity.getConfidence())
                .build();
    }
}

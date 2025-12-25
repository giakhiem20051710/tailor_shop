package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.domain.ImageChecksumEntity;
import com.example.tailor_shop.modules.product.repository.ImageChecksumRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service để check duplicate images bằng checksum
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DuplicateCheckService {

    private final ImageChecksumRepository checksumRepository;

    /**
     * Check duplicates từ list checksums
     * @return Map: checksum -> isDuplicate
     */
    public Map<String, Boolean> checkDuplicates(List<String> checksums) {
        if (checksums == null || checksums.isEmpty()) {
            return Collections.emptyMap();
        }

        // Query database để tìm existing checksums
        List<ImageChecksumEntity> existing = checksumRepository.findByChecksumIn(checksums);
        Set<String> existingChecksums = existing.stream()
                .map(ImageChecksumEntity::getChecksum)
                .collect(Collectors.toSet());

        // Build result map
        Map<String, Boolean> result = new HashMap<>();
        for (String checksum : checksums) {
            result.put(checksum, existingChecksums.contains(checksum));
        }

        log.info("Checked {} checksums, found {} duplicates", checksums.size(), existingChecksums.size());
        return result;
    }

    /**
     * Get existing image info for duplicate checksums
     */
    public Map<String, DuplicateInfo> getDuplicateInfo(List<String> checksums) {
        List<ImageChecksumEntity> existing = checksumRepository.findByChecksumIn(checksums);
        
        Map<String, DuplicateInfo> result = new HashMap<>();
        for (ImageChecksumEntity entity : existing) {
            result.put(entity.getChecksum(), DuplicateInfo.builder()
                    .checksum(entity.getChecksum())
                    .productId(entity.getProductId())
                    .imageAssetId(entity.getImageAssetId())
                    .s3Url(entity.getS3Url())
                    .build());
        }
        
        return result;
    }

    /**
     * Save checksum sau khi tạo image asset và product
     */
    @Transactional
    public void saveChecksum(String checksum, Long imageAssetId, Long productId, String s3Url) {
        if (checksum == null || checksum.isEmpty()) {
            return;
        }

        // Check if already exists
        Optional<ImageChecksumEntity> existing = checksumRepository.findByChecksum(checksum);
        if (existing.isPresent()) {
            log.debug("Checksum {} already exists, skipping", checksum);
            return;
        }

        ImageChecksumEntity entity = ImageChecksumEntity.builder()
                .checksum(checksum)
                .imageAssetId(imageAssetId)
                .productId(productId)
                .s3Url(s3Url)
                .build();

        checksumRepository.save(entity);
        log.debug("Saved checksum: {} for imageAssetId: {}, productId: {}", checksum, imageAssetId, productId);
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DuplicateInfo {
        private String checksum;
        private Long productId;
        private Long imageAssetId;
        private String s3Url;
    }
}


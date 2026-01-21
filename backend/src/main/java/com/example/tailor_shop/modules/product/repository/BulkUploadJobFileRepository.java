package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.BulkUploadJobFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface BulkUploadJobFileRepository extends JpaRepository<BulkUploadJobFileEntity, Long> {

    List<BulkUploadJobFileEntity> findByJobId(String jobId);

    List<BulkUploadJobFileEntity> findByJobIdAndStatus(String jobId, BulkUploadJobFileEntity.FileStatus status);

    /**
     * Tìm tất cả các file records liên quan đến ImageAsset ID
     * Dùng để xóa checksum khi xóa ImageAsset
     */
    List<BulkUploadJobFileEntity> findByImageAssetId(Long imageAssetId);

    /**
     * Xóa tất cả các file records liên quan đến ImageAsset ID
     * Dùng để xóa checksum khi xóa ImageAsset để có thể upload lại cùng file
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM BulkUploadJobFileEntity f WHERE f.imageAssetId = :imageAssetId")
    void deleteByImageAssetId(@Param("imageAssetId") Long imageAssetId);

    /**
     * Tìm tất cả các file records có imageAssetId nhưng ImageAsset không tồn tại (orphan checksums)
     * Dùng để cleanup các checksum orphan sau khi xóa ImageAsset
     */
    @Query("SELECT f FROM BulkUploadJobFileEntity f WHERE f.imageAssetId IS NOT NULL")
    List<BulkUploadJobFileEntity> findAllWithImageAssetId();

    /**
     * Xóa tất cả các file records có imageAssetId nhưng ImageAsset không tồn tại (orphan checksums)
     * Dùng để cleanup các checksum orphan sau khi xóa ImageAsset
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM BulkUploadJobFileEntity f WHERE f.imageAssetId IS NOT NULL AND f.imageAssetId NOT IN (SELECT ia.id FROM ImageAssetEntity ia)")
    int deleteOrphanChecksums();
}


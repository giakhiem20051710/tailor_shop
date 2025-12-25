package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.BulkUploadJobFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BulkUploadJobFileRepository extends JpaRepository<BulkUploadJobFileEntity, Long> {

    List<BulkUploadJobFileEntity> findByJobId(String jobId);

    List<BulkUploadJobFileEntity> findByJobIdAndStatus(String jobId, BulkUploadJobFileEntity.FileStatus status);
}


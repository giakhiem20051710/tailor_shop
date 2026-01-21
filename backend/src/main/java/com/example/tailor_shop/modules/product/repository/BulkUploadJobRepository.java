package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.BulkUploadJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BulkUploadJobRepository extends JpaRepository<BulkUploadJobEntity, Long> {

    Optional<BulkUploadJobEntity> findByJobId(String jobId);

    @Query("SELECT j FROM BulkUploadJobEntity j WHERE j.status IN :statuses AND j.expiresAt < :now")
    List<BulkUploadJobEntity> findExpiredJobs(@Param("statuses") List<BulkUploadJobEntity.JobStatus> statuses, 
                                               @Param("now") OffsetDateTime now);
}


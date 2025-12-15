package com.example.tailor_shop.modules.fabric.repository;

import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestEntity;
import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestStatus;
import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FabricHoldRequestRepository extends JpaRepository<FabricHoldRequestEntity, Long> {

    /**
     * Tìm request theo ID và không bị xóa
     */
    Optional<FabricHoldRequestEntity> findByIdAndIsDeletedFalse(Long id);

    /**
     * Tìm requests theo fabric ID
     */
    Page<FabricHoldRequestEntity> findByFabricIdAndIsDeletedFalse(
            Long fabricId, Pageable pageable
    );

    /**
     * Tìm requests theo user ID
     */
    Page<FabricHoldRequestEntity> findByUserIdAndIsDeletedFalse(
            Long userId, Pageable pageable
    );

    /**
     * Tìm requests theo status
     */
    Page<FabricHoldRequestEntity> findByStatusAndIsDeletedFalse(
            FabricHoldRequestStatus status, Pageable pageable
    );

    /**
     * Tìm requests theo type
     */
    Page<FabricHoldRequestEntity> findByTypeAndIsDeletedFalse(
            FabricHoldRequestType type, Pageable pageable
    );

    /**
     * Search requests với filter
     */
    @Query("SELECT r FROM FabricHoldRequestEntity r WHERE r.isDeleted = false " +
            "AND (:fabricId IS NULL OR r.fabric.id = :fabricId) " +
            "AND (:userId IS NULL OR r.user.id = :userId) " +
            "AND (:type IS NULL OR r.type = :type) " +
            "AND (:status IS NULL OR r.status = :status) " +
            "AND (:requestedDate IS NULL OR r.requestedDate = :requestedDate)")
    Page<FabricHoldRequestEntity> searchRequests(
            @Param("fabricId") Long fabricId,
            @Param("userId") Long userId,
            @Param("type") FabricHoldRequestType type,
            @Param("status") FabricHoldRequestStatus status,
            @Param("requestedDate") LocalDate requestedDate,
            Pageable pageable
    );

    /**
     * Tìm active hold requests (APPROVED, chưa hết hạn)
     */
    @Query("SELECT r FROM FabricHoldRequestEntity r " +
            "WHERE r.type = 'HOLD' " +
            "AND r.status = 'APPROVED' " +
            "AND (r.expiryDate IS NULL OR r.expiryDate >= :today) " +
            "AND r.isDeleted = false")
    List<FabricHoldRequestEntity> findActiveHoldRequests(@Param("today") LocalDate today);
}


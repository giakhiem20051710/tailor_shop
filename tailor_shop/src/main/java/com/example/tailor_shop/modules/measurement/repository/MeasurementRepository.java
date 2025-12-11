package com.example.tailor_shop.modules.measurement.repository;

import com.example.tailor_shop.modules.measurement.domain.MeasurementEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MeasurementRepository extends JpaRepository<MeasurementEntity, Long> {

    @Query("""
            SELECT m FROM MeasurementEntity m
            WHERE m.isLatest = true
              AND (:customerId IS NULL OR m.customer.id = :customerId)
              AND (:orderId IS NULL OR m.order.id = :orderId)
            """)
    Page<MeasurementEntity> findLatest(
            @Param("customerId") Long customerId,
            @Param("orderId") Long orderId,
            Pageable pageable
    );

    List<MeasurementEntity> findByGroupIdOrderByVersionDesc(String groupId);

    MeasurementEntity findFirstByGroupIdAndIsLatestTrue(String groupId);
}


package com.example.tailor_shop.modules.fabric.repository;

import com.example.tailor_shop.modules.fabric.domain.FabricOrderEntity;
import com.example.tailor_shop.modules.fabric.domain.FabricOrderStatus;
import com.example.tailor_shop.modules.fabric.domain.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FabricOrderRepository extends JpaRepository<FabricOrderEntity, Long> {

    Optional<FabricOrderEntity> findByCodeAndIsDeletedFalse(String code);

    Page<FabricOrderEntity> findByCustomerIdAndIsDeletedFalse(Long customerId, Pageable pageable);

    @Query("SELECT o FROM FabricOrderEntity o WHERE o.isDeleted = false " +
           "AND (:customerId IS NULL OR o.customer.id = :customerId) " +
           "AND (:status IS NULL OR o.status = :status) " +
           "AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus)")
    Page<FabricOrderEntity> searchOrders(
            @Param("customerId") Long customerId,
            @Param("status") FabricOrderStatus status,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            Pageable pageable
    );
}


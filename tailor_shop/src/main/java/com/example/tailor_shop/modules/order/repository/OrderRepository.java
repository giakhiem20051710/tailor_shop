package com.example.tailor_shop.modules.order.repository;

import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.domain.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    @Query("""
            SELECT o FROM OrderEntity o
            WHERE (:status IS NULL OR o.status = :status)
              AND (:customerId IS NULL OR o.customer.id = :customerId)
              AND (:tailorId IS NULL OR o.tailor.id = :tailorId)
              AND (:fromDate IS NULL OR o.updatedAt >= :fromDate)
              AND (:toDate IS NULL OR o.updatedAt <= :toDate)
              AND (:appointmentDate IS NULL OR o.appointmentDate = :appointmentDate)
              AND (:dueDate IS NULL OR o.dueDate = :dueDate)
              AND (
                    :search IS NULL
                 OR LOWER(o.code) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR LOWER(o.customer.name) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR LOWER(o.customer.phone) LIKE LOWER(CONCAT('%', :search, '%'))
                )
            """)
    Page<OrderEntity> search(
            @Param("status") OrderStatus status,
            @Param("customerId") Long customerId,
            @Param("tailorId") Long tailorId,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            @Param("appointmentDate") java.time.LocalDate appointmentDate,
            @Param("dueDate") java.time.LocalDate dueDate,
            @Param("search") String search,
            Pageable pageable
    );

    boolean existsByCode(String code);
}

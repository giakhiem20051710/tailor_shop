package com.myhien.tailor.modules.order.repository;

import com.myhien.tailor.modules.order.domain.OrderEntity;
import com.myhien.tailor.modules.order.domain.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    
    Optional<OrderEntity> findByCode(String code);
    
    boolean existsByCode(String code);
    
    Page<OrderEntity> findByCustomerIdAndIsDeletedFalse(Long customerId, Pageable pageable);
    
    Page<OrderEntity> findByAssignedTailorIdAndIsDeletedFalse(Long tailorId, Pageable pageable);
    
    Page<OrderEntity> findByStatusAndIsDeletedFalse(OrderStatus status, Pageable pageable);
    
    Page<OrderEntity> findByIsDeletedFalse(Pageable pageable);
    
    @Query("SELECT o FROM OrderEntity o WHERE o.isDeleted = false AND o.dueDate BETWEEN :startDate AND :endDate")
    List<OrderEntity> findOrdersByDueDateRange(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}


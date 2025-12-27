package com.example.tailor_shop.modules.billing.repository;

import com.example.tailor_shop.modules.billing.domain.InvoiceEntity;
import com.example.tailor_shop.modules.billing.domain.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<InvoiceEntity, Long> {

    @Query("SELECT i FROM InvoiceEntity i WHERE i.isDeleted = false "
            + "AND (:code IS NULL OR i.code = :code) "
            + "AND (:customerId IS NULL OR i.customer.id = :customerId) "
            + "AND (:status IS NULL OR i.status = :status) "
            + "AND (:dateFrom IS NULL OR i.createdAt >= :dateFrom) "
            + "AND (:dateTo IS NULL OR i.createdAt <= :dateTo)")
    Page<InvoiceEntity> search(@Param("code") String code,
                               @Param("customerId") Long customerId,
                               @Param("status") InvoiceStatus status,
                               @Param("dateFrom") java.time.OffsetDateTime dateFrom,
                               @Param("dateTo") java.time.OffsetDateTime dateTo,
                               Pageable pageable);

    /**
     * Tìm invoice theo order ID
     * @param orderId Order ID
     * @return Invoice entity nếu tìm thấy
     */
    @Query("SELECT i FROM InvoiceEntity i WHERE i.order.id = :orderId AND i.isDeleted = false")
    java.util.Optional<InvoiceEntity> findByOrderIdAndIsDeletedFalse(@Param("orderId") Long orderId);
}



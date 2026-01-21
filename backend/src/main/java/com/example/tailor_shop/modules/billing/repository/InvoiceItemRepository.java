package com.example.tailor_shop.modules.billing.repository;

import com.example.tailor_shop.modules.billing.domain.InvoiceItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItemEntity, Long> {
}



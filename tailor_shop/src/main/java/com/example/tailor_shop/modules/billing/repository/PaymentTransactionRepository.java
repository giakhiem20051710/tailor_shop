package com.example.tailor_shop.modules.billing.repository;

import com.example.tailor_shop.modules.billing.domain.PaymentTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, Long> {

    Optional<PaymentTransactionEntity> findByProviderRef(String providerRef);
}



package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.ProductTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductTemplateRepository extends JpaRepository<ProductTemplateEntity, Long> {

    Optional<ProductTemplateEntity> findByIdAndIsDeletedFalse(Long id);

    List<ProductTemplateEntity> findByIsDeletedFalseAndIsActiveTrueOrderByDisplayOrderAsc();

    Optional<ProductTemplateEntity> findBySlugAndIsDeletedFalse(String slug);
}


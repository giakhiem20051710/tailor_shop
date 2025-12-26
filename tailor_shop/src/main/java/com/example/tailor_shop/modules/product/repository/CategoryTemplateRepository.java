package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.CategoryTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryTemplateRepository extends JpaRepository<CategoryTemplateEntity, Long> {
    Optional<CategoryTemplateEntity> findByCategoryCode(String categoryCode);
}

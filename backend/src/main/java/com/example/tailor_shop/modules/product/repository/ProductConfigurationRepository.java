package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.ProductConfigurationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductConfigurationRepository extends JpaRepository<ProductConfigurationEntity, Long> {

    Optional<ProductConfigurationEntity> findByIdAndIsDeletedFalse(Long id);

    @Query("SELECT pc FROM ProductConfigurationEntity pc " +
           "WHERE pc.isDeleted = false " +
           "AND pc.isAvailable = true " +
           "AND (:templateId IS NULL OR pc.template.id = :templateId) " +
           "AND (:fabricId IS NULL OR pc.fabric.id = :fabricId) " +
           "AND (:styleId IS NULL OR pc.style.id = :styleId)")
    List<ProductConfigurationEntity> findByFilters(
        @Param("templateId") Long templateId,
        @Param("fabricId") Long fabricId,
        @Param("styleId") Long styleId
    );

    @Query("SELECT pc FROM ProductConfigurationEntity pc " +
           "WHERE pc.template.id = :templateId " +
           "AND pc.fabric.id = :fabricId " +
           "AND pc.isDeleted = false")
    Optional<ProductConfigurationEntity> findByTemplateAndFabric(
        @Param("templateId") Long templateId,
        @Param("fabricId") Long fabricId
    );
}


package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.ProductEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

    Optional<ProductEntity> findByKeyAndIsDeletedFalse(String key);

    Optional<ProductEntity> findBySlugAndIsDeletedFalse(String slug);

    @Query("SELECT p FROM ProductEntity p WHERE p.isDeleted = false " +
            "AND (:category IS NULL OR p.category = :category) " +
            "AND (:occasion IS NULL OR p.occasion = :occasion) " +
            "AND (:budget IS NULL OR p.budget = :budget) " +
            "AND (:tag IS NULL OR p.tag = :tag) " +
            "AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
            "AND (:minRating IS NULL OR p.rating >= :minRating)")
    Page<ProductEntity> search(
            @Param("category") String category,
            @Param("occasion") String occasion,
            @Param("budget") String budget,
            @Param("tag") String tag,
            @Param("keyword") String keyword,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minRating") BigDecimal minRating,
            Pageable pageable
    );

    @Query("SELECT p FROM ProductEntity p WHERE p.isDeleted = false " +
            "AND p.category = :category " +
            "AND p.id != :excludeId " +
            "ORDER BY RAND()")
    List<ProductEntity> findRelatedProducts(
            @Param("category") String category,
            @Param("excludeId") Long excludeId,
            Pageable pageable
    );

    boolean existsByKeyAndIsDeletedFalse(String key);

    boolean existsBySlugAndIsDeletedFalse(String slug);
}


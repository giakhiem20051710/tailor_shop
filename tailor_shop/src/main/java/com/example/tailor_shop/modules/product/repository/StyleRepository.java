package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.StyleEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StyleRepository extends JpaRepository<StyleEntity, Long> {

    Optional<StyleEntity> findByIdAndIsDeletedFalse(Long id);

    @Query("SELECT s FROM StyleEntity s WHERE s.isDeleted = false " +
            "AND (:category IS NULL OR s.category = :category) " +
            "AND (:keyword IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<StyleEntity> search(
            @Param("category") String category,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}


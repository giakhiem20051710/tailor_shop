package com.example.tailor_shop.modules.fabric.repository;

import com.example.tailor_shop.modules.fabric.domain.FabricCategory;
import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import com.example.tailor_shop.modules.fabric.domain.FabricPattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface FabricRepository extends JpaRepository<FabricEntity, Long> {

        /**
         * Tìm fabric theo code và không bị xóa
         */
        Optional<FabricEntity> findByCodeAndIsDeletedFalse(String code);

        /**
         * Tìm fabric theo code (kể cả đã xóa)
         */
        Optional<FabricEntity> findByCode(String code);

        /**
         * Tìm fabric theo slug và không bị xóa
         */
        Optional<FabricEntity> findBySlugAndIsDeletedFalse(String slug);

        /**
         * Search fabrics với filter
         * Note: Với custom @Query, Spring Data JPA không tự động apply sort từ Pageable
         * Nên cần xử lý sort trong service layer hoặc dùng Specification
         */
        @Query("SELECT f FROM FabricEntity f WHERE f.isDeleted = false " +
                        "AND (:category IS NULL OR f.category = :category) " +
                        "AND (:color IS NULL OR f.color = :color) " +
                        "AND (:pattern IS NULL OR f.pattern = :pattern) " +
                        "AND (:material IS NULL OR f.material = :material) " +
                        "AND (:origin IS NULL OR f.origin = :origin) " +
                        "AND (:isAvailable IS NULL OR f.isAvailable = :isAvailable) " +
                        "AND (:isFeatured IS NULL OR f.isFeatured = :isFeatured) " +
                        "AND (:minPrice IS NULL OR f.pricePerMeter >= :minPrice) " +
                        "AND (:maxPrice IS NULL OR f.pricePerMeter <= :maxPrice) " +
                        "AND (:keyword IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(f.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(f.code) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                        "ORDER BY f.displayOrder ASC, f.id ASC")
        Page<FabricEntity> searchFabrics(
                        @Param("category") FabricCategory category,
                        @Param("color") String color,
                        @Param("pattern") FabricPattern pattern,
                        @Param("material") String material,
                        @Param("origin") String origin,
                        @Param("isAvailable") Boolean isAvailable,
                        @Param("isFeatured") Boolean isFeatured,
                        @Param("minPrice") BigDecimal minPrice,
                        @Param("maxPrice") BigDecimal maxPrice,
                        @Param("keyword") String keyword,
                        Pageable pageable);

        /**
         * Check code exists
         */
        boolean existsByCodeAndIsDeletedFalse(String code);

        /**
         * Check slug exists
         */
        boolean existsBySlugAndIsDeletedFalse(String slug);
}

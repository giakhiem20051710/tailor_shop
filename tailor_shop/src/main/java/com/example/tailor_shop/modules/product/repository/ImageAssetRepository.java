package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.ImageAssetEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageAssetRepository extends JpaRepository<ImageAssetEntity, Long> {

    Optional<ImageAssetEntity> findByS3Key(String s3Key);

    Page<ImageAssetEntity> findByCategory(String category, Pageable pageable);

    Page<ImageAssetEntity> findByCategoryAndType(String category, String type, Pageable pageable);

    Page<ImageAssetEntity> findByCategoryAndGender(String category, String gender, Pageable pageable);

    @Query("SELECT i FROM ImageAssetEntity i WHERE i.category = :category AND i.type = :type AND (i.gender = :gender OR i.gender = 'unisex')")
    Page<ImageAssetEntity> findByCategoryTypeAndGender(
            @Param("category") String category,
            @Param("type") String type,
            @Param("gender") String gender,
            Pageable pageable
    );

    List<ImageAssetEntity> findByProductTemplateId(Long templateId);

    List<ImageAssetEntity> findByFabricId(Long fabricId);

    List<ImageAssetEntity> findByStyleId(Long styleId);
}


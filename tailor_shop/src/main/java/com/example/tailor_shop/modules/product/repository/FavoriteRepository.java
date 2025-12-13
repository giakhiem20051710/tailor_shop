package com.example.tailor_shop.modules.product.repository;

import com.example.tailor_shop.modules.product.domain.FavoriteEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<FavoriteEntity, Long> {

    Optional<FavoriteEntity> findByCustomerIdAndProductKey(Long customerId, String productKey);

    @Query("SELECT f FROM FavoriteEntity f " +
            "JOIN FETCH f.customer " +
            "WHERE f.customer.id = :customerId " +
            "ORDER BY f.createdAt DESC")
    Page<FavoriteEntity> findByCustomerId(@Param("customerId") Long customerId, Pageable pageable);

    @Query("SELECT f.productKey FROM FavoriteEntity f WHERE f.customer.id = :customerId")
    List<String> findProductKeysByCustomerId(@Param("customerId") Long customerId);

    boolean existsByCustomerIdAndProductKey(Long customerId, String productKey);

    void deleteByCustomerIdAndProductKey(Long customerId, String productKey);
}


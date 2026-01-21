package com.example.tailor_shop.modules.cart.repository;

import com.example.tailor_shop.modules.cart.domain.CartItemEntity;
import com.example.tailor_shop.modules.cart.domain.CartItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {

    List<CartItemEntity> findByUserId(Long userId);

    Optional<CartItemEntity> findByUserIdAndItemTypeAndItemId(Long userId, CartItemType itemType, Long itemId);

    List<CartItemEntity> findByUserIdAndItemType(Long userId, CartItemType itemType);

    @Modifying
    @Query("DELETE FROM CartItemEntity c WHERE c.user.id = :userId AND c.id IN :itemIds")
    void deleteByUserIdAndIds(@Param("userId") Long userId, @Param("itemIds") List<Long> itemIds);

    @Modifying
    @Query("DELETE FROM CartItemEntity c WHERE c.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM CartItemEntity c WHERE c.user.id = :userId AND c.itemType = :itemType")
    void deleteByUserIdAndItemType(@Param("userId") Long userId, @Param("itemType") CartItemType itemType);
}


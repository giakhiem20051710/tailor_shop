package com.example.tailor_shop.modules.favorite.repository;

import com.example.tailor_shop.modules.favorite.domain.FavoriteEntity;
import com.example.tailor_shop.modules.favorite.domain.FavoriteItemType;
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

    Page<FavoriteEntity> findByUserId(Long userId, Pageable pageable);

    Page<FavoriteEntity> findByUserIdAndItemType(Long userId, FavoriteItemType itemType, Pageable pageable);

    Optional<FavoriteEntity> findByUserIdAndItemTypeAndItemId(Long userId, FavoriteItemType itemType, Long itemId);

    Optional<FavoriteEntity> findByUserIdAndItemKey(Long userId, String itemKey); // Backward compatibility

    boolean existsByUserIdAndItemTypeAndItemId(Long userId, FavoriteItemType itemType, Long itemId);

    boolean existsByUserIdAndItemKey(Long userId, String itemKey); // Backward compatibility

    void deleteByUserIdAndItemTypeAndItemId(Long userId, FavoriteItemType itemType, Long itemId);

    void deleteByUserIdAndItemKey(Long userId, String itemKey); // Backward compatibility

    @Query("SELECT f.itemId FROM FavoriteEntity f WHERE f.user.id = :userId AND f.itemType = :itemType")
    List<Long> findItemIdsByUserIdAndItemType(@Param("userId") Long userId, @Param("itemType") FavoriteItemType itemType);

    @Query("SELECT f.itemKey FROM FavoriteEntity f WHERE f.user.id = :userId AND f.itemType = :itemType")
    List<String> findItemKeysByUserIdAndItemType(@Param("userId") Long userId, @Param("itemType") FavoriteItemType itemType);
}


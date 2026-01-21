package com.example.tailor_shop.modules.fabric.repository;

import com.example.tailor_shop.modules.fabric.domain.FabricInventoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface FabricInventoryRepository extends JpaRepository<FabricInventoryEntity, Long> {

    /**
     * Tìm inventory theo fabric ID
     */
    List<FabricInventoryEntity> findByFabricIdAndIsDeletedFalse(Long fabricId);

    /**
     * Tìm inventory theo fabric ID và location
     */
    Optional<FabricInventoryEntity> findByFabricIdAndLocationAndIsDeletedFalse(
            Long fabricId, String location
    );

    /**
     * Tính tổng quantity theo fabric ID
     */
    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM FabricInventoryEntity i " +
            "WHERE i.fabric.id = :fabricId AND i.isDeleted = false")
    BigDecimal calculateTotalQuantityByFabricId(@Param("fabricId") Long fabricId);

    /**
     * Tính tổng reserved quantity theo fabric ID
     */
    @Query("SELECT COALESCE(SUM(i.reservedQuantity), 0) FROM FabricInventoryEntity i " +
            "WHERE i.fabric.id = :fabricId AND i.isDeleted = false")
    BigDecimal calculateTotalReservedQuantityByFabricId(@Param("fabricId") Long fabricId);

    /**
     * Tính tổng available quantity (quantity - reservedQuantity) theo fabric ID
     */
    @Query("SELECT COALESCE(SUM(i.quantity - i.reservedQuantity), 0) FROM FabricInventoryEntity i " +
            "WHERE i.fabric.id = :fabricId AND i.isDeleted = false")
    BigDecimal sumAvailableQuantityByFabricId(@Param("fabricId") Long fabricId);

    /**
     * Tìm các inventory có low stock
     */
    @Query("SELECT i FROM FabricInventoryEntity i " +
            "WHERE i.fabric.id = :fabricId AND i.isDeleted = false " +
            "AND i.minStockLevel IS NOT NULL " +
            "AND (i.quantity - i.reservedQuantity) <= i.minStockLevel")
    List<FabricInventoryEntity> findLowStockInventories(@Param("fabricId") Long fabricId);
}


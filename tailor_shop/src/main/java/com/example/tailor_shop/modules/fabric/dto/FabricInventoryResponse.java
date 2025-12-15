package com.example.tailor_shop.modules.fabric.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * DTO cho fabric inventory response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricInventoryResponse {

    private Long id;
    private Long fabricId;
    private String fabricName;
    private String location;
    private BigDecimal quantity;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private BigDecimal minStockLevel;
    private BigDecimal maxStockLevel;
    private Boolean isLowStock;
    private String unit;
    private OffsetDateTime lastRestockedAt;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


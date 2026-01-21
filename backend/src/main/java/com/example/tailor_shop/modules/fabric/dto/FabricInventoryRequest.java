package com.example.tailor_shop.modules.fabric.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho cập nhật inventory
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricInventoryRequest {

    @Size(max = 100, message = "Location must not exceed 100 characters")
    private String location;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;

    @Positive(message = "Reserved quantity must be positive")
    private BigDecimal reservedQuantity;

    @Positive(message = "Min stock level must be positive")
    private BigDecimal minStockLevel;

    @Positive(message = "Max stock level must be positive")
    private BigDecimal maxStockLevel;

    @Size(max = 20, message = "Unit must not exceed 20 characters")
    private String unit; // METER, YARD, etc.

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;
}


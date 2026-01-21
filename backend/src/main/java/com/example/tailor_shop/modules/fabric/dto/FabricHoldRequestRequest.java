package com.example.tailor_shop.modules.fabric.dto;

import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO cho tạo hold/visit request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricHoldRequestRequest {

    @NotNull(message = "Fabric ID is required")
    private Long fabricId;

    @NotNull(message = "Request type is required")
    private FabricHoldRequestType type;

    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity; // For HOLD type

    private LocalDate requestedDate; // For VISIT type

    private LocalTime requestedTime; // For VISIT type

    private LocalDate expiryDate; // For HOLD type (optional, default 7 days)

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;
}


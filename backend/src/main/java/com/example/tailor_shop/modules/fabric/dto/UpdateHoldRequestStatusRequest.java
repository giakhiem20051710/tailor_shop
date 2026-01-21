package com.example.tailor_shop.modules.fabric.dto;

import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho cập nhật status của hold request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHoldRequestStatusRequest {

    @NotNull(message = "Status is required")
    private FabricHoldRequestStatus status;

    @Size(max = 2000, message = "Staff notes must not exceed 2000 characters")
    private String staffNotes;
}


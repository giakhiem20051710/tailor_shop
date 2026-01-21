package com.example.tailor_shop.modules.fabric.dto;

import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestStatus;
import com.example.tailor_shop.modules.fabric.domain.FabricHoldRequestType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

/**
 * DTO cho fabric hold request response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricHoldRequestResponse {

    private Long id;
    private Long fabricId;
    private String fabricName;
    private String fabricImage;
    private Long userId;
    private String userName;
    private FabricHoldRequestType type;
    private BigDecimal quantity;
    private LocalDate requestedDate;
    private LocalTime requestedTime;
    private FabricHoldRequestStatus status;
    private LocalDate expiryDate;
    private String notes;
    private String staffNotes;
    private Long handledById;
    private String handledByName;
    private OffsetDateTime handledAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


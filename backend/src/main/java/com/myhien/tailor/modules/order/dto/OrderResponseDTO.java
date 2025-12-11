package com.myhien.tailor.modules.order.dto;

import com.myhien.tailor.modules.order.domain.OrderEntity;
import com.myhien.tailor.modules.order.domain.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public record OrderResponseDTO(
    Long id,
    String code,
    Long customerId,
    String customerName,
    Long assignedTailorId,
    String assignedTailorName,
    String name,
    String phone,
    String email,
    String address,
    String productName,
    String productType,
    String description,
    BigDecimal budget,
    BigDecimal total,
    BigDecimal deposit,
    OrderStatus status,
    LocalDate receiveDate,
    LocalDate dueDate,
    String appointmentType,
    LocalDate appointmentDate,
    LocalTime appointmentTime,
    String promoCode,
    String notes,
    String correctionNotes,
    String sampleImages,
    OffsetDateTime createdAt,
    OffsetDateTime completedAt,
    OffsetDateTime updatedAt
) {}


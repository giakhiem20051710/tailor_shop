package com.myhien.tailor.modules.order.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record OrderRequestDTO(
    @NotNull(message = "Customer ID is required")
    Long customerId,
    
    Long assignedTailorId,
    
    @Size(max = 150)
    String name,
    
    @Size(max = 30)
    String phone,
    
    @Email
    @Size(max = 180)
    String email,
    
    @Size(max = 255)
    String address,
    
    @Size(max = 200)
    String productName,
    
    @Size(max = 100)
    String productType,
    
    String description,
    
    @Positive
    BigDecimal budget,
    
    @NotNull(message = "Total is required")
    @Positive
    BigDecimal total,
    
    @Positive
    BigDecimal deposit,
    
    LocalDate receiveDate,
    
    @NotNull(message = "Due date is required")
    @FutureOrPresent
    LocalDate dueDate,
    
    String appointmentType, // pickup, delivery, fitting
    
    LocalDate appointmentDate,
    
    LocalTime appointmentTime,
    
    @Size(max = 50)
    String promoCode,
    
    String notes,
    
    String correctionNotes
) {}


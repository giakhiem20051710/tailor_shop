package com.example.tailor_shop.modules.billing.dto;

import com.example.tailor_shop.modules.billing.domain.InvoiceStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceFilterRequest {

    @Size(max = 50, message = "Code must be at most 50 characters")
    private String code;

    private Long customerId;

    private InvoiceStatus status;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateTo;
}



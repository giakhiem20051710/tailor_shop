package com.example.tailor_shop.modules.fabric.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho fabric order item response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricOrderItemResponse {

    private Long id;
    private Long fabricId;
    private String fabricName;
    private String fabricCode;
    private BigDecimal quantity;
    private BigDecimal pricePerMeter;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal total;
}


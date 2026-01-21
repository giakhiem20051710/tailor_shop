package com.example.tailor_shop.modules.order.dto;

import com.example.tailor_shop.modules.order.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class UpdateOrderStatusRequest {

    @NotNull
    private OrderStatus status;

    private String note;

    private BigDecimal total;

    private BigDecimal depositAmount;

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }
}


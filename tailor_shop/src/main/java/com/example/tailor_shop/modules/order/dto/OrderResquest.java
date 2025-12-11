package com.example.tailor_shop.modules.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class OrderResquest { // legacy typo kept to avoid breaking imports; delegates to CreateOrderRequest fields

    @NotNull
    private Long customerId;

    private Long tailorId;

    @NotEmpty
    private List<Item> items;

    private BigDecimal depositAmount;

    private String note;

    private LocalDate appointmentDate;

    private LocalDate dueDate;

    private Measurement measurement;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getTailorId() {
        return tailorId;
    }

    public void setTailorId(Long tailorId) {
        this.tailorId = tailorId;
    }

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public Measurement getMeasurement() {
        return measurement;
    }

    public void setMeasurement(Measurement measurement) {
        this.measurement = measurement;
    }

    public static class Item {
        @NotNull
        private Long productId;

        private Long fabricId;

        @NotNull
        @Min(1)
        private Integer quantity;

        @NotNull
        private BigDecimal unitPrice;

        private String productName;

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public Long getFabricId() {
            return fabricId;
        }

        public void setFabricId(Long fabricId) {
            this.fabricId = fabricId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public void setUnitPrice(BigDecimal unitPrice) {
            this.unitPrice = unitPrice;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }
    }

    public static class Measurement {
        private Double chest;
        private Double waist;
        private Double hip;
        private Double shoulder;
        private Double sleeve;
        private Double inseam;
        private Double outseam;
        private Double neck;
        private Double height;
        private Double weight;
        private String fitPreference;
        private String note;

        public Double getChest() {
            return chest;
        }

        public void setChest(Double chest) {
            this.chest = chest;
        }

        public Double getWaist() {
            return waist;
        }

        public void setWaist(Double waist) {
            this.waist = waist;
        }

        public Double getHip() {
            return hip;
        }

        public void setHip(Double hip) {
            this.hip = hip;
        }

        public Double getShoulder() {
            return shoulder;
        }

        public void setShoulder(Double shoulder) {
            this.shoulder = shoulder;
        }

        public Double getSleeve() {
            return sleeve;
        }

        public void setSleeve(Double sleeve) {
            this.sleeve = sleeve;
        }

        public Double getInseam() {
            return inseam;
        }

        public void setInseam(Double inseam) {
            this.inseam = inseam;
        }

        public Double getOutseam() {
            return outseam;
        }

        public void setOutseam(Double outseam) {
            this.outseam = outseam;
        }

        public Double getNeck() {
            return neck;
        }

        public void setNeck(Double neck) {
            this.neck = neck;
        }

        public Double getHeight() {
            return height;
        }

        public void setHeight(Double height) {
            this.height = height;
        }

        public Double getWeight() {
            return weight;
        }

        public void setWeight(Double weight) {
            this.weight = weight;
        }

        public String getFitPreference() {
            return fitPreference;
        }

        public void setFitPreference(String fitPreference) {
            this.fitPreference = fitPreference;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }
    }
}

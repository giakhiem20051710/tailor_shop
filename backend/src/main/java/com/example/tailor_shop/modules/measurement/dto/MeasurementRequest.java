package com.example.tailor_shop.modules.measurement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class MeasurementRequest {

    @NotNull
    private Long customerId;

    private Long orderId;

    @DecimalMin(value = "0.1", message = "chest must be > 0", inclusive = false)
    private Double chest;

    @DecimalMin(value = "0.1", message = "waist must be > 0", inclusive = false)
    private Double waist;

    @DecimalMin(value = "0.1", message = "hip must be > 0", inclusive = false)
    private Double hip;

    @DecimalMin(value = "0.1", message = "shoulder must be > 0", inclusive = false)
    private Double shoulder;

    @DecimalMin(value = "0.1", message = "sleeve must be > 0", inclusive = false)
    private Double sleeve;

    @DecimalMin(value = "0.1", message = "inseam must be > 0", inclusive = false)
    private Double inseam;

    @DecimalMin(value = "0.1", message = "outseam must be > 0", inclusive = false)
    private Double outseam;

    @DecimalMin(value = "0.1", message = "neck must be > 0", inclusive = false)
    private Double neck;

    @DecimalMin(value = "0.1", message = "height must be > 0", inclusive = false)
    private Double height;

    @DecimalMin(value = "0.1", message = "weight must be > 0", inclusive = false)
    private Double weight;

    private String fitPreference;

    private String note;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

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


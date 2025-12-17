package com.example.tailor_shop.modules.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderWizardRequest {

    @NotNull
    private Long customerId;

    private Long tailorId;

    @Valid
    private Contact contact;

    @Valid
    private Product product;

    @Valid
    private Measurement measurement;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Contact {
        @NotBlank
        private String name;

        @NotBlank
        private String phone;

        @Email
        private String email;

        private String address;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Product {
        @NotBlank
        private String productName;

        private String productType;

        private String description;

        private BigDecimal budget;

        private LocalDate dueDate;

        private String notes;

        private String appointmentType;

        private String appointmentTime;

        private String promoCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Measurement {
        private Double height;
        private Double weight;
        private Double neck;
        private Double chest;
        private Double waist;
        private Double hip;
        private Double shoulder;
        private Double sleeve;
        private Double bicep;
        private Double thigh;
        private Double crotch;
        private Double ankle;
        private Double shirtLength;
        private Double pantsLength;
        private String note;
    }
}


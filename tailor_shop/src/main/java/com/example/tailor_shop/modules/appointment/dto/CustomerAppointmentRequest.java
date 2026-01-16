package com.example.tailor_shop.modules.appointment.dto;

import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * DTO for customer to create appointment (orderId is optional)
 */
public class CustomerAppointmentRequest {

    private Long orderId; // Optional - for fabric visit, may not have order

    @NotNull(message = "Working slot ID is required")
    private Long workingSlotId;

    @NotNull(message = "Type is required")
    private AppointmentType type;

    private String notes;

    private Integer durationMinutes;

    private List<AppointmentType> secondaryTypes;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getWorkingSlotId() {
        return workingSlotId;
    }

    public void setWorkingSlotId(Long workingSlotId) {
        this.workingSlotId = workingSlotId;
    }

    public AppointmentType getType() {
        return type;
    }

    public void setType(AppointmentType type) {
        this.type = type;
    }

    public List<AppointmentType> getSecondaryTypes() {
        return secondaryTypes;
    }

    public void setSecondaryTypes(List<AppointmentType> secondaryTypes) {
        this.secondaryTypes = secondaryTypes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
}

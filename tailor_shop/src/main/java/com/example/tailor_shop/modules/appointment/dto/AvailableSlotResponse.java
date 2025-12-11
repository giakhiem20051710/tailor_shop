package com.example.tailor_shop.modules.appointment.dto;

import java.time.LocalTime;

public class AvailableSlotResponse {

    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean available;

    public AvailableSlotResponse() {
    }

    public AvailableSlotResponse(LocalTime startTime, LocalTime endTime, Boolean available) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.available = available;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }
}


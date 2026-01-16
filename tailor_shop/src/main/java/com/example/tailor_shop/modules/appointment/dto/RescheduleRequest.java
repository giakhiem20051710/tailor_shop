package com.example.tailor_shop.modules.appointment.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class RescheduleRequest {
    private LocalDate newDate;
    private LocalTime newTime;
    private Long staffId;
    private String reason;

    public LocalDate getNewDate() {
        return newDate;
    }

    public void setNewDate(LocalDate newDate) {
        this.newDate = newDate;
    }

    public LocalTime getNewTime() {
        return newTime;
    }

    public void setNewTime(LocalTime newTime) {
        this.newTime = newTime;
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

package com.example.tailor_shop.modules.appointment.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public class WorkingHoursResponse {

    private Long staffId;
    private String staffName;
    private String staffRole;
    private List<DayWorkingHours> workingHours;

    public static class DayWorkingHours {
        private DayOfWeek dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
        private LocalTime breakStartTime;
        private LocalTime breakEndTime;
        private Boolean isCustom; // true if custom slot, false if using default
        private String source; // "custom" or "default"

        public DayOfWeek getDayOfWeek() {
            return dayOfWeek;
        }

        public void setDayOfWeek(DayOfWeek dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
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

        public LocalTime getBreakStartTime() {
            return breakStartTime;
        }

        public void setBreakStartTime(LocalTime breakStartTime) {
            this.breakStartTime = breakStartTime;
        }

        public LocalTime getBreakEndTime() {
            return breakEndTime;
        }

        public void setBreakEndTime(LocalTime breakEndTime) {
            this.breakEndTime = breakEndTime;
        }

        public Boolean getIsCustom() {
            return isCustom;
        }

        public void setIsCustom(Boolean isCustom) {
            this.isCustom = isCustom;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public String getStaffRole() {
        return staffRole;
    }

    public void setStaffRole(String staffRole) {
        this.staffRole = staffRole;
    }

    public List<DayWorkingHours> getWorkingHours() {
        return workingHours;
    }

    public void setWorkingHours(List<DayWorkingHours> workingHours) {
        this.workingHours = workingHours;
    }
}


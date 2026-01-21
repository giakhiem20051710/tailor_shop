package com.example.tailor_shop.modules.appointment.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public class CloseDateRequest {

    @NotNull(message = "Staff ID is required")
    private Long staffId; // ID nhân viên (staff) áp dụng đóng cửa

    // Option 1: Đóng cửa một ngày cụ thể
    private LocalDate singleDate;

    // Option 2: Đóng cửa nhiều ngày
    private List<LocalDate> dates;

    // Option 3: Đóng cửa một tuần (từ ngày đến ngày)
    private LocalDate weekStart;
    private LocalDate weekEnd;

    // Option 4: Đóng cửa một tháng (năm + tháng)
    private Integer year;
    private Integer month;

    // Ghi chú lý do đóng cửa
    private String reason;

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public LocalDate getSingleDate() {
        return singleDate;
    }

    public void setSingleDate(LocalDate singleDate) {
        this.singleDate = singleDate;
    }

    public List<LocalDate> getDates() {
        return dates;
    }

    public void setDates(List<LocalDate> dates) {
        this.dates = dates;
    }

    public LocalDate getWeekStart() {
        return weekStart;
    }

    public void setWeekStart(LocalDate weekStart) {
        this.weekStart = weekStart;
    }

    public LocalDate getWeekEnd() {
        return weekEnd;
    }

    public void setWeekEnd(LocalDate weekEnd) {
        this.weekEnd = weekEnd;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}


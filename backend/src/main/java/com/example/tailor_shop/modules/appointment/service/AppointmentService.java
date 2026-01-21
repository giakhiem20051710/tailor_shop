package com.example.tailor_shop.modules.appointment.service;

import com.example.tailor_shop.modules.appointment.domain.AppointmentStatus;
import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import com.example.tailor_shop.modules.appointment.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {

    Page<AppointmentResponse> list(Long staffId, Long customerId, LocalDate date,
            AppointmentStatus status, AppointmentType type,
            Long currentUserId, boolean isCustomer, Pageable pageable);

    AppointmentResponse detail(Long id, Long currentUserId, boolean isCustomer);

    AppointmentResponse create(AppointmentRequest request, Long currentUserId);

    AppointmentResponse createByCustomer(CustomerAppointmentRequest request, Long customerId);

    AppointmentResponse update(Long id, AppointmentRequest request, Long currentUserId);

    AppointmentResponse updateStatus(Long id, UpdateAppointmentStatusRequest request, Long currentUserId);

    void delete(Long id, Long currentUserId);

    List<AppointmentResponse> getSchedule(Long staffId, LocalDate date, AppointmentType type);

    AppointmentResponse reschedule(Long id, RescheduleRequest request, Long currentUserId);

    List<AvailableSlotResponse> getAvailableSlots(Long staffId, LocalDate date, Integer durationMinutes);
}

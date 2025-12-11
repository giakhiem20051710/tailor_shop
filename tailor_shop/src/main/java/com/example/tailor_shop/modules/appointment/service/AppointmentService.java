package com.example.tailor_shop.modules.appointment.service;

import com.example.tailor_shop.modules.appointment.domain.AppointmentStatus;
import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import com.example.tailor_shop.modules.appointment.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {

    Page<AppointmentResponse> list(Long tailorId, Long customerId, LocalDate date,
                                    AppointmentStatus status, AppointmentType type,
                                    Long currentUserId, boolean isCustomer, Pageable pageable);

    AppointmentResponse detail(Long id, Long currentUserId, boolean isCustomer);

    AppointmentResponse create(AppointmentRequest request, Long currentUserId);

    AppointmentResponse update(Long id, AppointmentRequest request, Long currentUserId);

    AppointmentResponse updateStatus(Long id, UpdateAppointmentStatusRequest request, Long currentUserId);

    void delete(Long id, Long currentUserId);

    List<AppointmentResponse> getSchedule(Long tailorId, LocalDate date, AppointmentType type);

    List<AvailableSlotResponse> getAvailableSlots(Long tailorId, LocalDate date, Integer durationMinutes);

    // Working Slots
    Page<WorkingSlotResponse> listWorkingSlots(Long tailorId, LocalDate date, Pageable pageable);

    Page<WorkingSlotResponse> listAllWorkingSlots(LocalDate date, Pageable pageable);

    WorkingSlotResponse getWorkingSlot(Long id);

    WorkingSlotResponse createWorkingSlot(WorkingSlotRequest request, Long currentUserId);

    WorkingSlotResponse updateWorkingSlot(Long id, WorkingSlotRequest request, Long currentUserId);

    void deleteWorkingSlot(Long id, Long currentUserId);
}


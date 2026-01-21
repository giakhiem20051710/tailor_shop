package com.example.tailor_shop.modules.appointment.service;

import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import com.example.tailor_shop.modules.appointment.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface WorkingSlotService {

    Page<WorkingSlotResponse> list(Long staffId, LocalDate date, Pageable pageable);

    Page<WorkingSlotResponse> listAll(LocalDate date, Pageable pageable);

    WorkingSlotResponse detail(Long id);

    WorkingSlotResponse create(WorkingSlotRequest request, Long currentUserId);

    WorkingSlotResponse update(Long id, WorkingSlotRequest request, Long currentUserId);

    WorkingSlotResponse updateBookedCount(Long id, java.util.Map<String, Object> request);

    Page<WorkingSlotResponse> filterByType(Page<WorkingSlotResponse> slots, AppointmentType type);

    void delete(Long id, Long currentUserId);

    // Bulk operations
    List<WorkingSlotResponse> createBulk(BulkWorkingSlotRequest request, Long currentUserId);

    void resetToDefault(Long staffId, Long currentUserId);

    WorkingHoursResponse getHours(Long staffId);

    List<WorkingSlotResponse> closeDates(CloseDateRequest request, Long currentUserId);
}

package com.example.tailor_shop.modules.appointment.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.appointment.domain.*;
import com.example.tailor_shop.modules.appointment.dto.*;
import com.example.tailor_shop.modules.appointment.repository.AppointmentRepository;
import com.example.tailor_shop.modules.appointment.repository.WorkingSlotRepository;
import com.example.tailor_shop.modules.appointment.service.AppointmentService;
import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.repository.OrderRepository;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final WorkingSlotRepository workingSlotRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                                 WorkingSlotRepository workingSlotRepository,
                                 OrderRepository orderRepository,
                                 UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.workingSlotRepository = workingSlotRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> list(Long tailorId, Long customerId, LocalDate date,
                                          AppointmentStatus status, AppointmentType type,
                                          Long currentUserId, boolean isCustomer, Pageable pageable) {
        Long effectiveCustomer = customerId;
        if (isCustomer) {
            effectiveCustomer = currentUserId;
        }
        // For custom @Query, Spring Data JPA cannot auto-sort with multiple fields
        // Use single field sort in query, then sort in memory
        Pageable sortedPageable = pageable;
        if (pageable.getSort().isUnsorted()) {
            // Default: sort by appointmentDate only (to avoid Spring Data JPA error)
            sortedPageable = org.springframework.data.domain.PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    org.springframework.data.domain.Sort.by("appointmentDate").ascending()
            );
        }
        Page<AppointmentEntity> page = appointmentRepository.search(tailorId, effectiveCustomer, date, status, type, sortedPageable);
        // Sort results in memory by appointmentDate then appointmentTime
        List<AppointmentResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .sorted((a1, a2) -> {
                    int dateCompare = a1.getAppointmentDate().compareTo(a2.getAppointmentDate());
                    if (dateCompare != 0) return dateCompare;
                    return a1.getAppointmentTime().compareTo(a2.getAppointmentTime());
                })
                .collect(java.util.stream.Collectors.toList());
        return new org.springframework.data.domain.PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse detail(Long id, Long currentUserId, boolean isCustomer) {
        AppointmentEntity entity = appointmentRepository.findById(id)
                .filter(a -> !a.getIsDeleted())
                .orElseThrow(() -> new NotFoundException("Appointment not found"));
        if (isCustomer && !entity.getCustomer().getId().equals(currentUserId)) {
            throw new BadRequestException("Access denied");
        }
        return toResponse(entity);
    }

    @Override
    public AppointmentResponse create(AppointmentRequest request, Long currentUserId) {
        OrderEntity order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found"));
        UserEntity customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Order does not belong to customer");
        }

        UserEntity tailor = null;
        if (request.getTailorId() != null) {
            tailor = userRepository.findById(request.getTailorId())
                    .orElseThrow(() -> new NotFoundException("User with ID " + request.getTailorId() + " not found. Please check if the user exists and has TAILOR or STAFF role."));
            // Validate role: tailorId có thể là TAILOR hoặc STAFF (vì staff cũng phục vụ khách hàng)
            String roleCode = tailor.getRole() != null ? tailor.getRole().getCode().toLowerCase() : "";
            if (!roleCode.equals("tailor") && !roleCode.equals("staff") && !roleCode.equals("admin")) {
                throw new BadRequestException("User with ID " + request.getTailorId() + " must have TAILOR, STAFF, or ADMIN role. Current role: " + roleCode);
            }
            validateAppointmentTime(tailor.getId(), request.getAppointmentDate(), request.getAppointmentTime(), null);
            checkConflict(tailor.getId(), request.getAppointmentDate(), request.getAppointmentTime(), null);
        }

        AppointmentEntity entity = new AppointmentEntity();
        entity.setOrder(order);
        entity.setCustomer(customer);
        entity.setTailor(tailor);
        entity.setType(request.getType());
        entity.setAppointmentDate(request.getAppointmentDate());
        entity.setAppointmentTime(request.getAppointmentTime());
        entity.setStatus(AppointmentStatus.scheduled);
        entity.setNotes(request.getNotes());
        entity.setIsDeleted(false);

        entity = appointmentRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    public AppointmentResponse update(Long id, AppointmentRequest request, Long currentUserId) {
        AppointmentEntity entity = appointmentRepository.findById(id)
                .filter(a -> !a.getIsDeleted())
                .orElseThrow(() -> new NotFoundException("Appointment not found"));

        OrderEntity order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found"));
        UserEntity customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));

        UserEntity tailor = null;
        if (request.getTailorId() != null) {
            tailor = userRepository.findById(request.getTailorId())
                    .orElseThrow(() -> new NotFoundException("User with ID " + request.getTailorId() + " not found. Please check if the user exists and has TAILOR or STAFF role."));
            // Validate role: tailorId có thể là TAILOR hoặc STAFF (vì staff cũng phục vụ khách hàng)
            String roleCode = tailor.getRole() != null ? tailor.getRole().getCode().toLowerCase() : "";
            if (!roleCode.equals("tailor") && !roleCode.equals("staff") && !roleCode.equals("admin")) {
                throw new BadRequestException("User with ID " + request.getTailorId() + " must have TAILOR, STAFF, or ADMIN role. Current role: " + roleCode);
            }
            validateAppointmentTime(tailor.getId(), request.getAppointmentDate(), request.getAppointmentTime(), id);
            checkConflict(tailor.getId(), request.getAppointmentDate(), request.getAppointmentTime(), id);
        }

        entity.setOrder(order);
        entity.setCustomer(customer);
        entity.setTailor(tailor);
        entity.setType(request.getType());
        entity.setAppointmentDate(request.getAppointmentDate());
        entity.setAppointmentTime(request.getAppointmentTime());
        entity.setNotes(request.getNotes());

        entity = appointmentRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    public AppointmentResponse updateStatus(Long id, UpdateAppointmentStatusRequest request, Long currentUserId) {
        AppointmentEntity entity = appointmentRepository.findById(id)
                .filter(a -> !a.getIsDeleted())
                .orElseThrow(() -> new NotFoundException("Appointment not found"));

        entity.setStatus(request.getStatus());
        if (request.getNotes() != null) {
            entity.setNotes(request.getNotes());
        }

        entity = appointmentRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    public void delete(Long id, Long currentUserId) {
        AppointmentEntity entity = appointmentRepository.findById(id)
                .filter(a -> !a.getIsDeleted())
                .orElseThrow(() -> new NotFoundException("Appointment not found"));
        entity.setIsDeleted(true);
        appointmentRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getSchedule(Long tailorId, LocalDate date, AppointmentType type) {
        List<AppointmentEntity> appointments = appointmentRepository.findByTailorAndDate(tailorId, date);
        return appointments.stream()
                .filter(a -> type == null || a.getType() == type)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlots(Long tailorId, LocalDate date, Integer durationMinutes) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        List<WorkingSlotEntity> slots = workingSlotRepository.findActiveByTailorAndDay(tailorId, dayOfWeek, date);
        if (slots.isEmpty()) {
            return new ArrayList<>();
        }

        List<AppointmentEntity> appointments = appointmentRepository.findByTailorAndDate(tailorId, date);
        List<LocalTime> bookedTimes = appointments.stream()
                .map(AppointmentEntity::getAppointmentTime)
                .collect(Collectors.toList());

        List<AvailableSlotResponse> availableSlots = new ArrayList<>();
        int duration = durationMinutes != null ? durationMinutes : 30; // default 30 minutes

        for (WorkingSlotEntity slot : slots) {
            LocalTime current = slot.getStartTime();
            LocalTime end = slot.getEndTime();

            while (current.plusMinutes(duration).isBefore(end) || current.plusMinutes(duration).equals(end)) {
                boolean isInBreak = slot.getBreakStartTime() != null && slot.getBreakEndTime() != null
                        && !current.isBefore(slot.getBreakStartTime()) && current.isBefore(slot.getBreakEndTime());
                boolean isBooked = bookedTimes.contains(current);

                if (!isInBreak && !isBooked) {
                    availableSlots.add(new AvailableSlotResponse(current, current.plusMinutes(duration), true));
                } else {
                    availableSlots.add(new AvailableSlotResponse(current, current.plusMinutes(duration), false));
                }

                current = current.plusMinutes(duration);
            }
        }

        return availableSlots;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkingSlotResponse> listWorkingSlots(Long tailorId, LocalDate date, Pageable pageable) {
        return workingSlotRepository.findByTailorIdAndIsActiveTrue(tailorId, pageable)
                .map(this::toWorkingSlotResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkingSlotResponse> listAllWorkingSlots(LocalDate date, Pageable pageable) {
        return workingSlotRepository.findByIsActiveTrue(pageable)
                .map(this::toWorkingSlotResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkingSlotResponse getWorkingSlot(Long id) {
        WorkingSlotEntity entity = workingSlotRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Working slot not found"));
        return toWorkingSlotResponse(entity);
    }

    @Override
    public WorkingSlotResponse createWorkingSlot(WorkingSlotRequest request, Long currentUserId) {
        UserEntity tailor = userRepository.findById(request.getTailorId())
                .orElseThrow(() -> new NotFoundException("Tailor not found"));

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        if (request.getBreakStartTime() != null && request.getBreakEndTime() != null) {
            if (request.getBreakStartTime().isAfter(request.getBreakEndTime()) || request.getBreakStartTime().equals(request.getBreakEndTime())) {
                throw new BadRequestException("Break start time must be before break end time");
            }
            if (request.getBreakStartTime().isBefore(request.getStartTime()) || request.getBreakEndTime().isAfter(request.getEndTime())) {
                throw new BadRequestException("Break time must be within working hours");
            }
        }

        WorkingSlotEntity entity = new WorkingSlotEntity();
        entity.setTailor(tailor);
        entity.setDayOfWeek(request.getDayOfWeek());
        entity.setStartTime(request.getStartTime());
        entity.setEndTime(request.getEndTime());
        entity.setBreakStartTime(request.getBreakStartTime());
        entity.setBreakEndTime(request.getBreakEndTime());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        entity.setEffectiveFrom(request.getEffectiveFrom());
        entity.setEffectiveTo(request.getEffectiveTo());

        entity = workingSlotRepository.save(entity);
        return toWorkingSlotResponse(entity);
    }

    @Override
    public WorkingSlotResponse updateWorkingSlot(Long id, WorkingSlotRequest request, Long currentUserId) {
        WorkingSlotEntity entity = workingSlotRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Working slot not found"));

        UserEntity tailor = userRepository.findById(request.getTailorId())
                .orElseThrow(() -> new NotFoundException("Tailor not found"));

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        if (request.getBreakStartTime() != null && request.getBreakEndTime() != null) {
            if (request.getBreakStartTime().isAfter(request.getBreakEndTime()) || request.getBreakStartTime().equals(request.getBreakEndTime())) {
                throw new BadRequestException("Break start time must be before break end time");
            }
            if (request.getBreakStartTime().isBefore(request.getStartTime()) || request.getBreakEndTime().isAfter(request.getEndTime())) {
                throw new BadRequestException("Break time must be within working hours");
            }
        }

        entity.setTailor(tailor);
        entity.setDayOfWeek(request.getDayOfWeek());
        entity.setStartTime(request.getStartTime());
        entity.setEndTime(request.getEndTime());
        entity.setBreakStartTime(request.getBreakStartTime());
        entity.setBreakEndTime(request.getBreakEndTime());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        entity.setEffectiveFrom(request.getEffectiveFrom());
        entity.setEffectiveTo(request.getEffectiveTo());

        entity = workingSlotRepository.save(entity);
        return toWorkingSlotResponse(entity);
    }

    @Override
    public void deleteWorkingSlot(Long id, Long currentUserId) {
        WorkingSlotEntity entity = workingSlotRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Working slot not found"));
        workingSlotRepository.delete(entity);
    }

    private void validateAppointmentTime(Long tailorId, LocalDate date, LocalTime time, Long excludeAppointmentId) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        List<WorkingSlotEntity> slots = workingSlotRepository.findActiveByTailorAndDay(tailorId, dayOfWeek, date);
        if (slots.isEmpty()) {
            throw new BadRequestException("Tailor has no working slot for this day");
        }

        boolean isValid = slots.stream().anyMatch(slot -> {
            boolean inWorkingHours = !time.isBefore(slot.getStartTime()) && time.isBefore(slot.getEndTime());
            boolean notInBreak = slot.getBreakStartTime() == null || slot.getBreakEndTime() == null
                    || time.isBefore(slot.getBreakStartTime()) || !time.isBefore(slot.getBreakEndTime());
            return inWorkingHours && notInBreak;
        });

        if (!isValid) {
            throw new BadRequestException("Appointment time is outside tailor's working hours");
        }
    }

    private void checkConflict(Long tailorId, LocalDate date, LocalTime time, Long excludeAppointmentId) {
        List<AppointmentEntity> conflicts = appointmentRepository.findConflicts(tailorId, date, time, excludeAppointmentId);
        if (!conflicts.isEmpty()) {
            throw new BadRequestException("Appointment time conflicts with existing appointment");
        }
    }

    private AppointmentResponse toResponse(AppointmentEntity entity) {
        AppointmentResponse dto = new AppointmentResponse();
        dto.setId(entity.getId());
        dto.setOrderId(entity.getOrder().getId());
        dto.setOrderCode(entity.getOrder().getCode());
        
        // Customer với role
        String customerRole = entity.getCustomer().getRole() != null 
                ? entity.getCustomer().getRole().getCode() : null;
        AppointmentResponse.Party customer = new AppointmentResponse.Party(
                entity.getCustomer().getId(), 
                entity.getCustomer().getName(),
                customerRole
        );
        customer.setPhone(entity.getCustomer().getPhone());
        dto.setCustomer(customer);
        
        // Tailor/Staff/Admin với role (nếu có)
        if (entity.getTailor() != null) {
            String assignedRole = entity.getTailor().getRole() != null 
                    ? entity.getTailor().getRole().getCode() : null;
            AppointmentResponse.Party tailor = new AppointmentResponse.Party(
                    entity.getTailor().getId(), 
                    entity.getTailor().getName(),
                    assignedRole
            );
            tailor.setPhone(entity.getTailor().getPhone());
            dto.setTailor(tailor);
        }
        
        dto.setType(entity.getType());
        dto.setAppointmentDate(entity.getAppointmentDate());
        dto.setAppointmentTime(entity.getAppointmentTime());
        dto.setStatus(entity.getStatus());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private WorkingSlotResponse toWorkingSlotResponse(WorkingSlotEntity entity) {
        WorkingSlotResponse dto = new WorkingSlotResponse();
        dto.setId(entity.getId());
        dto.setTailor(new WorkingSlotResponse.Party(entity.getTailor().getId(), entity.getTailor().getName()));
        dto.setDayOfWeek(entity.getDayOfWeek());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setBreakStartTime(entity.getBreakStartTime());
        dto.setBreakEndTime(entity.getBreakEndTime());
        dto.setIsActive(entity.getIsActive());
        dto.setEffectiveFrom(entity.getEffectiveFrom());
        dto.setEffectiveTo(entity.getEffectiveTo());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}


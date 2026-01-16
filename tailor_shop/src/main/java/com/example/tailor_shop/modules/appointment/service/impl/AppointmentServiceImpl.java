package com.example.tailor_shop.modules.appointment.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.AppointmentConfig;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.appointment.domain.AppointmentEntity;
import com.example.tailor_shop.modules.appointment.domain.AppointmentStatus;
import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import com.example.tailor_shop.modules.appointment.domain.WorkingSlotEntity;
import com.example.tailor_shop.modules.appointment.dto.*;
import com.example.tailor_shop.modules.appointment.repository.AppointmentRepository;
import com.example.tailor_shop.modules.appointment.repository.WorkingSlotRepository;
import com.example.tailor_shop.modules.appointment.service.AppointmentService;
import com.example.tailor_shop.modules.appointment.service.WorkingSlotService;
import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.domain.OrderStatus;
import com.example.tailor_shop.modules.order.repository.OrderRepository;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.domain.RoleEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    // Default working hours: 7:00 - 23:00, Monday to Saturday
    private static final LocalTime DEFAULT_START_TIME = LocalTime.of(7, 0);
    private static final LocalTime DEFAULT_END_TIME = LocalTime.of(23, 0);

    private final AppointmentRepository appointmentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final WorkingSlotService workingSlotService;
    private final WorkingSlotRepository workingSlotRepository; // Added this as it's used in the original code

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            OrderRepository orderRepository,
            WorkingSlotService workingSlotService,
            WorkingSlotRepository workingSlotRepository) { // Added WorkingSlotRepository to constructor
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository; // Added this as it was missing
        this.workingSlotService = workingSlotService;
        this.workingSlotRepository = workingSlotRepository; // Initialized WorkingSlotRepository
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> list(Long staffId, Long customerId, LocalDate date,
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
                    org.springframework.data.domain.Sort.by("appointmentDate").ascending());
        }
        Page<AppointmentEntity> page = appointmentRepository.search(staffId, effectiveCustomer, date, status, type,
                sortedPageable);
        // Sort results in memory by appointmentDate then appointmentTime
        List<AppointmentResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .sorted((a1, a2) -> {
                    int dateCompare = a1.getAppointmentDate().compareTo(a2.getAppointmentDate());
                    if (dateCompare != 0)
                        return dateCompare;
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
        // Validate IDs
        if (request.getOrderId() == null || request.getOrderId() <= 0) {
            throw new BadRequestException("Order ID is required and must be greater than 0.");
        }
        if (request.getCustomerId() == null || request.getCustomerId() <= 0) {
            throw new BadRequestException("Customer ID is required and must be greater than 0.");
        }
        if (request.getStaffId() != null && request.getStaffId() <= 0) {
            throw new BadRequestException("Staff ID must be greater than 0 if provided.");
        }

        OrderEntity order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found"));
        UserEntity customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Order does not belong to customer");
        }

        UserEntity staff = null;
        if (request.getStaffId() != null) {
            staff = userRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new NotFoundException("User with ID " + request.getStaffId()
                            + " not found. Please check if the user exists and has STAFF role."));
            String roleCode = staff.getRole() != null ? staff.getRole().getCode().toLowerCase() : "";
            if (!roleCode.equals("staff") && !roleCode.equals("admin")) {
                throw new BadRequestException("User with ID " + request.getStaffId()
                        + " must have STAFF or ADMIN role. Current role: " + roleCode);
            }

            // Calculate duration and end time
            int duration = calculateDuration(request.getType(), request.getSecondaryTypes(),
                    request.getDurationMinutes());
            LocalTime startTime = request.getAppointmentTime();
            LocalTime endTime = startTime.plusMinutes(duration);

            // Calculate effective range with buffer
            LocalTime effectiveStart = startTime.minusMinutes(AppointmentConfig.BUFFER_MINUTES);
            LocalTime effectiveEnd = endTime.plusMinutes(AppointmentConfig.BUFFER_MINUTES);

            validateAppointmentTime(staff.getId(), request.getAppointmentDate(), startTime, endTime, null);
            checkConflict(staff.getId(), request.getAppointmentDate(), effectiveStart, effectiveEnd, null);

            request.setDurationMinutes(duration); // Store calculated duration back to request if needed or just use in
                                                  // entity
        }

        int duration = calculateDuration(request.getType(), request.getSecondaryTypes(), request.getDurationMinutes());
        LocalTime startTime = request.getAppointmentTime();
        LocalTime endTime = startTime.plusMinutes(duration);

        AppointmentEntity entity = new AppointmentEntity();
        entity.setOrder(order);
        entity.setCustomer(customer);
        entity.setStaff(staff);
        entity.setType(request.getType());
        if (request.getSecondaryTypes() != null) {
            entity.setSecondaryTypes(new HashSet<>(request.getSecondaryTypes()));
        }
        entity.setAppointmentDate(request.getAppointmentDate());
        entity.setAppointmentTime(startTime);
        entity.setDurationMinutes(duration);
        entity.setEstimatedEndTime(endTime);
        entity.setStatus(AppointmentStatus.scheduled);
        entity.setNotes(request.getNotes());
        entity.setIsDeleted(false);

        entity = appointmentRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    public AppointmentResponse createByCustomer(CustomerAppointmentRequest request, Long customerId) {
        // Validate customerId
        if (customerId == null || customerId <= 0) {
            throw new BadRequestException("Customer ID is required and must be greater than 0. Please login first.");
        }

        UserEntity customer = userRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found"));

        // Get working slot
        WorkingSlotEntity workingSlot = workingSlotRepository.findById(request.getWorkingSlotId())
                .orElseThrow(() -> new NotFoundException("Working slot not found"));

        // Validate working slot is available
        if (!workingSlot.getIsActive()) {
            throw new BadRequestException("Working slot is not active");
        }

        // Get order if provided, otherwise create a dummy order for fabric visit
        OrderEntity order;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order not found"));
            if (!order.getCustomer().getId().equals(customerId)) {
                throw new BadRequestException("Order does not belong to customer");
            }
        } else {
            // Create a dummy order for fabric visit/appointment without order
            order = new OrderEntity();
            order.setCustomer(customer);
            order.setStatus(OrderStatus.DRAFT);
            order.setCode("FABRIC_VISIT_" + System.currentTimeMillis());
            order.setNote(request.getNotes() != null ? request.getNotes() : "Lịch hẹn xem vải");
            order.setTotal(java.math.BigDecimal.ZERO);
            order = orderRepository.save(order);
        }

        // Create appointment
        // Calculate duration (handle null durationMinutes)
        int duration = calculateDuration(request.getType(),
                request.getSecondaryTypes(),
                request.getDurationMinutes());

        LocalTime startTime = workingSlot.getStartTime();
        LocalTime endTime = startTime.plusMinutes(duration);

        AppointmentEntity entity = new AppointmentEntity();
        entity.setOrder(order);
        entity.setCustomer(customer);
        entity.setStaff(workingSlot.getStaff());
        entity.setType(request.getType());
        if (request.getSecondaryTypes() != null) {
            entity.setSecondaryTypes(new HashSet<>(request.getSecondaryTypes()));
        }
        entity.setAppointmentDate(
                workingSlot.getEffectiveFrom() != null ? workingSlot.getEffectiveFrom() : LocalDate.now());
        entity.setAppointmentTime(startTime);
        entity.setDurationMinutes(duration);
        entity.setEstimatedEndTime(endTime);
        entity.setStatus(AppointmentStatus.scheduled);
        entity.setNotes(request.getNotes());
        entity.setIsDeleted(false);

        entity = appointmentRepository.save(entity);

        // Update working slot booked count (if needed)
        // Note: WorkingSlotEntity doesn't have bookedCount field, so we skip this for
        // now
        // In a real implementation, you might want to add this field or track it
        // separately

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

        UserEntity staff = null;
        if (request.getStaffId() != null) {
            staff = userRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new NotFoundException("User with ID " + request.getStaffId()
                            + " not found. Please check if the user exists and has STAFF role."));
            String roleCode = staff.getRole() != null ? staff.getRole().getCode().toLowerCase() : "";
            if (!roleCode.equals("staff") && !roleCode.equals("admin")) {
                throw new BadRequestException("User with ID " + request.getStaffId()
                        + " must have STAFF or ADMIN role. Current role: " + roleCode);
            }

            // Calculate duration and end time
            int duration = calculateDuration(request.getType(), request.getSecondaryTypes(),
                    request.getDurationMinutes());
            LocalTime startTime = request.getAppointmentTime();
            LocalTime endTime = startTime.plusMinutes(duration);

            // Calculate effective range with buffer
            LocalTime effectiveStart = startTime.minusMinutes(AppointmentConfig.BUFFER_MINUTES);
            LocalTime effectiveEnd = endTime.plusMinutes(AppointmentConfig.BUFFER_MINUTES);

            validateAppointmentTime(staff.getId(), request.getAppointmentDate(), startTime, endTime, id);
            checkConflict(staff.getId(), request.getAppointmentDate(), effectiveStart, effectiveEnd, id);

            request.setDurationMinutes(duration);
        }

        int duration = calculateDuration(request.getType(), request.getSecondaryTypes(), request.getDurationMinutes());
        LocalTime startTime = request.getAppointmentTime();
        LocalTime endTime = startTime.plusMinutes(duration);

        entity.setOrder(order);
        entity.setCustomer(customer);
        entity.setStaff(staff);
        entity.setType(request.getType());
        if (request.getSecondaryTypes() != null) {
            entity.setSecondaryTypes(new HashSet<>(request.getSecondaryTypes()));
        } else {
            entity.getSecondaryTypes().clear();
        }
        entity.setAppointmentDate(request.getAppointmentDate());
        entity.setAppointmentTime(startTime);
        entity.setDurationMinutes(duration);
        entity.setEstimatedEndTime(endTime);
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
    public AppointmentResponse reschedule(Long id, RescheduleRequest request, Long currentUserId) {
        AppointmentEntity apt = appointmentRepository.findById(id)
                .filter(a -> !a.getIsDeleted())
                .orElseThrow(() -> new NotFoundException("Appointment not found"));

        if (apt.getRescheduleCount() >= 3) {
            throw new BadRequestException("Đã vượt quá số lần đổi lịch cho phép (3 lần)");
        }

        String oldSchedule = apt.getAppointmentDate() + " " + apt.getAppointmentTime();

        // Calculate duration and end time
        int duration = apt.getDurationMinutes() != null ? apt.getDurationMinutes() : 30;
        LocalTime newStartTime = request.getNewTime();
        LocalTime newEndTime = newStartTime.plusMinutes(duration);

        // Calculate buffer
        LocalTime effectiveStart = newStartTime.minusMinutes(AppointmentConfig.BUFFER_MINUTES);
        LocalTime effectiveEnd = newEndTime.plusMinutes(AppointmentConfig.BUFFER_MINUTES);

        // Validate
        Long staffId = request.getStaffId() != null ? request.getStaffId() : apt.getStaff().getId();
        validateAppointmentTime(staffId, request.getNewDate(), newStartTime, newEndTime, id);
        checkConflict(staffId, request.getNewDate(), effectiveStart, effectiveEnd, id);

        // Update
        if (request.getStaffId() != null) {
            apt.setStaff(userRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new NotFoundException("Staff not found")));
        }
        apt.setAppointmentDate(request.getNewDate());
        apt.setAppointmentTime(request.getNewTime());
        apt.setEstimatedEndTime(newEndTime);
        apt.setRescheduleCount(apt.getRescheduleCount() + 1);
        apt.setLastRescheduledAt(LocalDateTime.now());

        // Log history
        appendRescheduleHistory(apt, oldSchedule, request.getNewDate() + " " + request.getNewTime(),
                request.getReason());

        return toResponse(appointmentRepository.save(apt));
    }

    private void appendRescheduleHistory(AppointmentEntity apt, String from, String to, String reason) {
        String entry = String.format("{\"from\":\"%s\",\"to\":\"%s\",\"reason\":\"%s\",\"at\":\"%s\"}",
                from, to, reason != null ? reason : "", LocalDateTime.now());

        String history = apt.getRescheduleHistory();
        if (history == null || history.isEmpty()) {
            history = "[" + entry + "]";
        } else {
            if (history.endsWith("]")) {
                history = history.substring(0, history.length() - 1) + "," + entry + "]";
            } else {
                history = "[" + entry + "]";
            }
        }
        apt.setRescheduleHistory(history);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getSchedule(Long staffId, LocalDate date, AppointmentType type) {
        List<AppointmentEntity> appointments = appointmentRepository.findByStaffAndDate(staffId, date);
        return appointments.stream()
                .filter(a -> type == null || a.getType() == type)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlots(Long staffId, LocalDate date, Integer durationMinutes) {
        // Simple implementation: List working slots as available blocks
        // In a real implementation, we would subtract existing appointments
        Page<WorkingSlotResponse> workingSlots = workingSlotService.listAll(date, Pageable.unpaged());
        List<AvailableSlotResponse> available = new ArrayList<>();

        for (WorkingSlotResponse ws : workingSlots.getContent()) {
            if (staffId != null && !staffId.equals(ws.getStaffId()))
                continue;
            // Basic mapping
            AvailableSlotResponse slot = new AvailableSlotResponse();
            slot.setStartTime(ws.getStartTime());
            slot.setEndTime(ws.getEndTime());
            slot.setAvailable(true); // Simplified
            available.add(slot);
        }
        return available;
    }

    private void validateAppointmentTime(Long staffId, LocalDate date, LocalTime startTime, LocalTime endTime,
            Long excludeAppointmentId) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();

        // Check if it's Sunday (not allowed)
        if (dayOfWeek == DayOfWeek.SUNDAY) {
            throw new BadRequestException("Appointments cannot be scheduled on Sunday");
        }

        // Check if the date is closed (has working slot with isActive = false)
        List<WorkingSlotEntity> closedSlots = workingSlotRepository.findClosedByStaffAndDay(staffId, dayOfWeek, date);
        if (!closedSlots.isEmpty()) {
            throw new BadRequestException("Cannot schedule appointment on closed date: " + date);
        }

        // Check if time is within default working hours (7:00 - 23:00)
        // Check both start and end time
        if (startTime.isBefore(DEFAULT_START_TIME)
                || !endTime.isBefore(DEFAULT_END_TIME) && !endTime.equals(DEFAULT_END_TIME)) {
            // Allowing endTime to be exactly 23:00
            if (startTime.isBefore(DEFAULT_START_TIME) || endTime.isAfter(DEFAULT_END_TIME)) {
                throw new BadRequestException("Appointment time must be between 07:00 and 23:00");
            }
        }

        // If staff has custom working slots, validate against them
        List<WorkingSlotEntity> slots = workingSlotRepository.findActiveByStaffAndDay(staffId, dayOfWeek, date);
        if (!slots.isEmpty()) {
            boolean isValid = slots.stream().anyMatch(slot -> {
                boolean startsInSlot = !startTime.isBefore(slot.getStartTime())
                        && startTime.isBefore(slot.getEndTime());
                boolean endsInSlot = !endTime.isBefore(slot.getStartTime())
                        && (endTime.isBefore(slot.getEndTime()) || endTime.equals(slot.getEndTime()));

                boolean inWorkingHours = startsInSlot && endsInSlot;

                boolean notInBreak = true;
                if (slot.getBreakStartTime() != null && slot.getBreakEndTime() != null) {
                    // Check if appointment overlaps with break
                    // Conflict if (StartApp < EndBreak) AND (EndApp > StartBreak)
                    if (startTime.isBefore(slot.getBreakEndTime()) && endTime.isAfter(slot.getBreakStartTime())) {
                        notInBreak = false;
                    }
                }
                return inWorkingHours && notInBreak;
            });

            if (!isValid) {
                throw new BadRequestException(
                        "Appointment time is outside staff custom working hours or overlaps with break time");
            }
        }
        // If no custom working slots, use default hours (already validated above)
    }

    private void checkConflict(Long staffId, LocalDate date, LocalTime effectiveStart, LocalTime effectiveEnd,
            Long excludeAppointmentId) {
        List<AppointmentEntity> conflicts = appointmentRepository.findOverlappingAppointments(staffId, date,
                effectiveStart, effectiveEnd,
                excludeAppointmentId);
        if (!conflicts.isEmpty()) {
            // Can add more details about conflicting appointment here
            throw new BadRequestException("Appointment time conflicts with an existing appointment (including "
                    + AppointmentConfig.BUFFER_MINUTES + "m buffer)");
        }
    }

    private int calculateDuration(AppointmentType type, List<AppointmentType> secondaryTypes, Integer requestDuration) {
        if (requestDuration != null && requestDuration > 0) {
            return requestDuration;
        }
        int total = AppointmentConfig.TYPE_DURATIONS.getOrDefault(type, 30);
        if (secondaryTypes != null) {
            for (AppointmentType st : secondaryTypes) {
                total += AppointmentConfig.TYPE_DURATIONS.getOrDefault(st, 0);
            }
        }
        return total;
    }

    private AppointmentResponse toResponse(AppointmentEntity entity) {
        AppointmentResponse dto = new AppointmentResponse();
        dto.setId(entity.getId());
        dto.setOrderId(entity.getOrder().getId());
        dto.setOrderCode(entity.getOrder().getCode());

        // Customer với role
        String customerRole = entity.getCustomer().getRole() != null
                ? entity.getCustomer().getRole().getCode()
                : null;
        AppointmentResponse.Party customer = new AppointmentResponse.Party(
                entity.getCustomer().getId(),
                entity.getCustomer().getName(),
                customerRole);
        customer.setPhone(entity.getCustomer().getPhone());
        dto.setCustomer(customer);

        // Staff/Admin với role (nếu có)
        if (entity.getStaff() != null) {
            String assignedRole = entity.getStaff().getRole() != null
                    ? entity.getStaff().getRole().getCode()
                    : null;
            AppointmentResponse.Party staff = new AppointmentResponse.Party(
                    entity.getStaff().getId(),
                    entity.getStaff().getName(),
                    assignedRole);
            staff.setPhone(entity.getStaff().getPhone());
            dto.setStaff(staff);
        }

        dto.setType(entity.getType());
        dto.setSecondaryTypes(entity.getSecondaryTypes());
        dto.setChecklist(AppointmentConfig.TYPE_CHECKLISTS.getOrDefault(entity.getType(), List.of()));
        dto.setAppointmentDate(entity.getAppointmentDate());
        dto.setAppointmentTime(entity.getAppointmentTime());
        dto.setDurationMinutes(entity.getDurationMinutes());
        dto.setEstimatedEndTime(entity.getEstimatedEndTime());
        dto.setStatus(entity.getStatus());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

}

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

    // Default working hours: 7:00 - 23:00, Monday to Saturday
    private static final LocalTime DEFAULT_START_TIME = LocalTime.of(7, 0);
    private static final LocalTime DEFAULT_END_TIME = LocalTime.of(23, 0);

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
                    org.springframework.data.domain.Sort.by("appointmentDate").ascending()
            );
        }
        Page<AppointmentEntity> page = appointmentRepository.search(staffId, effectiveCustomer, date, status, type, sortedPageable);
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

        UserEntity staff = null;
        if (request.getStaffId() != null) {
            staff = userRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new NotFoundException("User with ID " + request.getStaffId() + " not found. Please check if the user exists and has STAFF role."));
            String roleCode = staff.getRole() != null ? staff.getRole().getCode().toLowerCase() : "";
            if (!roleCode.equals("staff") && !roleCode.equals("admin")) {
                throw new BadRequestException("User with ID " + request.getStaffId() + " must have STAFF or ADMIN role. Current role: " + roleCode);
            }
            validateAppointmentTime(staff.getId(), request.getAppointmentDate(), request.getAppointmentTime(), null);
            checkConflict(staff.getId(), request.getAppointmentDate(), request.getAppointmentTime(), null);
        }

        AppointmentEntity entity = new AppointmentEntity();
        entity.setOrder(order);
        entity.setCustomer(customer);
        entity.setStaff(staff);
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

        UserEntity staff = null;
        if (request.getStaffId() != null) {
            staff = userRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new NotFoundException("User with ID " + request.getStaffId() + " not found. Please check if the user exists and has STAFF role."));
            String roleCode = staff.getRole() != null ? staff.getRole().getCode().toLowerCase() : "";
            if (!roleCode.equals("staff") && !roleCode.equals("admin")) {
                throw new BadRequestException("User with ID " + request.getStaffId() + " must have STAFF or ADMIN role. Current role: " + roleCode);
            }
            validateAppointmentTime(staff.getId(), request.getAppointmentDate(), request.getAppointmentTime(), id);
            checkConflict(staff.getId(), request.getAppointmentDate(), request.getAppointmentTime(), id);
        }

        entity.setOrder(order);
        entity.setCustomer(customer);
        entity.setStaff(staff);
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
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        
        // Check if it's Sunday (not available)
        if (dayOfWeek == DayOfWeek.SUNDAY) {
            return new ArrayList<>();
        }

        // Check if the date is closed
        List<WorkingSlotEntity> closedSlots = workingSlotRepository.findClosedByStaffAndDay(staffId, dayOfWeek, date);
        if (!closedSlots.isEmpty()) {
            // Ngày này đóng cửa, không có slot nào available
            return new ArrayList<>();
        }

        List<AppointmentEntity> appointments = appointmentRepository.findByStaffAndDate(staffId, date);
        List<LocalTime> bookedTimes = appointments.stream()
                .map(AppointmentEntity::getAppointmentTime)
                .collect(Collectors.toList());

        List<AvailableSlotResponse> availableSlots = new ArrayList<>();
        int duration = durationMinutes != null ? durationMinutes : 30; // default 30 minutes

        // Check if tailor has custom working slots
        List<WorkingSlotEntity> customSlots = workingSlotRepository.findActiveByStaffAndDay(staffId, dayOfWeek, date);
        
        if (!customSlots.isEmpty()) {
            // Use custom working slots
            for (WorkingSlotEntity slot : customSlots) {
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
        } else {
            // Use default working hours (7:00 - 23:00)
            LocalTime current = DEFAULT_START_TIME;
            LocalTime end = DEFAULT_END_TIME;

            while (current.plusMinutes(duration).isBefore(end) || current.plusMinutes(duration).equals(end)) {
                boolean isBooked = bookedTimes.contains(current);

                if (!isBooked) {
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
    public Page<WorkingSlotResponse> listWorkingSlots(Long staffId, LocalDate date, Pageable pageable) {
        return workingSlotRepository.findByStaffIdAndIsActiveTrue(staffId, pageable)
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
        UserEntity staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Staff not found"));

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
        entity.setStaff(staff);
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

        UserEntity staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Staff not found"));

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

        entity.setStaff(staff);
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

    @Override
    @Transactional
    public List<WorkingSlotResponse> createBulkWorkingSlots(BulkWorkingSlotRequest request, Long currentUserId) {
        UserEntity staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        if (request.getBreakStartTime() != null && request.getBreakEndTime() != null) {
            if (request.getBreakStartTime().isAfter(request.getBreakEndTime()) || 
                    request.getBreakStartTime().equals(request.getBreakEndTime())) {
                throw new BadRequestException("Break start time must be before break end time");
            }
            if (request.getBreakStartTime().isBefore(request.getStartTime()) || 
                    request.getBreakEndTime().isAfter(request.getEndTime())) {
                throw new BadRequestException("Break time must be within working hours");
            }
        }

        List<WorkingSlotResponse> results = new ArrayList<>();
        for (DayOfWeek dayOfWeek : request.getDaysOfWeek()) {
            WorkingSlotEntity entity = new WorkingSlotEntity();
            entity.setStaff(staff);
            entity.setDayOfWeek(dayOfWeek);
            entity.setStartTime(request.getStartTime());
            entity.setEndTime(request.getEndTime());
            entity.setBreakStartTime(request.getBreakStartTime());
            entity.setBreakEndTime(request.getBreakEndTime());
            entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
            entity.setEffectiveFrom(request.getEffectiveFrom());
            entity.setEffectiveTo(request.getEffectiveTo());

            entity = workingSlotRepository.save(entity);
            results.add(toWorkingSlotResponse(entity));
        }

        return results;
    }

    @Override
    @Transactional
    public void resetToDefaultWorkingHours(Long staffId, Long currentUserId) {
        UserEntity staff = userRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Delete all custom working slots for this staff
        List<WorkingSlotEntity> customSlots = workingSlotRepository
                .findByStaffIdAndIsActiveTrue(staffId, org.springframework.data.domain.Pageable.unpaged())
                .getContent();
        workingSlotRepository.deleteAll(customSlots);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkingHoursResponse getWorkingHours(Long staffId) {
        UserEntity staff = userRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        WorkingHoursResponse response = new WorkingHoursResponse();
        response.setStaffId(staff.getId());
        response.setStaffName(staff.getName());
        response.setStaffRole(staff.getRole() != null ? staff.getRole().getCode() : null);

        List<WorkingHoursResponse.DayWorkingHours> workingHours = new ArrayList<>();
        
        // Days Monday to Saturday
        DayOfWeek[] workDays = {DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY};

        for (DayOfWeek day : workDays) {
            WorkingHoursResponse.DayWorkingHours dayHours = new WorkingHoursResponse.DayWorkingHours();
            dayHours.setDayOfWeek(day);

            // Check if there are custom working slots for this day
            List<WorkingSlotEntity> customSlots = workingSlotRepository.findActiveByStaffAndDay(
                    staffId, day, LocalDate.now());

            if (!customSlots.isEmpty()) {
                // Use first custom slot (assuming one slot per day)
                WorkingSlotEntity slot = customSlots.get(0);
                dayHours.setStartTime(slot.getStartTime());
                dayHours.setEndTime(slot.getEndTime());
                dayHours.setBreakStartTime(slot.getBreakStartTime());
                dayHours.setBreakEndTime(slot.getBreakEndTime());
                dayHours.setIsCustom(true);
                dayHours.setSource("custom");
            } else {
                // Use default hours
                dayHours.setStartTime(DEFAULT_START_TIME);
                dayHours.setEndTime(DEFAULT_END_TIME);
                dayHours.setBreakStartTime(null);
                dayHours.setBreakEndTime(null);
                dayHours.setIsCustom(false);
                dayHours.setSource("default");
            }

            workingHours.add(dayHours);
        }

        response.setWorkingHours(workingHours);
        return response;
    }

    private void validateAppointmentTime(Long staffId, LocalDate date, LocalTime time, Long excludeAppointmentId) {
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
        if (time.isBefore(DEFAULT_START_TIME) || !time.isBefore(DEFAULT_END_TIME)) {
            throw new BadRequestException("Appointment time must be between 07:00 and 23:00");
        }

        // If staff has custom working slots, validate against them
        List<WorkingSlotEntity> slots = workingSlotRepository.findActiveByStaffAndDay(staffId, dayOfWeek, date);
        if (!slots.isEmpty()) {
            boolean isValid = slots.stream().anyMatch(slot -> {
                boolean inWorkingHours = !time.isBefore(slot.getStartTime()) && time.isBefore(slot.getEndTime());
                boolean notInBreak = slot.getBreakStartTime() == null || slot.getBreakEndTime() == null
                        || time.isBefore(slot.getBreakStartTime()) || !time.isBefore(slot.getBreakEndTime());
                return inWorkingHours && notInBreak;
            });

            if (!isValid) {
                throw new BadRequestException("Appointment time is outside staff custom working hours");
            }
        }
        // If no custom working slots, use default hours (already validated above)
    }

    private void checkConflict(Long staffId, LocalDate date, LocalTime time, Long excludeAppointmentId) {
        List<AppointmentEntity> conflicts = appointmentRepository.findConflicts(staffId, date, time, excludeAppointmentId);
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
        
        // Staff/Admin với role (nếu có)
        if (entity.getStaff() != null) {
            String assignedRole = entity.getStaff().getRole() != null 
                    ? entity.getStaff().getRole().getCode() : null;
            AppointmentResponse.Party staff = new AppointmentResponse.Party(
                    entity.getStaff().getId(), 
                    entity.getStaff().getName(),
                    assignedRole
            );
            staff.setPhone(entity.getStaff().getPhone());
            dto.setStaff(staff);
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
        dto.setStaff(new WorkingSlotResponse.Party(entity.getStaff().getId(), entity.getStaff().getName()));
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

    @Override
    @Transactional
    public List<WorkingSlotResponse> closeDates(CloseDateRequest request, Long currentUserId) {
        UserEntity staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        List<WorkingSlotResponse> results = new ArrayList<>();
        List<LocalDate> datesToClose = new ArrayList<>();

        // Xác định các ngày cần đóng cửa
        if (request.getSingleDate() != null) {
            // Đóng cửa một ngày
            datesToClose.add(request.getSingleDate());
        } else if (request.getDates() != null && !request.getDates().isEmpty()) {
            // Đóng cửa nhiều ngày
            datesToClose.addAll(request.getDates());
        } else if (request.getWeekStart() != null && request.getWeekEnd() != null) {
            // Đóng cửa một tuần
            LocalDate current = request.getWeekStart();
            while (!current.isAfter(request.getWeekEnd())) {
                datesToClose.add(current);
                current = current.plusDays(1);
            }
        } else if (request.getYear() != null && request.getMonth() != null) {
            // Đóng cửa một tháng
            LocalDate startOfMonth = LocalDate.of(request.getYear(), request.getMonth(), 1);
            LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());
            LocalDate current = startOfMonth;
            while (!current.isAfter(endOfMonth)) {
                datesToClose.add(current);
                current = current.plusDays(1);
            }
        } else {
            throw new BadRequestException("Must specify singleDate, dates, weekStart/weekEnd, or year/month");
        }

        // Tạo working slot đóng cửa cho từng ngày
        for (LocalDate date : datesToClose) {
            DayOfWeek dayOfWeek = date.getDayOfWeek();
            
            // Bỏ qua Chủ nhật (đã không làm việc)
            if (dayOfWeek == DayOfWeek.SUNDAY) {
                continue;
            }

            // Kiểm tra xem đã có working slot đóng cửa cho ngày này chưa
            List<WorkingSlotEntity> existingClosed = workingSlotRepository.findClosedByStaffAndDay(
                    request.getStaffId(), dayOfWeek, date);
            
            if (!existingClosed.isEmpty()) {
                // Đã có, bỏ qua hoặc có thể update
                continue;
            }

            // Tạo working slot đóng cửa (isActive = false)
            WorkingSlotEntity closedSlot = new WorkingSlotEntity();
            closedSlot.setStaff(staff);
            closedSlot.setDayOfWeek(dayOfWeek);
            closedSlot.setStartTime(DEFAULT_START_TIME);
            closedSlot.setEndTime(DEFAULT_END_TIME);
            closedSlot.setBreakStartTime(null);
            closedSlot.setBreakEndTime(null);
            closedSlot.setIsActive(false); // Đóng cửa
            closedSlot.setEffectiveFrom(date);
            closedSlot.setEffectiveTo(date);

            closedSlot = workingSlotRepository.save(closedSlot);
            results.add(toWorkingSlotResponse(closedSlot));
        }

        return results;
    }
}


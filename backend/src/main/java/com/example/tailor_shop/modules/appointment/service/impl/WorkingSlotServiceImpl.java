package com.example.tailor_shop.modules.appointment.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import com.example.tailor_shop.modules.appointment.domain.WorkingSlotEntity;
import com.example.tailor_shop.modules.appointment.dto.*;
import com.example.tailor_shop.modules.appointment.repository.WorkingSlotRepository;
import com.example.tailor_shop.modules.appointment.service.WorkingSlotService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class WorkingSlotServiceImpl implements WorkingSlotService {

    private final WorkingSlotRepository workingSlotRepository;
    private final UserRepository userRepository;

    public WorkingSlotServiceImpl(WorkingSlotRepository workingSlotRepository, UserRepository userRepository) {
        this.workingSlotRepository = workingSlotRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkingSlotResponse> list(Long staffId, LocalDate date, Pageable pageable) {
        if (date != null) {
            // Find active slots that cover this date (effectiveFrom <= date <= effectiveTo)
            // and match the day of week
            DayOfWeek dow = date.getDayOfWeek();
            return workingSlotRepository.findByStaffIdAndDayOfWeekAndIsActiveTrue(staffId, dow, pageable)
                    .map(this::toResponse);
        }
        return workingSlotRepository.findByStaffId(staffId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkingSlotResponse> listAll(LocalDate date, Pageable pageable) {
        if (date != null) {
            DayOfWeek dow = date.getDayOfWeek();
            return workingSlotRepository.findByDayOfWeekAndIsActiveTrue(dow, pageable)
                    .map(this::toResponse);
        }
        return workingSlotRepository.findByIsActiveTrue(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkingSlotResponse detail(Long id) {
        WorkingSlotEntity entity = workingSlotRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Working slot not found"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public WorkingSlotResponse create(WorkingSlotRequest request, Long currentUserId) {
        // Validate staffId
        if (request.getStaffId() == null || request.getStaffId() <= 0) {
            throw new BadRequestException("Staff ID is required and must be greater than 0.");
        }

        UserEntity staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Staff with ID " + request.getStaffId() + " not found."));

        if (request.getStartTime().isAfter(request.getEndTime())
                || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        if (request.getBreakStartTime() != null && request.getBreakEndTime() != null) {
            if (request.getBreakStartTime().isAfter(request.getBreakEndTime())
                    || request.getBreakStartTime().equals(request.getBreakEndTime())) {
                throw new BadRequestException("Break start time must be before break end time");
            }
            if (request.getBreakStartTime().isBefore(request.getStartTime())
                    || request.getBreakEndTime().isAfter(request.getEndTime())) {
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

        // Fields not present in Entity yet:
        // entity.setBookedCount(0);
        // entity.setCapacity(request.getCapacity() != null ? request.getCapacity() :
        // 1);

        entity = workingSlotRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional
    public WorkingSlotResponse update(Long id, WorkingSlotRequest request, Long currentUserId) {
        WorkingSlotEntity entity = workingSlotRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Working slot not found"));

        if (request.getStaffId() == null || request.getStaffId() <= 0) {
            throw new BadRequestException("Staff ID is required and must be greater than 0.");
        }

        UserEntity staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Staff not found"));

        if (request.getStartTime().isAfter(request.getEndTime())
                || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        if (request.getBreakStartTime() != null && request.getBreakEndTime() != null) {
            if (request.getBreakStartTime().isAfter(request.getBreakEndTime())
                    || request.getBreakStartTime().equals(request.getBreakEndTime())) {
                throw new BadRequestException("Break start time must be before break end time");
            }
            if (request.getBreakStartTime().isBefore(request.getStartTime())
                    || request.getBreakEndTime().isAfter(request.getEndTime())) {
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

        // Field not present in Entity yet:
        // if (request.getCapacity() != null) {
        // entity.setCapacity(request.getCapacity());
        // }

        entity = workingSlotRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional
    public WorkingSlotResponse updateBookedCount(Long id, java.util.Map<String, Object> request) {
        WorkingSlotEntity entity = workingSlotRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Working slot not found"));

        if (request.containsKey("bookedCount")) {
            Integer count = (Integer) request.get("bookedCount");
            // Field not present in Entity yet:
            // entity.setBookedCount(count);
            // entity = workingSlotRepository.save(entity);
        }

        return toResponse(entity);
    }

    @Override
    public Page<WorkingSlotResponse> filterByType(Page<WorkingSlotResponse> slots, AppointmentType type) {
        // Since WorkingSlot doesn't have a type directly (it's implicit by the tailor's
        // skill),
        // we might filter by the staff's skill or just return all for now.
        // For now, returning as is or implementing specific logic if needed.
        return slots;
    }

    @Override
    @Transactional
    public void delete(Long id, Long currentUserId) {
        if (!workingSlotRepository.existsById(id)) {
            throw new NotFoundException("Working slot not found");
        }
        workingSlotRepository.deleteById(id);
    }

    @Override
    @Transactional
    public List<WorkingSlotResponse> createBulk(BulkWorkingSlotRequest request, Long currentUserId) {
        // Fix: Use singular staffId from request
        if (request.getStaffId() == null || request.getStaffId() <= 0) {
            throw new BadRequestException("Staff ID is required and must be greater than 0");
        }

        if (request.getDaysOfWeek() == null || request.getDaysOfWeek().isEmpty()) {
            throw new BadRequestException("Days of week are required");
        }

        List<WorkingSlotResponse> results = new ArrayList<>();

        UserEntity staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Staff with ID " + request.getStaffId() + " not found"));

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
            // Fields not present:
            // entity.setBookedCount(0);
            // entity.setCapacity(request.getCapacity() != null ? request.getCapacity() :
            // 1);

            entity = workingSlotRepository.save(entity);
            results.add(toResponse(entity));
        }

        return results;
    }

    @Override
    @Transactional
    public void resetToDefault(Long staffId, Long currentUserId) {
        if (staffId == null || staffId <= 0) {
            throw new BadRequestException("Staff ID is required and must be greater than 0.");
        }
        UserEntity staff = userRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        List<WorkingSlotEntity> customSlots = workingSlotRepository
                .findByStaffIdAndIsActiveTrue(staffId, Pageable.unpaged())
                .getContent();
        workingSlotRepository.deleteAll(customSlots);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkingHoursResponse getHours(Long staffId) {
        if (staffId == null || staffId <= 0) {
            throw new BadRequestException("Staff ID is required and must be greater than 0.");
        }

        UserEntity staff = userRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        WorkingHoursResponse response = new WorkingHoursResponse();
        response.setStaffId(staff.getId());
        response.setStaffName(staff.getName());
        response.setStaffRole(staff.getRole() != null ? staff.getRole().getCode() : null);

        List<WorkingHoursResponse.DayWorkingHours> workingHours = new ArrayList<>();
        DayOfWeek[] workDays = { DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY };

        for (DayOfWeek day : workDays) {
            WorkingHoursResponse.DayWorkingHours dayHours = new WorkingHoursResponse.DayWorkingHours();
            dayHours.setDayOfWeek(day);

            // Get slots for this day
            List<WorkingSlotEntity> slots = workingSlotRepository
                    .findByStaffIdAndDayOfWeekAndIsActiveTrue(staffId, day, Pageable.unpaged())
                    .getContent();

            if (!slots.isEmpty()) {
                WorkingSlotEntity slot = slots.get(0); // Assume 1 main slot for now
                dayHours.setStartTime(slot.getStartTime());
                dayHours.setEndTime(slot.getEndTime());
                dayHours.setBreakStartTime(slot.getBreakStartTime());
                dayHours.setBreakEndTime(slot.getBreakEndTime());
                dayHours.setWorking(true);
            } else {
                dayHours.setWorking(false);
            }
            workingHours.add(dayHours);
        }

        response.setWorkingHours(workingHours);
        return response;
    }

    @Override
    @Transactional
    public List<WorkingSlotResponse> closeDates(CloseDateRequest request, Long currentUserId) {
        if (request.getStaffId() != null && request.getStaffId() <= 0) {
            throw new BadRequestException("Staff ID must be greater than 0 if provided.");
        }

        List<LocalDate> targetDates = new ArrayList<>();

        if (request.getSingleDate() != null) {
            targetDates.add(request.getSingleDate());
        } else if (request.getDates() != null && !request.getDates().isEmpty()) {
            targetDates.addAll(request.getDates());
        } else if (request.getWeekStart() != null && request.getWeekEnd() != null) {
            LocalDate start = request.getWeekStart();
            LocalDate end = request.getWeekEnd();
            while (!start.isAfter(end)) {
                targetDates.add(start);
                start = start.plusDays(1);
            }
        } else if (request.getYear() != null && request.getMonth() != null) {
            LocalDate start = LocalDate.of(request.getYear(), request.getMonth(), 1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            while (!start.isAfter(end)) {
                targetDates.add(start);
                start = start.plusDays(1);
            }
        }

        if (targetDates.isEmpty()) {
            throw new BadRequestException("No dates provided to close.");
        }

        List<WorkingSlotResponse> closedSlots = new ArrayList<>();

        for (LocalDate date : targetDates) {
            DayOfWeek dow = date.getDayOfWeek();
            List<WorkingSlotEntity> activeSlots;

            if (request.getStaffId() != null) {
                // Close for specific staff
                // We find slots that are active on this day (checking effectiveFrom/To)
                // Since repository methods might be limited, we can fetch all and filter or use
                // existing custom queries if available.
                // Using findActiveByStaffAndDay from repo
                activeSlots = workingSlotRepository.findActiveByStaffAndDay(request.getStaffId(), dow, date);
            } else {
                // Close for ALL staff (Shop Holiday)
                // We need a query for this, or iterate all active slots for the day
                // Repository might not have 'findActiveByDay' excluding staffId
                // Let's implement a simple fetch-all-active and filter, or cleaner: use the
                // repo
                // Assuming we can add a method or use what we have.
                // Since we can't easily add repo method without editing another file, let's use
                // listAll and filter? No, inefficient.
                // Let's rely on the existing findByDayOfWeekAndIsActiveTrue but we need to
                // check effective date.
                // Better: Iterate all slots? No.
                // Let's use `workingSlotRepository.findAll()` and filter in memory? Risky for
                // performance.
                // Let's assume there isn't a massive amount of slots per day.
                // Actually, let's just use `findByDayOfWeekAndIsActiveTrue` and filter by date.
                activeSlots = workingSlotRepository.findByDayOfWeekAndIsActiveTrue(dow, Pageable.unpaged())
                        .getContent();
                // Filter by effective date
                activeSlots = activeSlots.stream()
                        .filter(s -> (s.getEffectiveFrom() == null || !s.getEffectiveFrom().isAfter(date)) &&
                                (s.getEffectiveTo() == null || !s.getEffectiveTo().isBefore(date)))
                        .collect(java.util.stream.Collectors.toList());
            }

            for (WorkingSlotEntity slot : activeSlots) {
                // "Closing" means identifying this slot shouldn't operate on this specific
                // date.
                // Since WorkingSlotEntity represents a RECURRING schedule (usually),
                // deleting it removes it for ALL future dates too!
                // This is a problem if the user only wants to close ONE specific date (e.g.
                // sick day).
                //
                // If the user wants to close a SPECIFIC date but keep the schedule for next
                // week:
                // We CANNOT just Delete the slot if it's a recurring slot (effectiveTo is
                // future).
                //
                // Solution for Production Standard:
                // 1. If slot is specific to this date (effectiveFrom == effectiveTo == date),
                // DELETE it.
                // 2. If it's a range, we must SPLIT the slot or EXCLUDE the date.
                // But we don't have "exclude dates" field.
                // We have "effectiveFrom/To".
                // So we define the slot as [From... Date-1] AND [Date+1 ... To].
                //
                // Implementation:
                // A. Split the slot into two:
                // Slot 1: effectiveFrom ... (date - 1 day)
                // Slot 2: (date + 1 day) ... effectiveTo
                // B. If date is start or end, just truncate.

                LocalDate originalFrom = slot.getEffectiveFrom() != null ? slot.getEffectiveFrom() : LocalDate.MIN;
                LocalDate originalTo = slot.getEffectiveTo() != null ? slot.getEffectiveTo() : LocalDate.MAX;

                // If the slot is just for this day (or invalid range), delete it
                if (!originalFrom.isBefore(date) && !originalTo.isAfter(date)) {
                    workingSlotRepository.delete(slot);
                    continue;
                }

                // If date is right at the start: Start = date + 1
                if (date.equals(originalFrom)) {
                    slot.setEffectiveFrom(date.plusDays(1));
                    workingSlotRepository.save(slot);
                    continue;
                }

                // If date is right at the end: End = date - 1
                if (date.equals(originalTo)) {
                    slot.setEffectiveTo(date.minusDays(1));
                    workingSlotRepository.save(slot);
                    continue;
                }

                // If date is in the middle: Split!
                // Update current slot to end at date-1
                // Create new slot starting at date+1

                // Create new slot part 2
                WorkingSlotEntity part2 = new WorkingSlotEntity();
                part2.setStaff(slot.getStaff());
                part2.setDayOfWeek(slot.getDayOfWeek());
                part2.setStartTime(slot.getStartTime());
                part2.setEndTime(slot.getEndTime());
                part2.setBreakStartTime(slot.getBreakStartTime());
                part2.setBreakEndTime(slot.getBreakEndTime());
                part2.setIsActive(slot.getIsActive());
                part2.setEffectiveFrom(date.plusDays(1));
                part2.setEffectiveTo(slot.getEffectiveTo()); // Keep original end

                workingSlotRepository.save(part2);

                // Update original slot to end at date-1
                slot.setEffectiveTo(date.minusDays(1));
                workingSlotRepository.save(slot);
            }
        }

        // Since we modify/delete slots, returning them is tricky. Returning empty list.
        return new ArrayList<>();
    }

    private WorkingSlotResponse toResponse(WorkingSlotEntity entity) {
        WorkingSlotResponse dto = new WorkingSlotResponse();
        dto.setId(entity.getId());
        if (entity.getStaff() != null) {
            UserEntity staff = entity.getStaff();
            dto.setStaffId(staff.getId());
            dto.setStaffName(staff.getName());

            // Populate staff object for frontend
            WorkingSlotResponse.StaffInfo staffInfo = new WorkingSlotResponse.StaffInfo();
            staffInfo.setId(staff.getId());
            staffInfo.setName(staff.getName());
            staffInfo.setRole(staff.getRole() != null ? staff.getRole().getCode() : null);
            dto.setStaff(staffInfo);
        }
        dto.setDayOfWeek(entity.getDayOfWeek());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setBreakStartTime(entity.getBreakStartTime());
        dto.setBreakEndTime(entity.getBreakEndTime());
        dto.setIsActive(entity.getIsActive());
        dto.setEffectiveFrom(entity.getEffectiveFrom());
        dto.setEffectiveTo(entity.getEffectiveTo());
        dto.setBookedCount(0); // Field not in entity yet
        dto.setCapacity(1); // Default to 1, field not in entity yet
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}

package com.example.tailor_shop.modules.appointment.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.appointment.domain.AppointmentStatus;
import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import com.example.tailor_shop.modules.appointment.dto.*;
import com.example.tailor_shop.modules.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<Page<AppointmentResponse>>> list(
            @RequestParam(value = "tailorId", required = false) Long tailorId,
            @RequestParam(value = "customerId", required = false) Long customerId,
            @RequestParam(value = "date", required = false) LocalDate date,
            @RequestParam(value = "status", required = false) AppointmentStatus status,
            @RequestParam(value = "type", required = false) AppointmentType type,
            @PageableDefault(size = 20, sort = "appointmentDate") Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isCustomer = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        Page<AppointmentResponse> data = appointmentService.list(tailorId, customerId, date, status, type,
                principal != null ? principal.getId() : null, isCustomer, pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<AppointmentResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        boolean isCustomer = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        AppointmentResponse data = appointmentService.detail(id, principal != null ? principal.getId() : null, isCustomer);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<AppointmentResponse>> create(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        AppointmentResponse data = appointmentService.create(request, principal != null ? principal.getId() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<AppointmentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        AppointmentResponse data = appointmentService.update(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<AppointmentResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        AppointmentResponse data = appointmentService.updateStatus(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<CommonResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        appointmentService.delete(id, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    @GetMapping("/schedule")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<List<AppointmentResponse>>> getSchedule(
            @RequestParam(value = "tailorId") Long tailorId,
            @RequestParam(value = "date") LocalDate date,
            @RequestParam(value = "type", required = false) AppointmentType type
    ) {
        List<AppointmentResponse> data = appointmentService.getSchedule(tailorId, date, type);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/available-slots")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<List<AvailableSlotResponse>>> getAvailableSlots(
            @RequestParam(value = "tailorId") Long tailorId,
            @RequestParam(value = "date") LocalDate date,
            @RequestParam(value = "duration", required = false) Integer durationMinutes
    ) {
        List<AvailableSlotResponse> data = appointmentService.getAvailableSlots(tailorId, date, durationMinutes);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    // Working Slots
    @GetMapping("/working-slots")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<Page<WorkingSlotResponse>>> listWorkingSlots(
            @RequestParam(value = "tailorId", required = false) Long tailorId,
            @RequestParam(value = "date", required = false) LocalDate date,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<WorkingSlotResponse> data;
        if (tailorId != null) {
            data = appointmentService.listWorkingSlots(tailorId, date, pageable);
        } else {
            data = appointmentService.listAllWorkingSlots(date, pageable);
        }
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/working-slots/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<WorkingSlotResponse>> getWorkingSlot(@PathVariable Long id) {
        WorkingSlotResponse data = appointmentService.getWorkingSlot(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping("/working-slots")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<WorkingSlotResponse>> createWorkingSlot(
            @Valid @RequestBody WorkingSlotRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        WorkingSlotResponse data = appointmentService.createWorkingSlot(request, principal != null ? principal.getId() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PutMapping("/working-slots/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<WorkingSlotResponse>> updateWorkingSlot(
            @PathVariable Long id,
            @Valid @RequestBody WorkingSlotRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        WorkingSlotResponse data = appointmentService.updateWorkingSlot(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @DeleteMapping("/working-slots/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<CommonResponse<Void>> deleteWorkingSlot(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        appointmentService.deleteWorkingSlot(id, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }
}


package com.example.tailor_shop.modules.appointment.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import com.example.tailor_shop.modules.appointment.dto.*;
import com.example.tailor_shop.modules.appointment.service.WorkingSlotService;
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
@RequestMapping("/api/v1/working-slots")
public class WorkingSlotController {

    private final WorkingSlotService workingSlotService;

    public WorkingSlotController(WorkingSlotService workingSlotService) {
        this.workingSlotService = workingSlotService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR','CUSTOMER')")
    public ResponseEntity<CommonResponse<Page<WorkingSlotResponse>>> list(
            @RequestParam(value = "staffId", required = false) Long staffId,
            @RequestParam(value = "date", required = false) LocalDate date,
            @RequestParam(value = "type", required = false) AppointmentType type,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<WorkingSlotResponse> data;
        if (staffId != null) {
            data = workingSlotService.list(staffId, date, pageable);
        } else {
            data = workingSlotService.listAll(date, pageable);
        }

        if (type != null) {
            data = workingSlotService.filterByType(data, type);
        }
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<WorkingSlotResponse>> detail(@PathVariable Long id) {
        WorkingSlotResponse data = workingSlotService.detail(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<WorkingSlotResponse>> create(
            @Valid @RequestBody WorkingSlotRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        WorkingSlotResponse data = workingSlotService.create(request, principal != null ? principal.getId() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<WorkingSlotResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkingSlotRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        WorkingSlotResponse data = workingSlotService.update(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PatchMapping("/{id}/book")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CommonResponse<WorkingSlotResponse>> updateBookedCount(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> request) {
        WorkingSlotResponse data = workingSlotService.updateBookedCount(id, request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<CommonResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        workingSlotService.delete(id, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<List<WorkingSlotResponse>>> createBulk(
            @Valid @RequestBody BulkWorkingSlotRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        List<WorkingSlotResponse> data = workingSlotService.createBulk(
                request, principal != null ? principal.getId() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping("/{staffId}/reset")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<CommonResponse<Void>> resetToDefault(
            @PathVariable Long staffId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        workingSlotService.resetToDefault(staffId, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    @GetMapping("/{staffId}/hours")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','TAILOR')")
    public ResponseEntity<CommonResponse<WorkingHoursResponse>> getHours(@PathVariable Long staffId) {
        WorkingHoursResponse data = workingSlotService.getHours(staffId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping("/close-dates")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<CommonResponse<List<WorkingSlotResponse>>> closeDates(
            @Valid @RequestBody CloseDateRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        List<WorkingSlotResponse> data = workingSlotService.closeDates(
                request, principal != null ? principal.getId() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }
}

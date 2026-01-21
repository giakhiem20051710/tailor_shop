package com.example.tailor_shop.modules.event.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.modules.event.domain.FailedEventEntity;
import com.example.tailor_shop.modules.event.service.EventRetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin API for Dead-Letter Queue management.
 * 
 * Endpoints:
 * - GET /stats: Get DLQ statistics
 * - GET /dead: Get events requiring manual intervention
 * - POST /{id}/retry: Manually retry a failed event
 * - POST /{id}/skip: Skip a failed event
 */
@RestController
@RequestMapping("/api/v1/admin/dlq")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class DlqAdminController {

    private final EventRetryService eventRetryService;

    /**
     * Get DLQ statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<CommonResponse<EventRetryService.DlqStats>> getStats() {
        EventRetryService.DlqStats stats = eventRetryService.getStats();
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), stats));
    }

    /**
     * Get dead events (max retries exceeded, require manual intervention).
     */
    @GetMapping("/dead")
    public ResponseEntity<CommonResponse<List<FailedEventEntity>>> getDeadEvents() {
        List<FailedEventEntity> deadEvents = eventRetryService.getDeadEvents();
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), deadEvents));
    }

    /**
     * Manually retry a failed event.
     */
    @PostMapping("/{id}/retry")
    public ResponseEntity<CommonResponse<String>> retryEvent(@PathVariable Long id) {
        log.info("Admin manually retrying event: {}", id);
        eventRetryService.manualRetry(id);
        return ResponseEntity.ok(ResponseUtil.success(
                TraceIdUtil.getOrCreateTraceId(),
                "Event scheduled for retry"));
    }

    /**
     * Skip a failed event (mark as resolved without processing).
     */
    @PostMapping("/{id}/skip")
    public ResponseEntity<CommonResponse<String>> skipEvent(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Manually skipped by admin") String reason) {
        log.info("Admin skipping event {}: {}", id, reason);
        eventRetryService.skipEvent(id, reason);
        return ResponseEntity.ok(ResponseUtil.success(
                TraceIdUtil.getOrCreateTraceId(),
                "Event marked as skipped"));
    }
}

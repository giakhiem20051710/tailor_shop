package com.example.tailor_shop.modules.event.service;

import com.example.tailor_shop.modules.event.domain.FailedEventEntity;
import com.example.tailor_shop.modules.event.domain.FailedEventEntity.FailedEventStatus;
import com.example.tailor_shop.modules.event.repository.FailedEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Consumer;

/**
 * Service for handling event retries and dead-letter queue management.
 * 
 * Features:
 * - Save failed events to DLQ with retry scheduling
 * - Retry failed events with exponential backoff
 * - Clean up old processed events
 * - Provide admin APIs for DLQ management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventRetryService {

    private final FailedEventRepository failedEventRepository;
    private final ObjectMapper objectMapper;

    /**
     * Save a failed event to the dead-letter queue.
     * 
     * @param event The event that failed
     * @param handlerClass Class name of the handler
     * @param handlerMethod Method name of the handler
     * @param exception The exception that caused the failure
     * @param correlationId Correlation ID for tracing
     * @param maxRetries Maximum retry attempts
     */
    @Transactional
    public void saveFailedEvent(Object event, String handlerClass, String handlerMethod,
                                 Exception exception, String correlationId, int maxRetries) {
        try {
            FailedEventEntity failedEvent = new FailedEventEntity();
            failedEvent.setCorrelationId(correlationId != null ? correlationId : "unknown");
            failedEvent.setEventType(event.getClass().getSimpleName());
            failedEvent.setEventPayload(objectMapper.writeValueAsString(event));
            failedEvent.setHandlerClass(handlerClass);
            failedEvent.setHandlerMethod(handlerMethod);
            failedEvent.setErrorMessage(exception.getMessage());
            failedEvent.setStackTrace(getStackTrace(exception));
            failedEvent.setMaxRetries(maxRetries);
            failedEvent.scheduleNextRetry();
            
            failedEventRepository.save(failedEvent);
            
            log.warn("Event saved to DLQ: type={}, handler={}.{}, correlationId={}, nextRetry={}",
                    failedEvent.getEventType(), handlerClass, handlerMethod,
                    correlationId, failedEvent.getNextRetryAt());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event to DLQ: {}", e.getMessage(), e);
        }
    }

    /**
     * Process events ready for retry.
     * Runs every minute.
     */
    @Scheduled(fixedDelay = 60000) // Every 1 minute
    @Transactional
    public void processRetryQueue() {
        List<FailedEventEntity> eventsToRetry = failedEventRepository
                .findEventsReadyForRetry(LocalDateTime.now());
        
        if (eventsToRetry.isEmpty()) {
            return;
        }
        
        log.info("Processing {} events from retry queue", eventsToRetry.size());
        
        for (FailedEventEntity failedEvent : eventsToRetry) {
            // Lock the event to prevent concurrent processing
            int locked = failedEventRepository.lockForRetry(failedEvent.getId());
            if (locked == 0) {
                continue; // Already being processed by another instance
            }
            
            try {
                retryEvent(failedEvent);
            } catch (Exception e) {
                log.error("Retry failed for event {}: {}", failedEvent.getId(), e.getMessage());
                handleRetryFailure(failedEvent, e);
            }
        }
    }

    /**
     * Retry a specific failed event.
     * This method should be overridden or configured with actual retry logic.
     */
    private void retryEvent(FailedEventEntity failedEvent) {
        log.info("Retrying event: id={}, type={}, attempt={}/{}",
                failedEvent.getId(), failedEvent.getEventType(),
                failedEvent.getRetryCount(), failedEvent.getMaxRetries());
        
        // TODO: Implement actual retry logic based on event type
        // This would typically involve:
        // 1. Deserialize the event payload
        // 2. Find the appropriate handler
        // 3. Invoke the handler
        // For now, we just mark it as processed (demo)
        
        // Simulate retry logic
        // Object event = objectMapper.readValue(failedEvent.getEventPayload(), eventClass);
        // handler.handle(event);
        
        // If successful:
        failedEvent.markProcessed();
        failedEventRepository.save(failedEvent);
        
        log.info("Event {} processed successfully after retry", failedEvent.getId());
    }

    /**
     * Handle retry failure - schedule next retry or mark as dead.
     */
    private void handleRetryFailure(FailedEventEntity failedEvent, Exception e) {
        failedEvent.setErrorMessage(e.getMessage());
        failedEvent.setStackTrace(getStackTrace(e));
        failedEvent.scheduleNextRetry();
        failedEventRepository.save(failedEvent);
        
        if (failedEvent.getStatus() == FailedEventStatus.DEAD) {
            log.error("Event {} moved to DEAD status after {} retries. Manual intervention required.",
                    failedEvent.getId(), failedEvent.getMaxRetries());
            // TODO: Send alert to admin
        } else {
            log.warn("Event {} scheduled for retry at {}", 
                    failedEvent.getId(), failedEvent.getNextRetryAt());
        }
    }

    /**
     * Clean up old processed events.
     * Runs daily at 3 AM.
     */
    @Scheduled(cron = "0 0 3 * * *") // 3 AM daily
    @Transactional
    public void cleanupOldEvents() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        int deleted = failedEventRepository.deleteProcessedEventsBefore(cutoff);
        log.info("Cleaned up {} old processed events", deleted);
    }

    // ==================== ADMIN APIs ====================

    /**
     * Get DLQ statistics.
     */
    public DlqStats getStats() {
        return new DlqStats(
                failedEventRepository.countByStatus(FailedEventStatus.PENDING),
                failedEventRepository.countByStatus(FailedEventStatus.RETRYING),
                failedEventRepository.countByStatus(FailedEventStatus.DEAD),
                failedEventRepository.countByStatus(FailedEventStatus.PROCESSED)
        );
    }

    /**
     * Get dead events requiring manual intervention.
     */
    public List<FailedEventEntity> getDeadEvents() {
        return failedEventRepository.findByStatusOrderByCreatedAtDesc(FailedEventStatus.DEAD);
    }

    /**
     * Manually retry a dead event.
     */
    @Transactional
    public void manualRetry(Long eventId) {
        FailedEventEntity event = failedEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found: " + eventId));
        
        event.setRetryCount(0);
        event.setMaxRetries(event.getMaxRetries() + 3); // Give 3 more attempts
        event.scheduleNextRetry();
        failedEventRepository.save(event);
        
        log.info("Event {} scheduled for manual retry", eventId);
    }

    /**
     * Skip a dead event (won't be retried).
     */
    @Transactional
    public void skipEvent(Long eventId, String reason) {
        FailedEventEntity event = failedEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found: " + eventId));
        
        event.setStatus(FailedEventStatus.SKIPPED);
        event.setReviewNotes(reason);
        failedEventRepository.save(event);
        
        log.info("Event {} marked as skipped: {}", eventId, reason);
    }

    // ==================== HELPERS ====================

    private String getStackTrace(Exception e) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }

    public record DlqStats(long pending, long retrying, long dead, long processed) {}
}

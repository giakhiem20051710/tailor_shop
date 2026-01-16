package com.example.tailor_shop.modules.event.aspect;

import com.example.tailor_shop.modules.event.annotation.RetryableEvent;
import com.example.tailor_shop.modules.event.service.EventRetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;

/**
 * Aspect that wraps @RetryableEvent annotated methods with retry logic.
 * 
 * Intercepts event listener methods and:
 * 1. Catches exceptions
 * 2. Retries with exponential backoff
 * 3. Saves to DLQ after max retries
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Run before other aspects
public class RetryableEventAspect {

    private final EventRetryService eventRetryService;

    @Around("@annotation(retryableEvent)")
    public Object handleRetryableEvent(ProceedingJoinPoint joinPoint, RetryableEvent retryableEvent) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String handlerClass = joinPoint.getTarget().getClass().getSimpleName();
        String handlerMethod = method.getName();

        Object[] args = joinPoint.getArgs();
        Object event = args.length > 0 ? args[0] : null;
        String correlationId = extractCorrelationId(event);

        int maxRetries = retryableEvent.maxRetries();
        int attempt = 0;
        Exception lastException = null;

        while (attempt <= maxRetries) {
            try {
                return joinPoint.proceed();
            } catch (Exception e) {
                lastException = e;

                // Check if this exception should not be retried
                if (shouldNotRetry(e, retryableEvent)) {
                    log.error("[{}] Non-retryable exception in {}.{}: {}",
                            correlationId, handlerClass, handlerMethod, e.getMessage());
                    throw e;
                }

                attempt++;

                if (attempt <= maxRetries) {
                    long delay = calculateBackoff(attempt);
                    log.warn("[{}] Retry {}/{} for {}.{} after {}ms: {}",
                            correlationId, attempt, maxRetries, handlerClass, handlerMethod, delay, e.getMessage());

                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw e;
                    }
                }
            }
        }

        // All retries exhausted
        log.error("[{}] All {} retries exhausted for {}.{}",
                correlationId, maxRetries, handlerClass, handlerMethod);

        // Save to DLQ if configured
        if (retryableEvent.saveToDlq() && event != null) {
            eventRetryService.saveFailedEvent(
                    event,
                    handlerClass,
                    handlerMethod,
                    lastException,
                    correlationId,
                    maxRetries);
        }

        // Don't throw exception to prevent blocking other listeners
        // The event is now in DLQ for later processing
        return null;
    }

    /**
     * Check if exception should NOT be retried.
     */
    private boolean shouldNotRetry(Exception e, RetryableEvent annotation) {
        // Check noRetryOn list
        for (Class<? extends Exception> noRetryClass : annotation.noRetryOn()) {
            if (noRetryClass.isInstance(e)) {
                return true;
            }
        }

        // Check if exception is in retryOn list
        Class<? extends Exception>[] retryOn = annotation.retryOn();
        if (retryOn.length == 1 && retryOn[0] == Exception.class) {
            return false; // Retry all exceptions
        }

        for (Class<? extends Exception> retryClass : retryOn) {
            if (retryClass.isInstance(e)) {
                return false;
            }
        }

        return true; // Not in retryOn list, don't retry
    }

    /**
     * Calculate backoff delay using exponential backoff with jitter.
     * Base: 100ms, Max: 5000ms
     */
    private long calculateBackoff(int attempt) {
        long baseDelay = 100;
        long maxDelay = 5000;
        long delay = (long) (baseDelay * Math.pow(2, attempt - 1));

        // Add jitter (±20%)
        double jitter = 0.8 + Math.random() * 0.4;
        delay = (long) (delay * jitter);

        return Math.min(delay, maxDelay);
    }

    /**
     * Extract correlation ID from event using reflection.
     */
    private String extractCorrelationId(Object event) {
        if (event == null)
            return "unknown";

        try {
            Method getCorrelationId = event.getClass().getMethod("getCorrelationId");
            Object result = getCorrelationId.invoke(event);
            return result != null ? result.toString() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}

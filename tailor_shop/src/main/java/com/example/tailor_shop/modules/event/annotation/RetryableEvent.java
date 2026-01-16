package com.example.tailor_shop.modules.event.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark event listeners for automatic retry on failure.
 * 
 * Usage:
 * 
 * <pre>
 * &#64;EventListener
 * @RetryableEvent(maxRetries = 3)
 * public void handleOrder(OrderCreatedEvent event) {
 *     // ...
 * }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RetryableEvent {

    /**
     * Maximum number of retry attempts.
     * Default: 3
     */
    int maxRetries() default 3;

    /**
     * Whether to save to DLQ on final failure.
     * Default: true
     */
    boolean saveToDlq() default true;

    /**
     * Exception types that should trigger retry.
     * Default: all exceptions
     */
    Class<? extends Exception>[] retryOn() default { Exception.class };

    /**
     * Exception types that should NOT trigger retry.
     * These exceptions will fail immediately without retry.
     */
    Class<? extends Exception>[] noRetryOn() default {};
}

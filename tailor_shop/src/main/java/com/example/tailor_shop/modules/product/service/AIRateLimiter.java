package com.example.tailor_shop.modules.product.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.Semaphore;
import java.util.function.Supplier;

/**
 * Service để rate limit AI Vision API calls
 * Sử dụng Semaphore và RateLimiter để tránh bị API provider block
 */
@Service
@Slf4j
public class AIRateLimiter {

    private final Semaphore semaphore;
    private final SimpleRateLimiter rateLimiter;

    public AIRateLimiter() {
        // Max 5 concurrent AI calls
        this.semaphore = new Semaphore(5);
        // Max 10 requests/second
        this.rateLimiter = new SimpleRateLimiter(10.0);
    }

    /**
     * Execute AI call với rate limiting
     */
    public <T> T executeWithRateLimit(Supplier<T> aiCall) {
        rateLimiter.acquire(); // Wait for rate limit
        
        try {
            semaphore.acquire(); // Wait for available slot
            log.debug("Acquired semaphore, executing AI call");
            return aiCall.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("AI call interrupted", e);
        } finally {
            semaphore.release();
            log.debug("Released semaphore");
        }
    }

    /**
     * Simple rate limiter implementation
     * Giới hạn số lượng requests per second
     */
    private static class SimpleRateLimiter {
        private final double permitsPerSecond;
        private long nextFreeTicketMicros;
        private final Object lock = new Object();

        public SimpleRateLimiter(double permitsPerSecond) {
            this.permitsPerSecond = permitsPerSecond;
            this.nextFreeTicketMicros = System.nanoTime() / 1000;
        }

        public void acquire() {
            synchronized (lock) {
                long now = System.nanoTime() / 1000;
                long waitMicros = Math.max(0, nextFreeTicketMicros - now);
                
                if (waitMicros > 0) {
                    try {
                        Thread.sleep(waitMicros / 1000, (int) ((waitMicros % 1000) * 1000));
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Rate limiter interrupted", e);
                    }
                }
                
                nextFreeTicketMicros = Math.max(now, nextFreeTicketMicros) + (long) (1_000_000 / permitsPerSecond);
            }
        }
    }
}


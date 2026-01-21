package com.example.tailor_shop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async configuration for event listeners.
 * 
 * Enables @Async annotation and configures thread pool for async event
 * processing.
 */
@Configuration
@EnableAsync
public class AsyncEventConfig {

    /**
     * Thread pool for async event processing.
     * 
     * Configuration:
     * - Core pool: 5 threads (always available)
     * - Max pool: 15 threads (can scale up under load)
     * - Queue: 500 tasks (buffer before rejecting)
     */
    @Bean(name = "eventExecutor")
    public Executor eventExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(15);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("Event-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }

    /**
     * Separate thread pool for notification tasks (email, SMS).
     * These can be slower due to external API calls.
     */
    @Bean(name = "notificationExecutor")
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("Notification-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(120); // Wait longer for email delivery
        executor.initialize();
        return executor;
    }
}

package com.example.tailor_shop.config.ratelimit;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration properties for API rate limiting
 */
@Data
@Component
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitProperties {

    /**
     * Enable/disable rate limiting
     */
    private boolean enabled = true;

    /**
     * Maximum requests per minute per IP
     */
    private int requestsPerMinute = 100;

    /**
     * Maximum requests per second per IP (burst limit)
     */
    private int requestsPerSecond = 10;

    /**
     * Whitelisted IP addresses (exempted from rate limiting)
     */
    private List<String> whitelist = new ArrayList<>();
}

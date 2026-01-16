package com.example.tailor_shop.config.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Rate limiting filter using Redis to track request counts per IP
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "rate-limit.enabled", havingValue = "true", matchIfMissing = true)
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedisTemplate<String, String> stringRedisTemplate;
    private final RateLimitProperties properties;

    private static final String RATE_LIMIT_KEY_PREFIX = "rate_limit:";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Skip if rate limiting is disabled
        if (!properties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIP(request);

        // Skip whitelisted IPs
        if (isWhitelisted(clientIp)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip non-API requests (static files, actuator, etc.)
        String requestUri = request.getRequestURI();
        if (!requestUri.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String key = RATE_LIMIT_KEY_PREFIX + clientIp;

            // Increment counter
            Long count = stringRedisTemplate.opsForValue().increment(key);

            // Set expiry on first request
            if (count != null && count == 1) {
                stringRedisTemplate.expire(key, Duration.ofMinutes(1));
            }

            // Check if limit exceeded
            if (count != null && count > properties.getRequestsPerMinute()) {
                log.warn("Rate limit exceeded for IP: {} (count: {})", clientIp, count);

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("""
                        {
                            "success": false,
                            "message": "Too many requests. Please try again later.",
                            "error": "RATE_LIMIT_EXCEEDED"
                        }
                        """);
                return;
            }

            // Add rate limit headers
            response.setHeader("X-RateLimit-Limit", String.valueOf(properties.getRequestsPerMinute()));
            response.setHeader("X-RateLimit-Remaining",
                    String.valueOf(Math.max(0, properties.getRequestsPerMinute() - (count != null ? count : 0))));

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            // If Redis is down, allow the request but log the error
            log.error("Rate limiting error (Redis may be down): {}", e.getMessage());
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Get client IP, handling proxy headers
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }

        return request.getRemoteAddr();
    }

    /**
     * Check if IP is whitelisted
     */
    private boolean isWhitelisted(String ip) {
        return properties.getWhitelist().contains(ip);
    }
}

package com.example.tailor_shop.config.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

/**
 * Security Audit Logger for tracking security-related events.
 * All security events should be logged through this service for centralized monitoring.
 * 
 * Log format follows security best practices for SIEM integration.
 */
@Component
@Slf4j
public class SecurityAuditLogger {

    private static final String AUDIT_PREFIX = "SECURITY_AUDIT";

    // ==================== AUTHENTICATION EVENTS ====================

    /**
     * Log successful login attempt.
     */
    public void logLoginSuccess(String username, String ipAddress, String userAgent) {
        log.info("{} | EVENT=LOGIN_SUCCESS | user={} | ip={} | userAgent={} | timestamp={}",
                AUDIT_PREFIX, username, ipAddress, sanitize(userAgent), OffsetDateTime.now());
    }

    /**
     * Log failed login attempt.
     */
    public void logLoginFailure(String username, String ipAddress, String reason) {
        log.warn("{} | EVENT=LOGIN_FAILURE | user={} | ip={} | reason={} | timestamp={}",
                AUDIT_PREFIX, username, ipAddress, reason, OffsetDateTime.now());
    }

    /**
     * Log account lockout due to too many failed attempts.
     */
    public void logAccountLockout(String username, String ipAddress, int attemptCount) {
        log.warn("{} | EVENT=ACCOUNT_LOCKOUT | user={} | ip={} | attempts={} | timestamp={}",
                AUDIT_PREFIX, username, ipAddress, attemptCount, OffsetDateTime.now());
    }

    /**
     * Log successful logout.
     */
    public void logLogout(String username, String ipAddress) {
        log.info("{} | EVENT=LOGOUT | user={} | ip={} | timestamp={}",
                AUDIT_PREFIX, username, ipAddress, OffsetDateTime.now());
    }

    // ==================== TOKEN EVENTS ====================

    /**
     * Log token refresh.
     */
    public void logTokenRefresh(String username, String ipAddress) {
        log.info("{} | EVENT=TOKEN_REFRESH | user={} | ip={} | timestamp={}",
                AUDIT_PREFIX, username, ipAddress, OffsetDateTime.now());
    }

    /**
     * Log token revocation (logout, password change, etc).
     */
    public void logTokenRevoked(String username, String jti, String reason) {
        log.info("{} | EVENT=TOKEN_REVOKED | user={} | jti={} | reason={} | timestamp={}",
                AUDIT_PREFIX, username, jti, reason, OffsetDateTime.now());
    }

    /**
     * Log invalid token access attempt.
     */
    public void logInvalidToken(String ipAddress, String reason) {
        log.warn("{} | EVENT=INVALID_TOKEN | ip={} | reason={} | timestamp={}",
                AUDIT_PREFIX, ipAddress, reason, OffsetDateTime.now());
    }

    // ==================== PASSWORD EVENTS ====================

    /**
     * Log password change.
     */
    public void logPasswordChange(String username, String ipAddress) {
        log.info("{} | EVENT=PASSWORD_CHANGE | user={} | ip={} | timestamp={}",
                AUDIT_PREFIX, username, ipAddress, OffsetDateTime.now());
    }

    /**
     * Log password reset request.
     */
    public void logPasswordResetRequest(String email, String ipAddress) {
        log.info("{} | EVENT=PASSWORD_RESET_REQUEST | email={} | ip={} | timestamp={}",
                AUDIT_PREFIX, maskEmail(email), ipAddress, OffsetDateTime.now());
    }

    /**
     * Log successful password reset.
     */
    public void logPasswordResetSuccess(String email, String ipAddress) {
        log.info("{} | EVENT=PASSWORD_RESET_SUCCESS | email={} | ip={} | timestamp={}",
                AUDIT_PREFIX, maskEmail(email), ipAddress, OffsetDateTime.now());
    }

    // ==================== AUTHORIZATION EVENTS ====================

    /**
     * Log unauthorized access attempt.
     */
    public void logUnauthorizedAccess(String username, String resource, String ipAddress) {
        log.warn("{} | EVENT=UNAUTHORIZED_ACCESS | user={} | resource={} | ip={} | timestamp={}",
                AUDIT_PREFIX, username, resource, ipAddress, OffsetDateTime.now());
    }

    /**
     * Log role change.
     */
    public void logRoleChange(String targetUser, String oldRole, String newRole, String changedBy) {
        log.warn("{} | EVENT=ROLE_CHANGE | target={} | oldRole={} | newRole={} | changedBy={} | timestamp={}",
                AUDIT_PREFIX, targetUser, oldRole, newRole, changedBy, OffsetDateTime.now());
    }

    // ==================== ACCOUNT EVENTS ====================

    /**
     * Log new user registration.
     */
    public void logUserRegistration(String username, String email, String ipAddress) {
        log.info("{} | EVENT=USER_REGISTRATION | user={} | email={} | ip={} | timestamp={}",
                AUDIT_PREFIX, username, maskEmail(email), ipAddress, OffsetDateTime.now());
    }

    /**
     * Log account deactivation.
     */
    public void logAccountDeactivation(String targetUser, String reason, String deactivatedBy) {
        log.warn("{} | EVENT=ACCOUNT_DEACTIVATION | target={} | reason={} | by={} | timestamp={}",
                AUDIT_PREFIX, targetUser, reason, deactivatedBy, OffsetDateTime.now());
    }

    // ==================== HELPERS ====================

    /**
     * Mask email for privacy in logs (show first 2 chars and domain).
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int atIndex = email.indexOf("@");
        if (atIndex <= 2) {
            return "***" + email.substring(atIndex);
        }
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }

    /**
     * Sanitize user agent to prevent log injection.
     */
    private String sanitize(String input) {
        if (input == null) {
            return "unknown";
        }
        // Remove newlines and limit length
        return input.replaceAll("[\\r\\n]", "").substring(0, Math.min(input.length(), 200));
    }
}

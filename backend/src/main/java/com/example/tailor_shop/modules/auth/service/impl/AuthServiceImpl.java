package com.example.tailor_shop.modules.auth.service.impl;

import com.example.tailor_shop.common.PredefinedRole;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.config.security.JwtService;
import com.example.tailor_shop.config.security.SecurityAuditLogger;
import com.example.tailor_shop.modules.auth.domain.PasswordResetToken;
import com.example.tailor_shop.modules.auth.dto.*;
import com.example.tailor_shop.modules.auth.repository.PasswordResetTokenRepository;
import com.example.tailor_shop.modules.auth.service.AuthService;
import com.example.tailor_shop.modules.auth.service.EmailService;
import com.example.tailor_shop.modules.auth.service.LoginAttemptService;
import com.example.tailor_shop.modules.user.domain.RoleEntity;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.RoleRepository;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;

/**
 * Authentication Service Implementation.
 * 
 * Security features:
 * - Access + Refresh token generation
 * - Login attempt tracking and lockout
 * - OTP-based password reset
 * - Security audit logging
 */
@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final LoginAttemptService loginAttemptService;
    private final EmailService emailService;
    private final SecurityAuditLogger auditLogger;
    private final UserDetailsService userDetailsService;

    private final long otpExpireMinutes = 10;
    private final SecureRandom random = new SecureRandom();

    public AuthServiceImpl(AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            PasswordResetTokenRepository passwordResetTokenRepository,
            LoginAttemptService loginAttemptService,
            EmailService emailService,
            SecurityAuditLogger auditLogger,
            UserDetailsService userDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.loginAttemptService = loginAttemptService;
        this.emailService = emailService;
        this.auditLogger = auditLogger;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        String key = request.getPhoneOrEmail().toLowerCase();

        // Check if account is locked
        if (loginAttemptService.isLocked(key)) {
            auditLogger.logAccountLockout(key, "unknown", 5); // IP should come from controller
            throw new BadRequestException("Account locked temporarily due to many failed attempts");
        }

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getPhoneOrEmail(), request.getPassword()));

            // Clear failed attempts on success
            loginAttemptService.recordSuccess(key);

            UserDetails userDetails = (UserDetails) auth.getPrincipal();

            // Generate both access and refresh tokens
            String accessToken = jwtService.generateAccessToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            // Audit log success
            auditLogger.logLoginSuccess(userDetails.getUsername(), "unknown", "unknown");

            return new LoginResponse(
                    accessToken,
                    refreshToken,
                    jwtService.getExpirationMs(),
                    jwtService.getRefreshExpirationMs());
        } catch (BadCredentialsException ex) {
            loginAttemptService.recordFailure(key);
            auditLogger.logLoginFailure(key, "unknown", "Bad credentials");
            throw ex;
        }
    }

    /**
     * Refresh access token using refresh token.
     */
    public LoginResponse refreshToken(String refreshToken) {
        try {
            // Validate refresh token
            if (!jwtService.isRefreshToken(refreshToken)) {
                throw new BadRequestException("Invalid refresh token");
            }

            String username = jwtService.extractUsername(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (!jwtService.isTokenValid(refreshToken, userDetails)) {
                throw new BadRequestException("Refresh token expired or invalid");
            }

            // Generate new tokens
            String newAccessToken = jwtService.generateAccessToken(userDetails);
            String newRefreshToken = jwtService.generateRefreshToken(userDetails);

            auditLogger.logTokenRefresh(username, "unknown");

            return new LoginResponse(
                    newAccessToken,
                    newRefreshToken,
                    jwtService.getExpirationMs(),
                    jwtService.getRefreshExpirationMs());
        } catch (Exception e) {
            auditLogger.logInvalidToken("unknown", e.getMessage());
            throw new BadRequestException("Invalid refresh token: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Phone number already exists");
        }

        // Validate role: only allow customer, staff, tailor (not admin)
        String roleCode = request.getRole();
        if (!roleCode.equals(PredefinedRole.CUSTOMER_ROLE) &&
                !roleCode.equals(PredefinedRole.STAFF_ROLE) &&
                !roleCode.equals(PredefinedRole.TAILOR_ROLE)) {
            throw new BadRequestException("Invalid role. Allowed roles: customer, staff, tailor");
        }

        RoleEntity role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new NotFoundException("Role " + roleCode + " not found"));

        UserEntity user = new UserEntity();
        user.setUsername(request.getEmail().toLowerCase());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setName(request.getName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setStatus(UserEntity.UserStatus.active);
        user.setIsDeleted(false);
        userRepository.save(user);

        // Audit log registration
        auditLogger.logUserRegistration(request.getEmail(), request.getEmail(), "unknown");
        log.info("User registered successfully: {}", request.getEmail());
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        UserEntity user = userRepository.findByEmailAndIsDeletedFalse(request.getEmail())
                .orElseThrow(() -> new NotFoundException("Email not found"));

        // Rate limit: allow max 3 tokens in last 30 minutes
        if (passwordResetTokenRepository.countByUserAndCreatedAtAfter(user,
                OffsetDateTime.now().minusMinutes(30)) >= 3) {
            throw new BadRequestException("Too many reset requests. Please try later.");
        }

        // Invalidate old tokens
        passwordResetTokenRepository.deleteByUser(user);

        // Generate 6-digit OTP code
        String otpCode = generateOtpCode();

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setOtpCode(otpCode);
        token.setExpiresAt(OffsetDateTime.now().plusMinutes(otpExpireMinutes));
        passwordResetTokenRepository.save(token);

        // Send OTP via email
        emailService.sendOtpEmail(user.getEmail(), otpCode, user.getName());

        // Audit log
        auditLogger.logPasswordResetRequest(request.getEmail(), "unknown");
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        UserEntity user = userRepository.findByEmailAndIsDeletedFalse(request.getEmail())
                .orElseThrow(() -> new NotFoundException("Email not found"));

        PasswordResetToken token = passwordResetTokenRepository
                .findByUserAndOtpCodeAndUsedFalse(user, request.getOtpCode())
                .orElseThrow(() -> new BadRequestException("Invalid or used OTP code"));

        if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("OTP code expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        // Audit log
        auditLogger.logPasswordResetSuccess(request.getEmail(), "unknown");
        auditLogger.logPasswordChange(user.getUsername(), "unknown");

        // TODO: Revoke all refresh tokens for this user
        log.info("Password reset successful for user: {}", user.getEmail());
    }

    private String generateOtpCode() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}

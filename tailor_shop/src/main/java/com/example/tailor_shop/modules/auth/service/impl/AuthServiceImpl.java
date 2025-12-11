package com.example.tailor_shop.modules.auth.service.impl;

import com.example.tailor_shop.common.PredefinedRole;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.config.security.JwtService;
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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final LoginAttemptService loginAttemptService;
    private final EmailService emailService;
    private final long otpExpireMinutes = 10;
    private final SecureRandom random = new SecureRandom();

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           JwtService jwtService,
                           UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           LoginAttemptService loginAttemptService,
                           EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.loginAttemptService = loginAttemptService;
        this.emailService = emailService;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        String key = request.getPhoneOrEmail().toLowerCase();
        if (loginAttemptService.isLocked(key)) {
            throw new BadRequestException("Account locked temporarily due to many failed attempts");
        }

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getPhoneOrEmail(), request.getPassword())
            );
            loginAttemptService.recordSuccess(key);
            String token = jwtService.generateToken((org.springframework.security.core.userdetails.UserDetails) auth.getPrincipal());
            return new LoginResponse(token, jwtService.getExpirationMs());
        } catch (BadCredentialsException ex) {
            loginAttemptService.recordFailure(key);
            throw ex;
        }
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Phone number already exists");
        }

        // Validate role: chỉ cho phép customer, staff, tailor (không cho phép admin)
        String roleCode = request.getRole();
        if (!roleCode.equals(PredefinedRole.CUSTOMER_ROLE) &&
                !roleCode.equals(PredefinedRole.STAFF_ROLE) &&
                !roleCode.equals(PredefinedRole.TAILOR_ROLE)) {
            throw new BadRequestException("Invalid role. Allowed roles: customer, staff, tailor");
        }

        RoleEntity role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new NotFoundException("Role " + roleCode + " not found"));

        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setName(request.getName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setStatus(UserEntity.UserStatus.active);
        user.setIsDeleted(false);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        UserEntity user = userRepository.findByEmailAndIsDeletedFalse(request.getEmail())
                .orElseThrow(() -> new NotFoundException("Email not found"));

        // rate limit: allow max 3 tokens in last 30 minutes
        if (passwordResetTokenRepository.countByUserAndCreatedAtAfter(user, OffsetDateTime.now().minusMinutes(30)) >= 3) {
            throw new BadRequestException("Too many reset requests. Please try later.");
        }

        // invalidate old tokens
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
        // If you store refresh tokens, revoke here.
    }

    private String generateOtpCode() {
        // Generate 6-digit OTP code
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}


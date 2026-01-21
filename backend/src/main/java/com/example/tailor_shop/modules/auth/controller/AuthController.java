package com.example.tailor_shop.modules.auth.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.modules.auth.dto.*;
import com.example.tailor_shop.modules.auth.service.impl.AuthServiceImpl;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller.
 * 
 * Endpoints:
 * - POST /login: Login with email/phone and password
 * - POST /register: Register new user
 * - POST /refresh: Refresh access token using refresh token
 * - POST /forgot-password: Request password reset OTP
 * - POST /reset-password: Reset password with OTP
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthServiceImpl authService;

    public AuthController(AuthServiceImpl authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<CommonResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse data = authService.login(request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping("/register")
    public ResponseEntity<CommonResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    /**
     * Refresh access token using a valid refresh token.
     * 
     * @param refreshToken The refresh token from previous login
     * @return New access and refresh tokens
     */
    @PostMapping("/refresh")
    public ResponseEntity<CommonResponse<LoginResponse>> refresh(@RequestBody RefreshTokenRequest request) {
        LoginResponse data = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<CommonResponse<Void>> forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<CommonResponse<Void>> reset(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }
}

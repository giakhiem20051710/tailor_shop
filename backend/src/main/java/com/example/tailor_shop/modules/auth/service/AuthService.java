package com.example.tailor_shop.modules.auth.service;

import com.example.tailor_shop.modules.auth.dto.*;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    void register(RegisterRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}


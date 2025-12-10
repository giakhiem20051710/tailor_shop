package com.example.tailor_shop.modules.auth.service;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otpCode, String userName);
}

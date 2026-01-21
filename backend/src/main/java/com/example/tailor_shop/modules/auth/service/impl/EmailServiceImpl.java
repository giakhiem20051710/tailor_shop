package com.example.tailor_shop.modules.auth.service.impl;

import com.example.tailor_shop.modules.auth.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    @Override
    public void sendOtpEmail(String toEmail, String otpCode, String userName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Mã OTP đặt lại mật khẩu - Tailor Shop");

        String emailBody = String.format(
                "Xin chào %s,\n\n" +
                        "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.\n\n" +
                        "Mã OTP của bạn là: %s\n\n" +
                        "Mã OTP này có hiệu lực trong 10 phút.\n\n" +
                        "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n" +
                        "Trân trọng,\n" +
                        "Đội ngũ Tailor Shop",
                userName != null ? userName : "Quý khách",
                otpCode
        );

        message.setText(emailBody);
        mailSender.send(message);
    }
}


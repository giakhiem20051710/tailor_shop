package com.example.tailor_shop.modules.auth.repository;

import com.example.tailor_shop.modules.auth.domain.PasswordResetToken;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByOtpCodeAndUsedFalse(String otpCode);
    Optional<PasswordResetToken> findByUserAndOtpCodeAndUsedFalse(UserEntity user, String otpCode);
    void deleteByUser(UserEntity user);
    long countByUserAndCreatedAtAfter(UserEntity user, OffsetDateTime after);
}


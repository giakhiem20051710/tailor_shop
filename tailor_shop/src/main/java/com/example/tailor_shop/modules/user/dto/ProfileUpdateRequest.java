package com.example.tailor_shop.modules.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150)
        String name,

        @NotBlank(message = "Email is required")
        @Email
        @Size(max = 180)
        String email,

        @Size(max = 30)
        String phone,

        @Size(min = 6, max = 255, message = "Password must be at least 6 characters")
        String password
) {}

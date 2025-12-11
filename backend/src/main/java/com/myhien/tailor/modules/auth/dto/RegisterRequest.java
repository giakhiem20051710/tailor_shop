package com.myhien.tailor.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank
    @Size(min = 3, max = 100)
    String username,

    @NotBlank
    @Size(min = 6, max = 255)
    String password,

    @NotBlank
    @Size(max = 150)
    String name,

    @NotBlank
    @Email
    @Size(max = 180)
    String email,

    @Size(max = 30)
    String phone
) {}


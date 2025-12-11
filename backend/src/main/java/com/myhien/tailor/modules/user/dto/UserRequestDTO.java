package com.myhien.tailor.modules.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserRequestDTO(
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 100)
    String username,
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 255)
    String password,
    
    @NotBlank(message = "Name is required")
    @Size(max = 150)
    String name,
    
    @NotBlank(message = "Email is required")
    @Email
    @Size(max = 180)
    String email,
    
    @Size(max = 30)
    String phone,
    
    @NotNull(message = "Role ID is required")
    Long roleId
) {}


package com.example.tailor_shop.modules.user.dto;



import java.time.OffsetDateTime;


public record UserResponseDTO(
        Long id,
        String username,
        String name,
        String email,
        String phone,
        String status,
        Long roleId,
        String roleCode,
        String roleName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}


package com.myhien.tailor.modules.user.dto;

import com.myhien.tailor.modules.user.domain.UserEntity;
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


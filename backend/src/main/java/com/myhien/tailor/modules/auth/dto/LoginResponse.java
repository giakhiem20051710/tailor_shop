package com.myhien.tailor.modules.auth.dto;

public record LoginResponse(
    String accessToken,
    String tokenType,
    String username,
    String role
) {
    public static LoginResponse of(String token, String username, String role) {
        return new LoginResponse(token, "Bearer", username, role);
    }
}


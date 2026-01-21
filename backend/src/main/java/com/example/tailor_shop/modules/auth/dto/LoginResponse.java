package com.example.tailor_shop.modules.auth.dto;

/**
 * Response returned after successful login.
 * Contains both access and refresh tokens for secure session management.
 */
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresInMs;         // Access token expiration
    private long refreshExpiresInMs;  // Refresh token expiration

    public LoginResponse() {
    }

    public LoginResponse(String accessToken, long expiresInMs) {
        this.accessToken = accessToken;
        this.expiresInMs = expiresInMs;
    }

    public LoginResponse(String accessToken, String refreshToken, long expiresInMs, long refreshExpiresInMs) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresInMs = expiresInMs;
        this.refreshExpiresInMs = refreshExpiresInMs;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresInMs() {
        return expiresInMs;
    }

    public void setExpiresInMs(long expiresInMs) {
        this.expiresInMs = expiresInMs;
    }

    public long getRefreshExpiresInMs() {
        return refreshExpiresInMs;
    }

    public void setRefreshExpiresInMs(long refreshExpiresInMs) {
        this.refreshExpiresInMs = refreshExpiresInMs;
    }
}


package com.example.tailor_shop.modules.auth.dto;

public class LoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresInMs;

    public LoginResponse() {
    }

    public LoginResponse(String accessToken, long expiresInMs) {
        this.accessToken = accessToken;
        this.expiresInMs = expiresInMs;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
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
}


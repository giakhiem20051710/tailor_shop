package com.example.tailor_shop.config.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // ==== AUTH ====
    UNAUTHENTICATED(401, "You need to log in to perform this action.", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(403, "You do not have permission.", HttpStatus.FORBIDDEN),
    ACCESS_DENIED(403, "Access denied: you do not have permission to perform this action.", HttpStatus.FORBIDDEN),
    EXPIRED_TOKEN(401, "Token expired.", HttpStatus.UNAUTHORIZED),
    ACCOUNT_NOT_VERIFIED(403, "Account not verified by OTP.", HttpStatus.FORBIDDEN),
    INVALID_KEY(1001, "Uncategorized error.", HttpStatus.BAD_REQUEST),

    // ==== USER & ROLE ====
    USER_NOT_EXISTED(404, "User need KYC to use this feature.", HttpStatus.NOT_FOUND),
    USER_EXISTED(409, "User already existed.", HttpStatus.CONFLICT),
    ROLE_NOT_EXISTED(404, "Role not existed.", HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND(404, "Role not found.", HttpStatus.NOT_FOUND),

    USERNAME_EXISTS(409, "Username already exists", HttpStatus.CONFLICT),
    EMAIL_EXISTS(409, "Email already exists", HttpStatus.CONFLICT),
    USER_NOT_FOUND(404, "User not found", HttpStatus.NOT_FOUND),
    USER_DELETED(410, "User has been deleted", HttpStatus.GONE);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}



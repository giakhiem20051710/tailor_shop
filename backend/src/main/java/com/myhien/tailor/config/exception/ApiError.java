package com.myhien.tailor.config.exception;

import java.time.OffsetDateTime;
import java.util.Map;

public record ApiError(
    OffsetDateTime timestamp,
    String errorCode,
    String message,
    Map<String, String> fieldErrors
) {
    public ApiError(OffsetDateTime timestamp, String errorCode, String message) {
        this(timestamp, errorCode, message, null);
    }
    
    public ApiError(OffsetDateTime timestamp, String errorCode, Map<String, String> fieldErrors) {
        this(timestamp, errorCode, "Validation failed", fieldErrors);
    }
}


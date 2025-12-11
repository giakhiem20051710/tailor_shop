package com.myhien.tailor.common;

import java.time.OffsetDateTime;

public class ResponseUtil {
    
    public static <T> CommonResponse<T> success(String traceId, T data) {
        return CommonResponse.<T>builder()
                .requestTrace(traceId)
                .responseDateTime(OffsetDateTime.now())
                .responseStatus(CommonResponse.ResponseStatus.builder()
                        .responseCode("200")
                        .responseMessage("SUCCESS")
                        .build())
                .responseData(data)
                .build();
    }
    
    public static <T> CommonResponse<T> success(T data) {
        return success(null, data);
    }
    
    public static <T> CommonResponse<T> error(String traceId, String code, String message) {
        return CommonResponse.<T>builder()
                .requestTrace(traceId)
                .responseDateTime(OffsetDateTime.now())
                .responseStatus(CommonResponse.ResponseStatus.builder()
                        .responseCode(code)
                        .responseMessage(message)
                        .build())
                .responseData(null)
                .build();
    }
    
    public static <T> CommonResponse<T> error(String code, String message) {
        return error(null, code, message);
    }
}


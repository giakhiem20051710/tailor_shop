package com.example.tailor_shop.common;

import java.time.OffsetDateTime;

public class ResponseUtil {

    public static <T> CommonResponse<T> success(String traceId, T data) {
        CommonResponse<T> res = new CommonResponse<>();
        res.setRequestTrace(traceId);
        res.setResponseDateTime(OffsetDateTime.now());
        res.setResponseStatus(new CommonResponse.ResponseStatus("200", "SUCCESS"));
        res.setResponseData(data);
        return res;
    }

    public static <T> CommonResponse<T> error(String traceId, String code, String message) {
        CommonResponse<T> res = new CommonResponse<>();
        res.setRequestTrace(traceId);
        res.setResponseDateTime(OffsetDateTime.now());
        res.setResponseStatus(new CommonResponse.ResponseStatus(code, message));
        res.setResponseData(null);
        return res;
    }
}

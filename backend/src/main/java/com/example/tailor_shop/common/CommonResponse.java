package com.example.tailor_shop.common;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.OffsetDateTime;

public class CommonResponse<T> {

    private String requestTrace;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime responseDateTime;

    private ResponseStatus responseStatus;

    private T responseData;

    public CommonResponse() {
    }

    public CommonResponse(String requestTrace, OffsetDateTime responseDateTime, ResponseStatus responseStatus, T responseData) {
        this.requestTrace = requestTrace;
        this.responseDateTime = responseDateTime;
        this.responseStatus = responseStatus;
        this.responseData = responseData;
    }

    public String getRequestTrace() {
        return requestTrace;
    }

    public void setRequestTrace(String requestTrace) {
        this.requestTrace = requestTrace;
    }

    public OffsetDateTime getResponseDateTime() {
        return responseDateTime;
    }

    public void setResponseDateTime(OffsetDateTime responseDateTime) {
        this.responseDateTime = responseDateTime;
    }

    public ResponseStatus getResponseStatus() {
        return responseStatus;
    }

    public void setResponseStatus(ResponseStatus responseStatus) {
        this.responseStatus = responseStatus;
    }

    public T getResponseData() {
        return responseData;
    }

    public void setResponseData(T responseData) {
        this.responseData = responseData;
    }

    public static class ResponseStatus {
        private String responseCode;
        private String responseMessage;

        public ResponseStatus() {
        }

        public ResponseStatus(String responseCode, String responseMessage) {
            this.responseCode = responseCode;
            this.responseMessage = responseMessage;
        }

        public String getResponseCode() {
            return responseCode;
        }

        public void setResponseCode(String responseCode) {
            this.responseCode = responseCode;
        }

        public String getResponseMessage() {
            return responseMessage;
        }

        public void setResponseMessage(String responseMessage) {
            this.responseMessage = responseMessage;
        }
    }
}

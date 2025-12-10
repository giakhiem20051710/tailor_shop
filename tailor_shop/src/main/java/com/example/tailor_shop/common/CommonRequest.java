package com.example.tailor_shop.common;

public class CommonRequest<T> {
    private String requestTrace;
    private String requestDateTime;
    private T requestParameters;

    public CommonRequest() {}

    public CommonRequest(String requestTrace, String requestDateTime, T requestParameters) {
        this.requestTrace = requestTrace;
        this.requestDateTime = requestDateTime;
        this.requestParameters = requestParameters;
    }

    public String getRequestTrace() {
        return requestTrace;
    }

    public void setRequestTrace(String requestTrace) {
        this.requestTrace = requestTrace;
    }

    public String getRequestDateTime() {
        return requestDateTime;
    }

    public void setRequestDateTime(String requestDateTime) {
        this.requestDateTime = requestDateTime;
    }

    public T getRequestParameters() {
        return requestParameters;
    }

    public void setRequestParameters(T requestParameters) {
        this.requestParameters = requestParameters;
    }
}

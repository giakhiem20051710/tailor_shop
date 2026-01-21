package com.example.tailor_shop.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

public class TraceIdUtil {

    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String TRACE_ID_ATTRIBUTE = "traceId";

    public static String getOrCreateTraceId() {
        ServletRequestAttributes attributes =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String traceId = (String) request.getAttribute(TRACE_ID_ATTRIBUTE);
            if (traceId != null) return traceId;

            traceId = request.getHeader(TRACE_ID_HEADER);
            if (traceId != null && !traceId.isBlank()) {
                request.setAttribute(TRACE_ID_ATTRIBUTE, traceId);
                return traceId;
            }

            traceId = UUID.randomUUID().toString();
            request.setAttribute(TRACE_ID_ATTRIBUTE, traceId);
            return traceId;
        }

        return UUID.randomUUID().toString();
    }

    public static String getTraceId() {
        ServletRequestAttributes attributes =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String traceId = (String) request.getAttribute(TRACE_ID_ATTRIBUTE);
            return traceId != null ? traceId : getOrCreateTraceId();
        }
        return null;
    }
}

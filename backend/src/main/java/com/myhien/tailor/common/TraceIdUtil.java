package com.myhien.tailor.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

public class TraceIdUtil {
    
    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String TRACE_ID_ATTRIBUTE = "traceId";
    
    /**
     * Lấy hoặc tạo trace ID từ request header hoặc generate mới
     */
    public static String getOrCreateTraceId() {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            
            // Kiểm tra trong request attribute trước
            String traceId = (String) request.getAttribute(TRACE_ID_ATTRIBUTE);
            if (traceId != null) {
                return traceId;
            }
            
            // Kiểm tra trong header
            traceId = request.getHeader(TRACE_ID_HEADER);
            if (traceId != null && !traceId.isBlank()) {
                request.setAttribute(TRACE_ID_ATTRIBUTE, traceId);
                return traceId;
            }
            
            // Generate mới và lưu vào attribute
            traceId = UUID.randomUUID().toString();
            request.setAttribute(TRACE_ID_ATTRIBUTE, traceId);
            return traceId;
        }
        
        // Fallback: generate mới nếu không có request context
        return UUID.randomUUID().toString();
    }
    
    /**
     * Lấy trace ID từ request attribute (nếu đã được set)
     */
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


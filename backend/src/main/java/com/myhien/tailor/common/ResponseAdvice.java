package com.myhien.tailor.common;

import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * Tự động wrap response thành CommonResponse format
 * Chỉ áp dụng cho các controller trong package com.myhien.tailor.modules
 */
@RestControllerAdvice(basePackages = "com.myhien.tailor.modules")
public class ResponseAdvice implements ResponseBodyAdvice<Object> {
    
    @Override
    public boolean supports(
        MethodParameter returnType,
        Class<? extends HttpMessageConverter<?>> converterType
    ) {
        // Chỉ wrap nếu return type không phải CommonResponse
        return !CommonResponse.class.isAssignableFrom(returnType.getParameterType());
    }
    
    @Override
    public Object beforeBodyWrite(
        Object body,
        MethodParameter returnType,
        MediaType selectedContentType,
        Class<? extends HttpMessageConverter<?>> selectedConverterType,
        ServerHttpRequest request,
        ServerHttpResponse response
    ) {
        // Nếu body đã là CommonResponse thì không wrap nữa
        if (body instanceof CommonResponse) {
            return body;
        }
        
        // Lấy trace ID từ header hoặc generate mới
        String traceId = request.getHeaders().getFirst("X-Trace-Id");
        if (traceId == null || traceId.isBlank()) {
            // Fallback: try to get from request context, otherwise use null
            try {
                traceId = TraceIdUtil.getTraceId();
            } catch (Exception e) {
                traceId = null;
            }
        }
        
        return ResponseUtil.success(traceId, body);
    }
}


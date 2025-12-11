package com.myhien.tailor.config.exception;

import com.myhien.tailor.common.CommonResponse;
import com.myhien.tailor.common.ResponseUtil;
import com.myhien.tailor.common.TraceIdUtil;
import jakarta.validation.ConstraintDefinitionException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 400 - Bad Request (custom)
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<CommonResponse<Object>> handleBadRequest(BadRequestException ex) {
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, "400", ex.getMessage()));
    }

    // 400 - Business Exception
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<CommonResponse<Object>> handleBusinessException(BusinessException ex) {
        String traceId = TraceIdUtil.getOrCreateTraceId();
        ErrorCode ec = ex.getErrorCode();
        HttpStatus status = ec != null ? ec.getHttpStatus() : HttpStatus.BAD_REQUEST;
        String code = ec != null ? String.valueOf(ec.getCode()) : String.valueOf(HttpStatus.BAD_REQUEST.value());
        String message = ex.getMessage() != null ? ex.getMessage() : (ec != null ? ec.getMessage() : "Business error");
        return ResponseEntity.status(status)
                .body(ResponseUtil.error(traceId, code, message));
    }

    // 401 - Unauthorized (custom)
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<CommonResponse<Object>> handleUnauthorized(UnauthorizedException ex) {
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ResponseUtil.error(traceId, "401", ex.getMessage()));
    }

    // 401 - Bad Credentials
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<CommonResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
        log.error("Bad credentials", ex);
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, "400", ex.getMessage() != null ? ex.getMessage() : "Invalid credentials"));
    }

    // 403 - Forbidden (Spring Security)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<CommonResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ResponseUtil.error(traceId, "403", "This role is Forbidden for this feature"));
    }

    // 404 - Not Found (custom)
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<CommonResponse<Object>> handleNotFound(NotFoundException ex) {
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ResponseUtil.error(traceId, "404", ex.getMessage()));
    }

    // 404 - Resource Not Found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<CommonResponse<Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        log.error("Resource not found", ex);
        String traceId = TraceIdUtil.getOrCreateTraceId();
        String errorMsg = ex.getMessage() != null ? ex.getMessage() : "Resource not found";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, "404", errorMsg));
    }

    // AppException -> dùng ErrorCode trong dự án
    @ExceptionHandler(AppException.class)
    public ResponseEntity<CommonResponse<Object>> handleAppException(AppException ex) {
        AppException.ErrorCode ec = ex.getErrorCode();
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(ec.getStatusCode())
                .body(ResponseUtil.error(traceId, String.valueOf(ec.getCode()), ec.getMessage()));
    }

    // 400 - Validation (DTO @Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<CommonResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().isEmpty()
                ? "Validation error"
                : ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, "400", msg));
    }

    // 400 - Constraint (@Validated trên params)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<CommonResponse<Object>> handleConstraint(ConstraintViolationException ex) {
        String msg = ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining("; "));
        
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, "400", msg.isEmpty() ? "Constraint violation" : msg));
    }

    // 400 - Handler Method Validation
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<CommonResponse<Object>> handleHandlerMethodValidationException(HandlerMethodValidationException ex) {
        log.error("Validation error at handler method: {}", ex.getMessage());
        
        // Trích xuất chi tiết lỗi validation từ HandlerMethodValidationException
        String detailedMessage = ex.getAllValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream())
                .map(error -> {
                    // Cố gắng lấy thông tin FieldError để có tên trường và message cụ thể
                    if (error instanceof FieldError fieldError) {
                        // Loại bỏ tiền tố không cần thiết (thường là tên parameter + "data.")
                        String fieldName = fieldError.getField();
                        if (fieldName.contains(".")) {
                            fieldName = fieldName.substring(fieldName.lastIndexOf('.') + 1);
                        }
                        return fieldName + ": " + fieldError.getDefaultMessage();
                    }
                    // Nếu không phải FieldError, lấy message mặc định
                    return error.getDefaultMessage();
                })
                .collect(Collectors.joining("; "));
        
        // Fallback nếu không trích xuất được message chi tiết
        if (detailedMessage.isBlank()) {
            detailedMessage = "Validation failure";
        }
        
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, String.valueOf(HttpStatus.BAD_REQUEST.value()), detailedMessage));
    }

    // 400 - Sai kiểu tham số
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<CommonResponse<Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String msg = "Parameter '" + ex.getName() + "' must be of type " +
                (ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "expected type");
        
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, "400", msg));
    }

    // 400 - JSON lỗi
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<CommonResponse<Object>> handleNotReadable(HttpMessageNotReadableException ex) {
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, "400", "Malformed JSON request"));
    }

    // 400 - Constraint Definition Exception
    @ExceptionHandler(ConstraintDefinitionException.class)
    public ResponseEntity<CommonResponse<Object>> handleConstraintDefinition(ConstraintDefinitionException ex) {
        log.error("Constraint definition error", ex);
        String traceId = TraceIdUtil.getOrCreateTraceId();
        String errorMsg = ex.getMessage() != null ? ex.getMessage() : "Constraint definition error";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, "400", errorMsg));
    }

    // 400 - Data Integrity Violation
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<CommonResponse<Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation", ex);
        String traceId = TraceIdUtil.getOrCreateTraceId();
        String errorMsg = ex.getMessage() != null ? ex.getMessage() : "Data integrity violation";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseUtil.error(traceId, "400", errorMsg));
    }

    // 400 - CSV Batch Exception
    @ExceptionHandler(CsvBatchException.class)
    public ResponseEntity<CommonResponse<Map<String, Object>>> handleCsvBatchException(CsvBatchException ex) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("total", ex.getErrors().size());
        response.put("success", 0);
        response.put("failed", ex.getErrors().size());
        response.put("results", ex.getErrors());
        
        String traceId = TraceIdUtil.getOrCreateTraceId();
        CommonResponse<Map<String, Object>> commonResponse = ResponseUtil.error(
            traceId,
            "400",
            "CSV batch processing failed"
        );
        commonResponse.setResponseData(response);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(commonResponse);
    }

    // 500 - Fallback
    @ExceptionHandler(Exception.class)
    public ResponseEntity<CommonResponse<Object>> handleOther(Exception ex) {
        log.error("Unhandled error", ex);
        String traceId = TraceIdUtil.getOrCreateTraceId();
        String errorMsg = ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseUtil.error(traceId, "500", errorMsg));
    }
}

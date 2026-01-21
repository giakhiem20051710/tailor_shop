package com.example.tailor_shop.modules.product.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.modules.product.dto.TrendAnalysisResponse;
import com.example.tailor_shop.modules.product.service.TrendAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller cho phân tích xu hướng thời trang
 * Cung cấp API để frontend lấy dữ liệu trend analysis
 */
@RestController
@RequestMapping("/api/trends")
@RequiredArgsConstructor
@Slf4j
public class TrendAnalysisController {

    private final TrendAnalysisService trendAnalysisService;

    /**
     * Lấy phân tích xu hướng theo khoảng thời gian
     * 
     * @param period Khoảng thời gian: week, month, quarter, year (default: month)
     * @return Kết quả phân tích xu hướng bao gồm trends và AI insights
     */
    @GetMapping("/analysis")
    public ResponseEntity<CommonResponse<TrendAnalysisResponse>> analyzeTrends(
            @RequestParam(defaultValue = "month") String period) {

        String traceId = TraceIdUtil.getOrCreateTraceId();
        log.info("[TraceId: {}] 📊 Trend analysis request for period: {}", traceId, period);

        try {
            TrendAnalysisResponse response = trendAnalysisService.analyzeTrends(period);
            return ResponseEntity.ok(ResponseUtil.success(traceId, response));
        } catch (Exception e) {
            log.error("[TraceId: {}] ❌ Error analyzing trends: {}", traceId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ResponseUtil.error(traceId, "500",
                            "Không thể phân tích xu hướng: " + e.getMessage()));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<CommonResponse<String>> health() {
        String traceId = TraceIdUtil.getOrCreateTraceId();
        return ResponseEntity.ok(ResponseUtil.success(traceId, "Trend Analysis Service is running"));
    }
}

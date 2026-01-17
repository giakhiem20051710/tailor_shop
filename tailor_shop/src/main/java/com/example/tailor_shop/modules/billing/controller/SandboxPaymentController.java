package com.example.tailor_shop.modules.billing.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.modules.billing.dto.PaymentCallbackRequest;
import com.example.tailor_shop.modules.billing.dto.PaymentResponse;
import com.example.tailor_shop.modules.billing.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Sandbox Payment Gateway Controller
 * Provides a mock payment page for testing payment flows without real payment
 * providers
 */
@RestController
@RequestMapping("/api/v1/sandbox/payment")
@RequiredArgsConstructor
@Slf4j
public class SandboxPaymentController {

    private final InvoiceService invoiceService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Mock Payment Page - Returns HTML UI for user to simulate payment
     */
    @GetMapping(value = "/pay", produces = MediaType.TEXT_HTML_VALUE)
    public String showPaymentPage(
            @RequestParam String ref,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String returnUrl) {
        log.info("[Sandbox] Showing payment page for ref={}, amount={}", ref, amount);

        String callbackUrl = "/api/v1/sandbox/payment/process";
        String safeReturnUrl = returnUrl != null ? returnUrl : frontendUrl + "/payment/result";

        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sandbox Payment Gateway</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body {
                            font-family: 'Segoe UI', system-ui, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 20px;
                        }
                        .container {
                            background: white;
                            border-radius: 24px;
                            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                            padding: 40px;
                            max-width: 450px;
                            width: 100%%;
                            text-align: center;
                        }
                        .logo {
                            font-size: 48px;
                            margin-bottom: 16px;
                        }
                        h1 {
                            color: #1a1a2e;
                            font-size: 24px;
                            margin-bottom: 8px;
                        }
                        .subtitle {
                            color: #6b7280;
                            font-size: 14px;
                            margin-bottom: 32px;
                        }
                        .amount-box {
                            background: #f8fafc;
                            border: 2px solid #e2e8f0;
                            border-radius: 16px;
                            padding: 24px;
                            margin-bottom: 32px;
                        }
                        .amount-label { color: #64748b; font-size: 14px; }
                        .amount-value {
                            color: #0f172a;
                            font-size: 36px;
                            font-weight: 700;
                            margin-top: 8px;
                        }
                        .ref { color: #94a3b8; font-size: 12px; margin-top: 12px; }
                        .buttons { display: flex; gap: 12px; flex-direction: column; }
                        .btn {
                            padding: 16px 24px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            transition: all 0.2s;
                        }
                        .btn-success {
                            background: linear-gradient(135deg, #22c55e 0%%, #16a34a 100%%);
                            color: white;
                        }
                        .btn-success:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(34,197,94,0.3); }
                        .btn-fail {
                            background: #fee2e2;
                            color: #dc2626;
                        }
                        .btn-fail:hover { background: #fecaca; }
                        .warning {
                            margin-top: 24px;
                            padding: 12px;
                            background: #fef3c7;
                            border-radius: 8px;
                            color: #92400e;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">🧪</div>
                        <h1>Sandbox Payment Gateway</h1>
                        <p class="subtitle">Môi trường test - Không có giao dịch thật</p>

                        <div class="amount-box">
                            <div class="amount-label">Số tiền thanh toán</div>
                            <div class="amount-value">%s ₫</div>
                            <div class="ref">Mã giao dịch: %s</div>
                        </div>

                        <div class="buttons">
                            <form action="%s" method="POST" style="display:contents;">
                                <input type="hidden" name="providerRef" value="%s"/>
                                <input type="hidden" name="success" value="true"/>
                                <input type="hidden" name="returnUrl" value="%s"/>
                                <button type="submit" class="btn btn-success">✓ Thanh toán thành công</button>
                            </form>
                            <form action="%s" method="POST" style="display:contents;">
                                <input type="hidden" name="providerRef" value="%s"/>
                                <input type="hidden" name="success" value="false"/>
                                <input type="hidden" name="returnUrl" value="%s"/>
                                <button type="submit" class="btn btn-fail">✕ Huỷ / Thất bại</button>
                            </form>
                        </div>

                        <div class="warning">
                            ⚠️ Đây là môi trường Sandbox. Không có tiền thật được giao dịch.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                formatCurrency(amount),
                ref,
                callbackUrl,
                ref,
                safeReturnUrl,
                callbackUrl,
                ref,
                safeReturnUrl);
    }

    /**
     * Process payment result from mock page
     */
    @PostMapping("/process")
    public ResponseEntity<String> processPayment(
            @RequestParam String providerRef,
            @RequestParam Boolean success,
            @RequestParam(required = false) String returnUrl) {
        log.info("[Sandbox] Processing payment: ref={}, success={}", providerRef, success);

        try {
            // Call backend callback to update invoice status
            PaymentCallbackRequest callbackRequest = PaymentCallbackRequest.builder()
                    .providerRef(providerRef)
                    .success(success)
                    .rawPayload("sandbox_result=" + (success ? "success" : "failed"))
                    .build();

            PaymentResponse response = invoiceService.handleCallback(callbackRequest);
            log.info("[Sandbox] Payment processed: invoiceId={}, status={}",
                    response.getInvoiceId(), response.getStatus());

            // Redirect to frontend result page
            String redirectUrl = buildRedirectUrl(returnUrl, providerRef, success, response.getInvoiceId());

            return ResponseEntity.status(302)
                    .header("Location", redirectUrl)
                    .body("Redirecting...");

        } catch (Exception e) {
            log.error("[Sandbox] Payment processing failed: {}", e.getMessage(), e);
            String errorUrl = (returnUrl != null ? returnUrl : frontendUrl + "/payment/result")
                    + "?status=error&message=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            return ResponseEntity.status(302)
                    .header("Location", errorUrl)
                    .body("Redirecting...");
        }
    }

    /**
     * Direct API callback (for programmatic testing)
     */
    @PostMapping("/callback")
    public ResponseEntity<CommonResponse<PaymentResponse>> handleCallback(
            @RequestBody PaymentCallbackRequest request) {
        log.info("[Sandbox] API Callback: ref={}, success={}", request.getProviderRef(), request.getSuccess());
        PaymentResponse response = invoiceService.handleCallback(request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), response));
    }

    private String formatCurrency(BigDecimal amount) {
        return String.format("%,.0f", amount);
    }

    private String buildRedirectUrl(String returnUrl, String ref, boolean success, Long invoiceId) {
        String base = returnUrl != null ? returnUrl : frontendUrl + "/payment/result";
        String separator = base.contains("?") ? "&" : "?";
        return base + separator + "status=" + (success ? "success" : "failed")
                + "&ref=" + ref
                + "&invoiceId=" + invoiceId;
    }
}

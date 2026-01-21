package com.example.tailor_shop.modules.billing.service;

import com.example.tailor_shop.modules.billing.dto.InvoiceFilterRequest;
import com.example.tailor_shop.modules.billing.dto.InvoiceRequest;
import com.example.tailor_shop.modules.billing.dto.InvoiceResponse;
import com.example.tailor_shop.modules.billing.dto.PaymentCallbackRequest;
import com.example.tailor_shop.modules.billing.dto.PaymentRequest;
import com.example.tailor_shop.modules.billing.dto.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InvoiceService {

    Page<InvoiceResponse> list(InvoiceFilterRequest filter, Pageable pageable);

    InvoiceResponse detail(Long id, Long currentUserId, boolean isCustomer);

    InvoiceResponse create(InvoiceRequest request, Long currentUserId);

    PaymentResponse addPayment(PaymentRequest request, Long currentUserId);

    PaymentResponse handleCallback(PaymentCallbackRequest request);

    void voidInvoice(Long id, Long currentUserId);
}



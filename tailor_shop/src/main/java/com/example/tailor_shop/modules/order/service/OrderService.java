package com.example.tailor_shop.modules.order.service;

import com.example.tailor_shop.modules.order.domain.OrderStatus;
import com.example.tailor_shop.modules.order.dto.OrderResquest;
import com.example.tailor_shop.modules.order.dto.OrderResponse;
import com.example.tailor_shop.modules.order.dto.OrderWizardRequest;
import com.example.tailor_shop.modules.order.dto.UpdateOrderStatusRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

public interface OrderService {
    Page<OrderResponse> list(
            OrderStatus status,
            Long customerId,
            Long tailorId,
            Instant fromDate,
            Instant toDate,
            java.time.LocalDate appointmentDate,
            java.time.LocalDate dueDate,
            String search,
            Pageable pageable
    );

    OrderResponse detail(Long id);

    OrderResponse create(OrderResquest request, java.util.List<org.springframework.web.multipart.MultipartFile> files);

    OrderResponse updateStatus(Long id, UpdateOrderStatusRequest request);

    OrderResponse tracking(Long id, Long currentUserId, boolean isCustomer);

    OrderResponse uploadAttachment(Long id, org.springframework.web.multipart.MultipartFile file, Long currentUserId);

    OrderResponse createWizard(OrderWizardRequest request);
}

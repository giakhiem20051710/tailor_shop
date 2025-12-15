package com.example.tailor_shop.modules.fabric.service.impl;

import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.billing.domain.InvoiceEntity;
import com.example.tailor_shop.modules.billing.domain.InvoiceStatus;
import com.example.tailor_shop.modules.billing.dto.InvoiceRequest;
import com.example.tailor_shop.modules.billing.dto.InvoiceResponse;
import com.example.tailor_shop.modules.billing.dto.PaymentRequest;
import com.example.tailor_shop.modules.billing.dto.PaymentResponse;
import com.example.tailor_shop.modules.billing.repository.InvoiceItemRepository;
import com.example.tailor_shop.modules.billing.repository.InvoiceRepository;
import com.example.tailor_shop.modules.billing.service.InvoiceService;
import com.example.tailor_shop.modules.fabric.domain.*;
import com.example.tailor_shop.modules.fabric.dto.*;
import com.example.tailor_shop.modules.cart.domain.CartItemEntity;
import com.example.tailor_shop.modules.cart.domain.CartItemType;
import com.example.tailor_shop.modules.cart.repository.CartItemRepository;
import com.example.tailor_shop.modules.fabric.repository.FabricInventoryRepository;
import com.example.tailor_shop.modules.fabric.repository.FabricOrderRepository;
import com.example.tailor_shop.modules.fabric.repository.FabricRepository;
import com.example.tailor_shop.modules.fabric.service.FabricOrderService;
import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeRequest;
import com.example.tailor_shop.modules.promotion.dto.ApplyPromoCodeResponse;
import com.example.tailor_shop.modules.promotion.service.PromotionService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Fabric Order Service Implementation - Giống FPT Shop
 * Flow: Cart -> Checkout -> Order -> Invoice -> Payment
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FabricOrderServiceImpl implements FabricOrderService {

    private final CartItemRepository cartItemRepository; // From Cart module (only for checkout)
    private final FabricOrderRepository fabricOrderRepository;
    private final FabricRepository fabricRepository;
    private final FabricInventoryRepository fabricInventoryRepository;
    private final UserRepository userRepository;
    private final PromotionService promotionService;
    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;

    // ========== CHECKOUT & ORDER ==========
    // Note: Cart operations đã được tách ra CartService (module riêng)
    // Sử dụng CartService để quản lý giỏ hàng

    @Override
    @Transactional
    public FabricOrderResponse checkout(CheckoutRequest request, Long userId) {
        UserEntity customer = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Get cart items
        List<CartItemEntity> cartItems = cartItemRepository.findAllById(request.getCartItemIds());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("No items selected for checkout");
        }

        // Verify ownership
        cartItems.forEach(item -> {
            if (!item.getUser().getId().equals(userId)) {
                throw new BadRequestException("Cart item does not belong to user");
            }
        });

        // Calculate subtotal and validate availability
        BigDecimal subtotal = BigDecimal.ZERO;
        List<FabricOrderItemEntity> orderItems = new ArrayList<>();

        for (CartItemEntity cartItem : cartItems) {
            // Get fabric from itemId (since CartItemEntity is now generic)
            FabricEntity fabric = fabricRepository.findById(cartItem.getItemId())
                    .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                    .orElseThrow(() -> new NotFoundException("Fabric not found for cart item: " + cartItem.getId()));
            if (!Boolean.TRUE.equals(fabric.getIsAvailable())) {
                throw new BadRequestException("Fabric " + fabric.getCode() + " is not available");
            }

            BigDecimal availableQuantity = fabricInventoryRepository
                    .sumAvailableQuantityByFabricId(fabric.getId());
            if (availableQuantity == null) {
                availableQuantity = BigDecimal.ZERO;
            }
            if (cartItem.getQuantity().compareTo(availableQuantity) > 0) {
                throw new BadRequestException(
                        String.format("Insufficient quantity for fabric %s. Available: %s",
                                fabric.getCode(), availableQuantity)
                );
            }

            BigDecimal itemSubtotal = fabric.getPricePerMeter().multiply(cartItem.getQuantity());
            subtotal = subtotal.add(itemSubtotal);

            FabricOrderItemEntity orderItem = FabricOrderItemEntity.builder()
                    .fabric(fabric)
                    .fabricName(fabric.getName())
                    .fabricCode(fabric.getCode())
                    .quantity(cartItem.getQuantity())
                    .pricePerMeter(fabric.getPricePerMeter())
                    .subtotal(itemSubtotal)
                    .discountAmount(BigDecimal.ZERO)
                    .total(itemSubtotal)
                    .isDeleted(false)
                    .build();
            orderItems.add(orderItem);
        }

        // Apply promotion if provided
        BigDecimal discountAmount = BigDecimal.ZERO;
        Long promotionId = null;
        String promotionCode = null;

        if (request.getPromoCode() != null && !request.getPromoCode().trim().isEmpty()) {
            List<Long> productIds = orderItems.stream()
                    .map(item -> item.getFabric().getId())
                    .collect(Collectors.toList());

            ApplyPromoCodeRequest promoRequest = ApplyPromoCodeRequest.builder()
                    .code(request.getPromoCode().trim().toUpperCase())
                    .orderAmount(subtotal)
                    .productIds(productIds)
                    .build();

            try {
                ApplyPromoCodeResponse promoResponse = promotionService.applyPromoCode(promoRequest, userId);
                discountAmount = promoResponse.getDiscountAmount();
                promotionId = promoResponse.getPromotionId();
                promotionCode = promoResponse.getCode();

                // Apply discount proportionally to items
                if (discountAmount.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal discountRatio = discountAmount.divide(subtotal, 4, java.math.RoundingMode.HALF_UP);
                    for (FabricOrderItemEntity item : orderItems) {
                        BigDecimal itemDiscount = item.getSubtotal().multiply(discountRatio);
                        item.setDiscountAmount(itemDiscount);
                        item.setTotal(item.getSubtotal().subtract(itemDiscount));
                    }
                }
            } catch (Exception e) {
                log.warn("[TraceId: {}] Failed to apply promo code {}: {}",
                        TraceIdUtil.getTraceId(), request.getPromoCode(), e.getMessage());
                // Continue without promotion
            }
        }

        // Calculate totals
        BigDecimal taxAmount = BigDecimal.ZERO; // Can be configured
        BigDecimal shippingFee = calculateShippingFee(subtotal, request.getPaymentMethod());
        BigDecimal total = subtotal.subtract(discountAmount).add(taxAmount).add(shippingFee);

        // Create order
        String orderCode = generateOrderCode();
        FabricOrderEntity order = FabricOrderEntity.builder()
                .code(orderCode)
                .customer(customer)
                .status(FabricOrderStatus.PENDING)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .taxAmount(taxAmount)
                .shippingFee(shippingFee)
                .total(total)
                .promotionCode(promotionCode)
                .shippingAddress(request.getShippingAddress())
                .shippingPhone(request.getShippingPhone())
                .shippingName(request.getShippingName())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(com.example.tailor_shop.modules.fabric.domain.PaymentStatus.PENDING)
                .notes(request.getNotes())
                .isDeleted(false)
                .items(orderItems)
                .build();

        // Set order reference in items
        for (FabricOrderItemEntity item : orderItems) {
            item.setOrder(order);
        }

        // Set promotion if applied
        if (promotionId != null) {
            // Load promotion entity if needed
            // order.setPromotion(promotionRepository.findById(promotionId).orElse(null));
        }

        order = fabricOrderRepository.save(order);

        // Create invoice using InvoiceService
        InvoiceRequest invoiceRequest = InvoiceRequest.builder()
                .customerId(customer.getId())
                .staffId(customer.getId()) // Use customer as staff for now, or find staff
                .currency("VND")
                .discountAmount(order.getDiscountAmount())
                .taxAmount(order.getTaxAmount())
                .notes("Invoice for fabric order: " + order.getCode())
                .items(order.getItems().stream()
                        .map(item -> InvoiceRequest.ItemRequest.builder()
                                .name(item.getFabricName() + " (" + item.getFabricCode() + ")")
                                .quantity(item.getQuantity().intValue())
                                .unitPrice(item.getPricePerMeter())
                                .discountAmount(item.getDiscountAmount())
                                .taxRate(BigDecimal.ZERO)
                                .build())
                        .collect(Collectors.toList()))
                .build();

        InvoiceResponse invoiceResponse = invoiceService.create(invoiceRequest, customer.getId());
        InvoiceEntity invoice = invoiceRepository.findById(invoiceResponse.getId())
                .orElseThrow(() -> new NotFoundException("Invoice not found after creation"));
        order.setInvoice(invoice);
        order = fabricOrderRepository.save(order);

        // Clear cart items (only FABRIC items that were checked out)
        cartItemRepository.deleteByUserIdAndIds(userId, request.getCartItemIds());

        log.info("[TraceId: {}] Order created: code={}, total={}, userId={}",
                TraceIdUtil.getTraceId(), orderCode, total, userId);

        return toOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public FabricOrderResponse getOrderDetail(Long orderId, Long userId) {
        FabricOrderEntity order = fabricOrderRepository.findById(orderId)
                .filter(o -> Boolean.FALSE.equals(o.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Check ownership for customer
        if (!order.getCustomer().getId().equals(userId)) {
            throw new BadRequestException("Access denied");
        }

        return toOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FabricOrderResponse> listMyOrders(Long userId, Pageable pageable) {
        Page<FabricOrderEntity> page = fabricOrderRepository.findByCustomerIdAndIsDeletedFalse(userId, pageable);
        return page.map(this::toOrderResponse);
    }

    @Override
    @Transactional
    public void cancelOrder(Long orderId, Long userId) {
        FabricOrderEntity order = fabricOrderRepository.findById(orderId)
                .filter(o -> Boolean.FALSE.equals(o.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (!order.getCustomer().getId().equals(userId)) {
            throw new BadRequestException("Access denied");
        }

        if (order.getStatus() != FabricOrderStatus.PENDING && order.getStatus() != FabricOrderStatus.CONFIRMED) {
            throw new BadRequestException("Cannot cancel order in status: " + order.getStatus());
        }

        if (order.getPaymentStatus() == com.example.tailor_shop.modules.fabric.domain.PaymentStatus.PAID) {
            throw new BadRequestException("Cannot cancel paid order. Please request refund.");
        }

        order.setStatus(FabricOrderStatus.CANCELLED);
        fabricOrderRepository.save(order);

        log.info("[TraceId: {}] Order cancelled: code={}, userId={}",
                TraceIdUtil.getTraceId(), order.getCode(), userId);
    }

    // ========== PRIVATE HELPERS ==========
    // Note: Cart item conversion đã được xử lý trong CartService

    private FabricOrderResponse toOrderResponse(FabricOrderEntity entity) {
        List<FabricOrderItemResponse> itemResponses = entity.getItems().stream()
                .map(item -> FabricOrderItemResponse.builder()
                        .id(item.getId())
                        .fabricId(item.getFabric().getId())
                        .fabricName(item.getFabricName())
                        .fabricCode(item.getFabricCode())
                        .quantity(item.getQuantity())
                        .pricePerMeter(item.getPricePerMeter())
                        .subtotal(item.getSubtotal())
                        .discountAmount(item.getDiscountAmount())
                        .total(item.getTotal())
                        .build())
                .collect(Collectors.toList());

        return FabricOrderResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .customerId(entity.getCustomer().getId())
                .customerName(entity.getCustomer().getName())
                .status(entity.getStatus())
                .subtotal(entity.getSubtotal())
                .discountAmount(entity.getDiscountAmount())
                .taxAmount(entity.getTaxAmount())
                .shippingFee(entity.getShippingFee())
                .total(entity.getTotal())
                .promotionId(entity.getPromotion() != null ? entity.getPromotion().getId() : null)
                .promotionCode(entity.getPromotionCode())
                .shippingAddress(entity.getShippingAddress())
                .shippingPhone(entity.getShippingPhone())
                .shippingName(entity.getShippingName())
                .paymentMethod(entity.getPaymentMethod())
                .paymentStatus(entity.getPaymentStatus())
                .invoiceId(entity.getInvoice() != null ? entity.getInvoice().getId() : null)
                .invoiceCode(entity.getInvoice() != null ? entity.getInvoice().getCode() : null)
                .notes(entity.getNotes())
                .items(itemResponses)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }


    private BigDecimal calculateShippingFee(BigDecimal subtotal, PaymentMethod paymentMethod) {
        // Free shipping for orders over 500,000 VND
        if (subtotal.compareTo(new BigDecimal("500000")) >= 0) {
            return BigDecimal.ZERO;
        }
        // COD has higher shipping fee
        if (paymentMethod == PaymentMethod.COD) {
            return new BigDecimal("30000");
        }
        return new BigDecimal("20000");
    }

    private String generateOrderCode() {
        return "FAB-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    // ========== PAYMENT ==========

    @Override
    @Transactional
    public PaymentResponse processPayment(FabricPaymentRequest request, Long userId) {
        // Get order
        FabricOrderEntity order = fabricOrderRepository.findById(request.getOrderId())
                .filter(o -> Boolean.FALSE.equals(o.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Verify ownership
        if (!order.getCustomer().getId().equals(userId)) {
            throw new BadRequestException("Access denied");
        }

        // Verify order status
        if (order.getStatus() != FabricOrderStatus.PENDING && order.getStatus() != FabricOrderStatus.CONFIRMED) {
            throw new BadRequestException("Cannot pay for order in status: " + order.getStatus());
        }

        // Verify invoice exists
        if (order.getInvoice() == null) {
            throw new BadRequestException("Invoice not found for this order");
        }

        // Create payment request for InvoiceService
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .invoiceId(order.getInvoice().getId())
                .provider(request.getProvider())
                .amount(request.getAmount() != null ? request.getAmount() : order.getTotal())
                .callbackUrl(request.getCallbackUrl())
                .returnUrl(request.getReturnUrl())
                .extraData(request.getExtraData())
                .build();

        // Process payment via InvoiceService
        PaymentResponse paymentResponse = invoiceService.addPayment(paymentRequest, userId);

        // Update order payment status based on payment result
        com.example.tailor_shop.modules.billing.domain.PaymentStatus billingStatus = paymentResponse.getStatus();
        if (billingStatus == com.example.tailor_shop.modules.billing.domain.PaymentStatus.success) {
            order.setPaymentStatus(PaymentStatus.PAID);
            if (order.getStatus() == FabricOrderStatus.PENDING) {
                order.setStatus(FabricOrderStatus.CONFIRMED);
            }
        } else if (billingStatus == com.example.tailor_shop.modules.billing.domain.PaymentStatus.failed) {
            order.setPaymentStatus(PaymentStatus.FAILED);
        }

        fabricOrderRepository.save(order);

        log.info("[TraceId: {}] Payment processed for order {}: status={}, amount={}",
                TraceIdUtil.getTraceId(), order.getCode(), paymentResponse.getStatus(), paymentResponse.getAmount());

        return paymentResponse;
    }
}


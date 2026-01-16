package com.example.tailor_shop.modules.flashsale.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import com.example.tailor_shop.modules.fabric.repository.FabricRepository;
import com.example.tailor_shop.modules.flashsale.domain.*;
import com.example.tailor_shop.modules.flashsale.dto.*;
import com.example.tailor_shop.modules.flashsale.repository.*;
import com.example.tailor_shop.modules.flashsale.service.FlashSaleService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Flash Sale Service Implementation
 * Core feature: Purchase algorithm with pessimistic locking
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FlashSaleServiceImpl implements FlashSaleService {

    private final FlashSaleRepository flashSaleRepository;
    private final FlashSaleOrderRepository orderRepository;
    private final FlashSaleReservationRepository reservationRepository;
    private final FlashSaleUserStatsRepository userStatsRepository;
    private final FabricRepository fabricRepository;
    private final UserRepository userRepository;

    // Configuration
    private static final int RESERVATION_MINUTES = 10; // Thời gian giữ hàng
    private static final int PAYMENT_DEADLINE_MINUTES = 10; // Thời gian thanh toán

    // ==================== PUBLIC QUERIES ====================

    @Override
    public List<FlashSaleResponse> getActiveSales(Long userId) {
        OffsetDateTime now = OffsetDateTime.now();
        List<FlashSaleEntity> sales = flashSaleRepository.findActive(FlashSaleStatus.ACTIVE, now);
        return sales.stream()
                .map(sale -> toResponse(sale, userId))
                .collect(Collectors.toList());
    }

    @Override
    public List<FlashSaleResponse> getUpcomingSales(Long userId) {
        OffsetDateTime now = OffsetDateTime.now();
        List<FlashSaleEntity> sales = flashSaleRepository.findUpcoming(FlashSaleStatus.SCHEDULED, now);
        return sales.stream()
                .map(sale -> toResponse(sale, userId))
                .collect(Collectors.toList());
    }

    @Override
    public List<FlashSaleResponse> getFeaturedSales(Long userId) {
        OffsetDateTime now = OffsetDateTime.now();
        List<FlashSaleEntity> sales = flashSaleRepository.findFeatured(FlashSaleStatus.ACTIVE, now);
        return sales.stream()
                .map(sale -> toResponse(sale, userId))
                .collect(Collectors.toList());
    }

    @Override
    public FlashSaleResponse getDetail(Long id, Long userId) {
        FlashSaleEntity sale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Flash sale không tồn tại"));
        return toResponse(sale, userId);
    }

    // ==================== ADMIN OPERATIONS ====================

    @Override
    public Page<FlashSaleResponse> listAll(List<String> statuses, Pageable pageable) {
        List<FlashSaleStatus> statusList;
        if (statuses == null || statuses.isEmpty()) {
            statusList = Arrays.asList(FlashSaleStatus.values());
        } else {
            statusList = statuses.stream()
                    .map(FlashSaleStatus::valueOf)
                    .collect(Collectors.toList());
        }

        Page<FlashSaleEntity> page = flashSaleRepository.findByStatusIn(statusList, pageable);
        return page.map(sale -> toResponse(sale, null));
    }

    @Override
    @Transactional
    public FlashSaleResponse create(FlashSaleRequest request, Long createdBy) {
        // Validate
        FabricEntity fabric = fabricRepository.findById(request.getFabricId())
                .orElseThrow(() -> new NotFoundException("Vải không tồn tại"));

        UserEntity creator = userRepository.findById(createdBy)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));

        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        if (request.getFlashPrice().compareTo(fabric.getPricePerMeter()) >= 0) {
            throw new BadRequestException("Giá flash sale phải thấp hơn giá gốc");
        }

        // Build entity
        FlashSaleEntity sale = FlashSaleEntity.builder()
                .fabric(fabric)
                .fabricName(fabric.getName())
                .fabricImage(fabric.getImage())
                .name(request.getName())
                .description(request.getDescription())
                .originalPrice(fabric.getPricePerMeter())
                .flashPrice(request.getFlashPrice())
                .totalQuantity(request.getTotalQuantity())
                .maxPerUser(request.getMaxPerUser() != null ? request.getMaxPerUser() : new BigDecimal("5"))
                .minPurchase(request.getMinPurchase() != null ? request.getMinPurchase() : new BigDecimal("0.5"))
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false)
                .bannerImage(request.getBannerImage())
                .status(FlashSaleStatus.SCHEDULED)
                .createdBy(creator)
                .build();

        sale = flashSaleRepository.save(sale);
        log.info("Created flash sale: id={}, name={}", sale.getId(), sale.getName());

        return toResponse(sale, null);
    }

    @Override
    @Transactional
    public FlashSaleResponse update(Long id, FlashSaleRequest request, Long updatedBy) {
        FlashSaleEntity sale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Flash sale không tồn tại"));

        if (sale.getStatus() == FlashSaleStatus.ENDED ||
                sale.getStatus() == FlashSaleStatus.CANCELLED ||
                sale.getStatus() == FlashSaleStatus.SOLD_OUT) {
            throw new BadRequestException("Không thể cập nhật flash sale đã kết thúc");
        }

        UserEntity updater = userRepository.findById(updatedBy)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));

        // Update fields
        if (request.getName() != null)
            sale.setName(request.getName());
        if (request.getDescription() != null)
            sale.setDescription(request.getDescription());
        if (request.getFlashPrice() != null)
            sale.setFlashPrice(request.getFlashPrice());
        if (request.getTotalQuantity() != null) {
            if (request.getTotalQuantity().compareTo(sale.getSoldQuantity()) < 0) {
                throw new BadRequestException("Số lượng mới không thể nhỏ hơn số đã bán");
            }
            sale.setTotalQuantity(request.getTotalQuantity());
        }
        if (request.getMaxPerUser() != null)
            sale.setMaxPerUser(request.getMaxPerUser());
        if (request.getMinPurchase() != null)
            sale.setMinPurchase(request.getMinPurchase());
        if (request.getStartTime() != null && sale.getStatus() == FlashSaleStatus.SCHEDULED) {
            sale.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null)
            sale.setEndTime(request.getEndTime());
        if (request.getPriority() != null)
            sale.setPriority(request.getPriority());
        if (request.getIsFeatured() != null)
            sale.setIsFeatured(request.getIsFeatured());
        if (request.getBannerImage() != null)
            sale.setBannerImage(request.getBannerImage());

        sale.setUpdatedBy(updater);

        sale = flashSaleRepository.save(sale);
        log.info("Updated flash sale: id={}", sale.getId());

        return toResponse(sale, null);
    }

    @Override
    @Transactional
    public FlashSaleResponse cancel(Long id, Long updatedBy) {
        FlashSaleEntity sale = flashSaleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Flash sale không tồn tại"));

        if (sale.getStatus() == FlashSaleStatus.ENDED ||
                sale.getStatus() == FlashSaleStatus.CANCELLED) {
            throw new BadRequestException("Flash sale đã kết thúc hoặc bị hủy");
        }

        UserEntity updater = userRepository.findById(updatedBy)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));

        sale.setStatus(FlashSaleStatus.CANCELLED);
        sale.setUpdatedBy(updater);

        sale = flashSaleRepository.save(sale);
        log.info("Cancelled flash sale: id={}", sale.getId());

        return toResponse(sale, null);
    }

    // ==================== CUSTOMER PURCHASE - CORE ALGORITHM ====================

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public FlashSalePurchaseResult purchase(Long flashSaleId, FlashSalePurchaseRequest request, Long userId) {
        log.info("Purchase attempt: flashSaleId={}, userId={}, quantity={}",
                flashSaleId, userId, request.getQuantity());

        // 1. LOCK and load flash sale (CRITICAL: prevents race condition)
        FlashSaleEntity sale = flashSaleRepository.findByIdForUpdate(flashSaleId)
                .orElseThrow(() -> new NotFoundException("Flash sale không tồn tại"));

        // 2. Validate flash sale status
        OffsetDateTime now = OffsetDateTime.now();

        if (sale.getStatus() == FlashSaleStatus.CANCELLED) {
            return FlashSalePurchaseResult.notActive("Flash sale đã bị hủy");
        }
        if (sale.getStatus() == FlashSaleStatus.ENDED || sale.getStatus() == FlashSaleStatus.SOLD_OUT) {
            return FlashSalePurchaseResult.notActive("Flash sale đã kết thúc");
        }
        if (now.isBefore(sale.getStartTime())) {
            long secondsUntilStart = Duration.between(now, sale.getStartTime()).getSeconds();
            return FlashSalePurchaseResult.notActive("Flash sale chưa bắt đầu. Còn " + secondsUntilStart + " giây");
        }
        if (now.isAfter(sale.getEndTime())) {
            sale.setStatus(FlashSaleStatus.ENDED);
            flashSaleRepository.save(sale);
            return FlashSalePurchaseResult.notActive("Flash sale đã kết thúc");
        }

        BigDecimal quantity = request.getQuantity();

        // 3. Validate minimum purchase
        if (quantity.compareTo(sale.getMinPurchase()) < 0) {
            return FlashSalePurchaseResult.fail(
                    "Số lượng tối thiểu là " + sale.getMinPurchase() + " mét",
                    "MIN_QUANTITY");
        }

        // 4. Check available stock
        BigDecimal available = sale.getAvailableQuantity();
        if (available.compareTo(quantity) < 0) {
            if (available.compareTo(BigDecimal.ZERO) <= 0) {
                sale.setStatus(FlashSaleStatus.SOLD_OUT);
                flashSaleRepository.save(sale);
            }
            return FlashSalePurchaseResult.outOfStock(available);
        }

        // 5. Check user limit
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));

        BigDecimal userPurchased = orderRepository.sumQuantityByUserAndFlashSale(userId, flashSaleId);
        if (userPurchased == null)
            userPurchased = BigDecimal.ZERO;

        BigDecimal userRemaining = sale.getMaxPerUser().subtract(userPurchased);

        if (userRemaining.compareTo(quantity) < 0) {
            return FlashSalePurchaseResult.limitExceeded(userRemaining, sale.getMaxPerUser());
        }

        // 6. Create reservation
        OffsetDateTime reservationExpiry = now.plusMinutes(RESERVATION_MINUTES);
        FlashSaleReservationEntity reservation = FlashSaleReservationEntity.builder()
                .flashSale(sale)
                .user(user)
                .quantity(quantity)
                .status(FlashSaleReservationStatus.ACTIVE)
                .expiresAt(reservationExpiry)
                .build();
        reservation = reservationRepository.save(reservation);

        // 7. Update reserved quantity in flash sale
        sale.setReservedQuantity(sale.getReservedQuantity().add(quantity));
        flashSaleRepository.save(sale);

        // 8. Create order
        OffsetDateTime paymentDeadline = now.plusMinutes(PAYMENT_DEADLINE_MINUTES);
        BigDecimal totalAmount = sale.getFlashPrice().multiply(quantity);

        FlashSaleOrderEntity order = FlashSaleOrderEntity.builder()
                .flashSale(sale)
                .user(user)
                .reservation(reservation)
                .orderCode(generateOrderCode())
                .quantity(quantity)
                .unitPrice(sale.getFlashPrice())
                .totalAmount(totalAmount)
                .discountAmount(sale.getOriginalPrice().subtract(sale.getFlashPrice()).multiply(quantity))
                .status(FlashSaleOrderStatus.PENDING)
                .paymentDeadline(paymentDeadline)
                .shippingName(request.getShippingName())
                .shippingPhone(request.getShippingPhone())
                .shippingAddress(request.getShippingAddress())
                .customerNote(request.getCustomerNote())
                .build();
        order = orderRepository.save(order);

        log.info("Purchase successful: orderId={}, orderCode={}, quantity={}",
                order.getId(), order.getOrderCode(), quantity);

        // 9. Build success result
        return FlashSalePurchaseResult.builder()
                .success(true)
                .message("Đặt hàng thành công! Vui lòng thanh toán trong " + PAYMENT_DEADLINE_MINUTES + " phút")
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .quantity(quantity)
                .unitPrice(sale.getFlashPrice())
                .totalAmount(totalAmount)
                .savedAmount(order.getDiscountAmount())
                .orderStatus(FlashSaleOrderStatus.PENDING)
                .paymentDeadline(paymentDeadline)
                .paymentRemainingSeconds(Duration.between(now, paymentDeadline).getSeconds())
                .reservationId(reservation.getId())
                .reservationExpiresAt(reservationExpiry)
                .remainingStock(sale.getAvailableQuantity().subtract(quantity))
                .soldPercentage(sale.getSoldPercentage())
                .userTotalPurchased(userPurchased.add(quantity))
                .userRemainingLimit(userRemaining.subtract(quantity))
                .build();
    }

    // ==================== ORDER OPERATIONS ====================

    @Override
    public List<FlashSaleOrderResponse> getMyOrders(Long flashSaleId, Long userId) {
        List<FlashSaleOrderEntity> orders = orderRepository.findByUserIdAndFlashSaleId(userId, flashSaleId);
        return orders.stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<FlashSaleOrderResponse> getAllMyOrders(Long userId, Pageable pageable) {
        Page<FlashSaleOrderEntity> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return orders.map(this::toOrderResponse);
    }

    @Override
    public FlashSaleOrderResponse getOrderDetail(Long orderId, Long userId) {
        FlashSaleOrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new NotFoundException("Đơn hàng không tồn tại"));
        return toOrderResponse(order);
    }

    @Override
    @Transactional
    public FlashSaleOrderResponse cancelOrder(Long orderId, Long userId) {
        FlashSaleOrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new NotFoundException("Đơn hàng không tồn tại"));

        if (order.getStatus() != FlashSaleOrderStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng đang chờ thanh toán");
        }

        // Release reservation
        if (order.getReservation() != null) {
            FlashSaleReservationEntity reservation = order.getReservation();
            reservation.setStatus(FlashSaleReservationStatus.CANCELLED);
            reservationRepository.save(reservation);

            // Release stock
            FlashSaleEntity sale = order.getFlashSale();
            sale.setReservedQuantity(sale.getReservedQuantity().subtract(order.getQuantity()));
            flashSaleRepository.save(sale);
        }

        order.setStatus(FlashSaleOrderStatus.CANCELLED);
        order = orderRepository.save(order);

        log.info("Order cancelled: orderId={}", orderId);
        return toOrderResponse(order);
    }

    @Override
    @Transactional
    public FlashSaleOrderResponse confirmPayment(Long orderId, Long userId, String paymentMethod) {
        FlashSaleOrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new NotFoundException("Đơn hàng không tồn tại"));

        if (order.getStatus() != FlashSaleOrderStatus.PENDING) {
            throw new BadRequestException("Đơn hàng không ở trạng thái chờ thanh toán");
        }

        if (order.isExpired()) {
            throw new BadRequestException("Đơn hàng đã hết thời gian thanh toán");
        }

        // Convert reservation to sold
        if (order.getReservation() != null) {
            FlashSaleReservationEntity reservation = order.getReservation();
            reservation.setStatus(FlashSaleReservationStatus.CONVERTED);
            reservation.setConvertedAt(OffsetDateTime.now());
            reservationRepository.save(reservation);

            // Move from reserved to sold
            FlashSaleEntity sale = order.getFlashSale();
            sale.setReservedQuantity(sale.getReservedQuantity().subtract(order.getQuantity()));
            sale.setSoldQuantity(sale.getSoldQuantity().add(order.getQuantity()));

            // Check if sold out
            if (sale.getAvailableQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                sale.setStatus(FlashSaleStatus.SOLD_OUT);
            }
            flashSaleRepository.save(sale);
        }

        order.setStatus(FlashSaleOrderStatus.PAID);
        order.setPaymentMethod(paymentMethod);
        order.setPaidAt(OffsetDateTime.now());
        order = orderRepository.save(order);

        log.info("Payment confirmed: orderId={}, method={}", orderId, paymentMethod);
        return toOrderResponse(order);
    }

    // ==================== SCHEDULED TASKS ====================

    @Override
    @Transactional
    @Scheduled(fixedRate = 60000) // Every minute
    public void updateFlashSaleStatuses() {
        OffsetDateTime now = OffsetDateTime.now();

        // Activate scheduled sales
        List<FlashSaleEntity> toActivate = flashSaleRepository.findSalesToActivate(now);
        for (FlashSaleEntity sale : toActivate) {
            sale.setStatus(FlashSaleStatus.ACTIVE);
            flashSaleRepository.save(sale);
            log.info("Flash sale activated: id={}", sale.getId());
        }

        // End expired sales
        List<FlashSaleEntity> toEnd = flashSaleRepository.findSalesToEnd(now);
        for (FlashSaleEntity sale : toEnd) {
            sale.setStatus(FlashSaleStatus.ENDED);
            flashSaleRepository.save(sale);
            log.info("Flash sale ended: id={}", sale.getId());
        }
    }

    @Override
    @Transactional
    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void releaseExpiredReservations() {
        OffsetDateTime now = OffsetDateTime.now();
        List<FlashSaleReservationEntity> expired = reservationRepository.findExpiredReservations(now);

        for (FlashSaleReservationEntity reservation : expired) {
            // Release stock
            FlashSaleEntity sale = reservation.getFlashSale();
            sale.setReservedQuantity(sale.getReservedQuantity().subtract(reservation.getQuantity()));
            flashSaleRepository.save(sale);

            // Update reservation status
            reservation.setStatus(FlashSaleReservationStatus.EXPIRED);
            reservationRepository.save(reservation);

            log.info("Reservation expired: id={}, quantity={}",
                    reservation.getId(), reservation.getQuantity());
        }
    }

    @Override
    @Transactional
    @Scheduled(fixedRate = 60000) // Every minute
    public void expirePendingOrders() {
        OffsetDateTime now = OffsetDateTime.now();
        int expired = orderRepository.expirePendingOrders(now);
        if (expired > 0) {
            log.info("Expired {} pending orders", expired);
        }
    }

    // ==================== HELPER METHODS ====================

    private FlashSaleResponse toResponse(FlashSaleEntity entity, Long userId) {
        OffsetDateTime now = OffsetDateTime.now();

        // Calculate remaining seconds
        Long remainingSeconds = null;
        if (entity.getStatus() == FlashSaleStatus.SCHEDULED) {
            remainingSeconds = Duration.between(now, entity.getStartTime()).getSeconds();
        } else if (entity.getStatus() == FlashSaleStatus.ACTIVE) {
            remainingSeconds = Duration.between(now, entity.getEndTime()).getSeconds();
        }

        // Get user stats if authenticated
        BigDecimal userPurchased = BigDecimal.ZERO;
        BigDecimal userRemainingLimit = entity.getMaxPerUser();
        if (userId != null) {
            userPurchased = orderRepository.sumQuantityByUserAndFlashSale(userId, entity.getId());
            if (userPurchased == null)
                userPurchased = BigDecimal.ZERO;
            userRemainingLimit = entity.getMaxPerUser().subtract(userPurchased);
        }

        return FlashSaleResponse.builder()
                .id(entity.getId())
                .fabricId(entity.getFabric().getId())
                .fabricName(entity.getFabricName())
                .fabricImage(entity.getFabricImage())
                .fabricCode(entity.getFabric().getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .originalPrice(entity.getOriginalPrice())
                .flashPrice(entity.getFlashPrice())
                .discountPercent(entity.getCalculatedDiscountPercent())
                .savedAmount(entity.getOriginalPrice().subtract(entity.getFlashPrice()))
                .totalQuantity(entity.getTotalQuantity())
                .soldQuantity(entity.getSoldQuantity())
                .reservedQuantity(entity.getReservedQuantity())
                .availableQuantity(entity.getAvailableQuantity())
                .soldPercentage(entity.getSoldPercentage())
                .maxPerUser(entity.getMaxPerUser())
                .minPurchase(entity.getMinPurchase())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .remainingSeconds(remainingSeconds)
                .status(entity.getStatus())
                .isActive(entity.isActive())
                .isSoldOut(entity.isSoldOut())
                .hasStarted(entity.hasStarted())
                .hasEnded(entity.hasEnded())
                .priority(entity.getPriority())
                .isFeatured(entity.getIsFeatured())
                .bannerImage(entity.getBannerImage())
                .totalOrders((int) orderRepository.countByFlashSaleIdAndStatus(
                        entity.getId(), FlashSaleOrderStatus.PAID))
                .userPurchased(userPurchased)
                .userRemainingLimit(userRemainingLimit)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private FlashSaleOrderResponse toOrderResponse(FlashSaleOrderEntity entity) {
        OffsetDateTime now = OffsetDateTime.now();
        Long paymentRemainingSeconds = null;
        if (entity.getStatus() == FlashSaleOrderStatus.PENDING && entity.getPaymentDeadline() != null) {
            paymentRemainingSeconds = Duration.between(now, entity.getPaymentDeadline()).getSeconds();
            if (paymentRemainingSeconds < 0)
                paymentRemainingSeconds = 0L;
        }

        FlashSaleEntity sale = entity.getFlashSale();

        return FlashSaleOrderResponse.builder()
                .id(entity.getId())
                .orderCode(entity.getOrderCode())
                .flashSaleId(sale.getId())
                .flashSaleName(sale.getName())
                .fabricName(sale.getFabricName())
                .fabricImage(sale.getFabricImage())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .originalPrice(sale.getOriginalPrice())
                .totalAmount(entity.getTotalAmount())
                .discountAmount(entity.getDiscountAmount())
                .savedAmount(entity.getSavedAmount())
                .discountPercent(sale.getCalculatedDiscountPercent())
                .status(entity.getStatus())
                .paymentMethod(entity.getPaymentMethod())
                .paymentDeadline(entity.getPaymentDeadline())
                .paymentRemainingSeconds(paymentRemainingSeconds)
                .paidAt(entity.getPaidAt())
                .shippingName(entity.getShippingName())
                .shippingPhone(entity.getShippingPhone())
                .shippingAddress(entity.getShippingAddress())
                .customerNote(entity.getCustomerNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String generateOrderCode() {
        return "FS-" + System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}

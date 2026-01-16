package com.example.tailor_shop.modules.order.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.domain.OrderStatus;
import com.example.tailor_shop.modules.order.domain.OrderTimelineEntity;
import com.example.tailor_shop.modules.order.dto.OrderResponse;
import com.example.tailor_shop.modules.order.repository.OrderRepository;
import com.example.tailor_shop.modules.order.repository.OrderTimelineRepository;
import com.example.tailor_shop.modules.order.service.OrderService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Tailor Controller - API endpoints for tailors to manage their assigned orders
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tailor")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TAILOR')")
public class TailorController {

    private final OrderRepository orderRepository;
    private final OrderTimelineRepository orderTimelineRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;

    /**
     * Get tailor dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getStats(
            @AuthenticationPrincipal CustomUserDetails principal) {
        Long tailorId = getUserId(principal);

        Map<String, Object> stats = new HashMap<>();
        stats.put("unassigned", orderRepository.countUnassignedOrders());
        stats.put("inProgress", orderRepository.countByTailorIdAndStatus(tailorId, OrderStatus.IN_PROGRESS));
        stats.put("fitting", orderRepository.countByTailorIdAndStatus(tailorId, OrderStatus.FITTING));
        stats.put("completed", orderRepository.countByTailorIdAndStatus(tailorId, OrderStatus.COMPLETED));

        log.info("📊 Tailor {} fetched stats", tailorId);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), stats));
    }

    /**
     * Get orders waiting to be assigned (pool for tailors to pick from)
     */
    @GetMapping("/orders/unassigned")
    public ResponseEntity<CommonResponse<Page<OrderResponse>>> getUnassignedOrders(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<OrderEntity> orders = orderRepository.findUnassignedOrders(pageable);
        Page<OrderResponse> summaries = orders.map(this::mapToSummary);

        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), summaries));
    }

    /**
     * Get orders assigned to current tailor with optional status filter
     */
    @GetMapping("/orders")
    public ResponseEntity<CommonResponse<Page<OrderResponse>>> getMyOrders(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Long tailorId = getUserId(principal);
        Page<OrderEntity> orders = orderRepository.findByTailorIdAndStatus(tailorId, status, pageable);
        Page<OrderResponse> summaries = orders.map(this::mapToSummary);

        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), summaries));
    }

    /**
     * Get order detail (only if assigned to current tailor or unassigned)
     */
    @GetMapping("/orders/{id}")
    public ResponseEntity<CommonResponse<OrderResponse>> getOrderDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Long tailorId = getUserId(principal);
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Đơn hàng không tồn tại"));

        // Check authorization: must be assigned to this tailor or unassigned
        if (order.getTailor() != null && !order.getTailor().getId().equals(tailorId)) {
            throw new BadRequestException("Bạn không có quyền xem đơn hàng này");
        }

        OrderResponse detail = orderService.detail(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), detail));
    }

    /**
     * Accept/claim an unassigned order
     */
    @PostMapping("/orders/{id}/accept")
    public ResponseEntity<CommonResponse<OrderResponse>> acceptOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Long tailorId = getUserId(principal);
        UserEntity tailor = userRepository.findById(tailorId)
                .orElseThrow(() -> new NotFoundException("Thợ may không tồn tại"));

        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Đơn hàng không tồn tại"));

        // Validate order can be accepted
        if (order.getTailor() != null) {
            throw new BadRequestException("Đơn hàng đã được phân công cho thợ may khác");
        }
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Đơn hàng chưa được xác nhận, không thể nhận");
        }

        // Assign tailor and update status
        order.setTailor(tailor);
        order.setStatus(OrderStatus.IN_PROGRESS);
        orderRepository.save(order);

        // Add timeline entry
        addTimeline(order, OrderStatus.IN_PROGRESS, "Thợ may " + tailor.getName() + " đã nhận đơn");

        log.info("✅ Tailor {} accepted order {}", tailorId, order.getCode());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), mapToSummary(order)));
    }

    /**
     * Update order status (IN_PROGRESS -> FITTING -> COMPLETED)
     */
    @PutMapping("/orders/{id}/status")
    public ResponseEntity<CommonResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus newStatus,
            @RequestParam(required = false) String note,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Long tailorId = getUserId(principal);
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Đơn hàng không tồn tại"));

        // Check authorization
        if (order.getTailor() == null || !order.getTailor().getId().equals(tailorId)) {
            throw new BadRequestException("Bạn không có quyền cập nhật đơn hàng này");
        }

        // Validate status transition
        if (!isValidTransition(order.getStatus(), newStatus)) {
            throw new BadRequestException("Không thể chuyển từ " + order.getStatus() + " sang " + newStatus);
        }

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        orderRepository.save(order);

        // Add timeline entry
        String timelineNote = note != null ? note : getDefaultNote(newStatus);
        addTimeline(order, newStatus, timelineNote);

        log.info("📝 Tailor {} updated order {} status: {} -> {}", tailorId, order.getCode(), oldStatus, newStatus);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), mapToSummary(order)));
    }

    // ==================== HELPER METHODS ====================

    private Long getUserId(CustomUserDetails principal) {
        if (principal == null) {
            throw new BadRequestException("Không tìm thấy thông tin đăng nhập");
        }
        String phone = principal.getUsername();
        return userRepository.findByPhoneAndIsDeletedFalse(phone)
                .map(UserEntity::getId)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));
    }

    private boolean isValidTransition(OrderStatus current, OrderStatus target) {
        return switch (current) {
            case CONFIRMED -> target == OrderStatus.IN_PROGRESS;
            case IN_PROGRESS -> target == OrderStatus.FITTING;
            case FITTING -> target == OrderStatus.COMPLETED || target == OrderStatus.IN_PROGRESS;
            default -> false;
        };
    }

    private String getDefaultNote(OrderStatus status) {
        return switch (status) {
            case IN_PROGRESS -> "Đang thực hiện";
            case FITTING -> "Hoàn thành may, chờ thử đồ";
            case COMPLETED -> "Khách hàng đã nhận, hoàn thành";
            default -> "Cập nhật trạng thái";
        };
    }

    private void addTimeline(OrderEntity order, OrderStatus status, String note) {
        OrderTimelineEntity timeline = new OrderTimelineEntity();
        timeline.setOrder(order);
        timeline.setStatus(status);
        timeline.setNote(note);
        // createdAt is auto-set by @CreationTimestamp
        orderTimelineRepository.save(timeline);
    }

    private OrderResponse mapToSummary(OrderEntity order) {
        OrderResponse summary = new OrderResponse();
        summary.setId(order.getId());
        summary.setCode(order.getCode());
        summary.setStatus(order.getStatus());
        summary.setTotal(order.getTotal());
        summary.setDueDate(order.getDueDate());
        summary.setAppointmentDate(order.getAppointmentDate());
        summary.setCreatedAt(order.getCreatedAt());

        if (order.getCustomer() != null) {
            OrderResponse.Party customer = new OrderResponse.Party();
            customer.setId(order.getCustomer().getId());
            customer.setName(order.getCustomer().getName());
            summary.setCustomer(customer);
            summary.setCustomerPhone(order.getCustomer().getPhone());
        }
        if (order.getTailor() != null) {
            OrderResponse.Party tailor = new OrderResponse.Party();
            tailor.setId(order.getTailor().getId());
            tailor.setName(order.getTailor().getName());
            summary.setTailor(tailor);
        }

        return summary;
    }
}

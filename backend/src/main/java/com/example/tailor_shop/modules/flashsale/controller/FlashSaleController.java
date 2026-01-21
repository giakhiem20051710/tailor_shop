package com.example.tailor_shop.modules.flashsale.controller;

import com.example.tailor_shop.modules.flashsale.dto.*;
import com.example.tailor_shop.modules.flashsale.service.FlashSaleService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Flash Sale Controller - REST API endpoints
 */
@RestController
@RequestMapping("/api/v1/flash-sales")
@RequiredArgsConstructor
@Tag(name = "Flash Sale", description = "Flash Sale APIs for fabric sales")
public class FlashSaleController {

    private final FlashSaleService flashSaleService;
    private final UserRepository userRepository;

    // ==================== PUBLIC ENDPOINTS ====================

    @GetMapping("/active")
    @Operation(summary = "Get active flash sales", description = "Returns currently active flash sales")
    public ResponseEntity<Map<String, Object>> getActiveSales(Authentication authentication) {
        Long userId = getUserId(authentication);
        List<FlashSaleResponse> sales = flashSaleService.getActiveSales(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", sales);
        response.put("count", sales.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming flash sales", description = "Returns scheduled flash sales")
    public ResponseEntity<Map<String, Object>> getUpcomingSales(Authentication authentication) {
        Long userId = getUserId(authentication);
        List<FlashSaleResponse> sales = flashSaleService.getUpcomingSales(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", sales);
        response.put("count", sales.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured flash sales", description = "Returns featured flash sales")
    public ResponseEntity<Map<String, Object>> getFeaturedSales(Authentication authentication) {
        Long userId = getUserId(authentication);
        List<FlashSaleResponse> sales = flashSaleService.getFeaturedSales(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", sales);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get flash sale detail", description = "Returns flash sale detail by ID")
    public ResponseEntity<Map<String, Object>> getDetail(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        FlashSaleResponse sale = flashSaleService.getDetail(id, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", sale);

        return ResponseEntity.ok(response);
    }

    // ==================== ADMIN ENDPOINTS ====================

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "List all flash sales (Admin)", description = "Returns all flash sales with pagination")
    public ResponseEntity<Map<String, Object>> listAll(
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FlashSaleResponse> salesPage = flashSaleService.listAll(statuses, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", salesPage.getContent());
        response.put("pagination", Map.of(
                "page", salesPage.getNumber(),
                "size", salesPage.getSize(),
                "totalElements", salesPage.getTotalElements(),
                "totalPages", salesPage.getTotalPages()));

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Create flash sale (Admin)", description = "Creates a new flash sale")
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody FlashSaleRequest request,
            Authentication authentication) {
        Long userId = getUserIdRequired(authentication);
        FlashSaleResponse sale = flashSaleService.create(request, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Flash sale created successfully");
        response.put("data", sale);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Update flash sale (Admin)", description = "Updates an existing flash sale")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @Valid @RequestBody FlashSaleRequest request,
            Authentication authentication) {
        Long userId = getUserIdRequired(authentication);
        FlashSaleResponse sale = flashSaleService.update(id, request, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Flash sale updated successfully");
        response.put("data", sale);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Cancel flash sale (Admin)", description = "Cancels a flash sale")
    public ResponseEntity<Map<String, Object>> cancel(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = getUserIdRequired(authentication);
        FlashSaleResponse sale = flashSaleService.cancel(id, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Flash sale cancelled successfully");
        response.put("data", sale);

        return ResponseEntity.ok(response);
    }

    // ==================== CUSTOMER PURCHASE ENDPOINTS ====================

    @PostMapping("/{id}/purchase")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Purchase flash sale item", description = "Purchases fabric from flash sale")
    public ResponseEntity<Map<String, Object>> purchase(
            @PathVariable Long id,
            @Valid @RequestBody FlashSalePurchaseRequest request,
            Authentication authentication) {
        Long userId = getUserIdRequired(authentication);
        FlashSalePurchaseResult result = flashSaleService.purchase(id, request, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", result.getSuccess());
        response.put("message", result.getMessage());
        response.put("data", result);

        if (!result.getSuccess()) {
            response.put("errorCode", result.getErrorCode());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/my-orders")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my orders for a flash sale", description = "Returns user's orders for specific flash sale")
    public ResponseEntity<Map<String, Object>> getMyOrders(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = getUserIdRequired(authentication);
        List<FlashSaleOrderResponse> orders = flashSaleService.getMyOrders(id, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", orders);
        response.put("count", orders.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-orders")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all my flash sale orders", description = "Returns all user's flash sale orders")
    public ResponseEntity<Map<String, Object>> getAllMyOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        Long userId = getUserIdRequired(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FlashSaleOrderResponse> ordersPage = flashSaleService.getAllMyOrders(userId, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", ordersPage.getContent());
        response.put("pagination", Map.of(
                "page", ordersPage.getNumber(),
                "size", ordersPage.getSize(),
                "totalElements", ordersPage.getTotalElements(),
                "totalPages", ordersPage.getTotalPages()));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/{orderId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get order detail", description = "Returns flash sale order detail")
    public ResponseEntity<Map<String, Object>> getOrderDetail(
            @PathVariable Long orderId,
            Authentication authentication) {
        Long userId = getUserIdRequired(authentication);
        FlashSaleOrderResponse order = flashSaleService.getOrderDetail(orderId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/orders/{orderId}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel order", description = "Cancels a pending flash sale order")
    public ResponseEntity<Map<String, Object>> cancelOrder(
            @PathVariable Long orderId,
            Authentication authentication) {
        Long userId = getUserIdRequired(authentication);
        FlashSaleOrderResponse order = flashSaleService.cancelOrder(orderId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Order cancelled successfully");
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/orders/{orderId}/confirm-payment")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Confirm payment", description = "Confirms payment for a pending order")
    public ResponseEntity<Map<String, Object>> confirmPayment(
            @PathVariable Long orderId,
            @RequestParam String paymentMethod,
            Authentication authentication) {
        Long userId = getUserIdRequired(authentication);
        FlashSaleOrderResponse order = flashSaleService.confirmPayment(orderId, userId, paymentMethod);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Payment confirmed successfully");
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    // ==================== HELPER METHODS ====================

    private Long getUserId(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        try {
            String identifier = authentication.getName();
            // Try to find by username, phone, or email
            return userRepository.findByUsernameAndIsDeletedFalse(identifier)
                    .or(() -> userRepository.findByPhoneAndIsDeletedFalse(identifier))
                    .or(() -> userRepository.findByEmailAndIsDeletedFalse(identifier))
                    .map(UserEntity::getId)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private Long getUserIdRequired(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Authentication required");
        }
        String identifier = authentication.getName();
        // Try to find by username, phone, or email
        UserEntity user = userRepository.findByUsernameAndIsDeletedFalse(identifier)
                .or(() -> userRepository.findByPhoneAndIsDeletedFalse(identifier))
                .or(() -> userRepository.findByEmailAndIsDeletedFalse(identifier))
                .orElseThrow(() -> new RuntimeException("User not found: " + identifier));
        return user.getId();
    }
}

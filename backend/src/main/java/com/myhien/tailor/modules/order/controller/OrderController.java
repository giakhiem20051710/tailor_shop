package com.myhien.tailor.modules.order.controller;

import com.myhien.tailor.modules.order.dto.OrderRequestDTO;
import com.myhien.tailor.modules.order.dto.OrderResponseDTO;
import com.myhien.tailor.modules.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    
    private final OrderService orderService;
    
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponseDTO create(@RequestBody @Valid OrderRequestDTO request) {
        return orderService.create(request);
    }
    
    @PutMapping("/{id}")
    public OrderResponseDTO update(
        @PathVariable Long id,
        @RequestBody @Valid OrderRequestDTO request
    ) {
        return orderService.update(id, request);
    }
    
    @GetMapping("/{id}")
    public OrderResponseDTO findById(@PathVariable Long id) {
        return orderService.findById(id);
    }
    
    @GetMapping("/code/{code}")
    public OrderResponseDTO findByCode(@PathVariable String code) {
        return orderService.findByCode(code);
    }
    
    @GetMapping
    public Page<OrderResponseDTO> findAll(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return orderService.findAll(pageable);
    }
    
    @GetMapping("/customer/{customerId}")
    public Page<OrderResponseDTO> findByCustomerId(
        @PathVariable Long customerId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return orderService.findByCustomerId(customerId, pageable);
    }
    
    @GetMapping("/tailor/{tailorId}")
    public Page<OrderResponseDTO> findByTailorId(
        @PathVariable Long tailorId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return orderService.findByTailorId(tailorId, pageable);
    }
    
    @PatchMapping("/{id}/status")
    public OrderResponseDTO updateStatus(
        @PathVariable Long id,
        @RequestParam String status
    ) {
        return orderService.updateStatus(id, status);
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        orderService.delete(id);
    }
}


package com.myhien.tailor.modules.order.service;

import com.myhien.tailor.modules.order.dto.OrderRequestDTO;
import com.myhien.tailor.modules.order.dto.OrderResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    
    OrderResponseDTO create(OrderRequestDTO request);
    
    OrderResponseDTO update(Long id, OrderRequestDTO request);
    
    OrderResponseDTO findById(Long id);
    
    OrderResponseDTO findByCode(String code);
    
    Page<OrderResponseDTO> findAll(Pageable pageable);
    
    Page<OrderResponseDTO> findByCustomerId(Long customerId, Pageable pageable);
    
    Page<OrderResponseDTO> findByTailorId(Long tailorId, Pageable pageable);
    
    void delete(Long id);
    
    OrderResponseDTO updateStatus(Long id, String status);
}


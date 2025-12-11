package com.myhien.tailor.modules.order.service.impl;

import com.myhien.tailor.config.exception.BusinessException;
import com.myhien.tailor.modules.order.domain.OrderEntity;
import com.myhien.tailor.modules.order.domain.OrderStatus;
import com.myhien.tailor.modules.order.dto.OrderRequestDTO;
import com.myhien.tailor.modules.order.dto.OrderResponseDTO;
import com.myhien.tailor.modules.order.repository.OrderRepository;
import com.myhien.tailor.modules.order.service.OrderService;
import com.myhien.tailor.modules.user.domain.UserEntity;
import com.myhien.tailor.modules.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {
    
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    
    public OrderServiceImpl(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }
    
    @Override
    public OrderResponseDTO create(OrderRequestDTO request) {
        UserEntity customer = userRepository.findById(request.customerId())
            .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Customer not found"));
        
        UserEntity tailor = null;
        if (request.assignedTailorId() != null) {
            tailor = userRepository.findById(request.assignedTailorId())
                .orElseThrow(() -> new BusinessException("TAILOR_NOT_FOUND", "Tailor not found"));
        }
        
        OrderEntity entity = new OrderEntity();
        entity.setCustomer(customer);
        entity.setAssignedTailor(tailor);
        entity.setName(request.name());
        entity.setPhone(request.phone());
        entity.setEmail(request.email());
        entity.setAddress(request.address());
        entity.setProductName(request.productName());
        entity.setProductType(request.productType());
        entity.setDescription(request.description());
        entity.setBudget(request.budget());
        entity.setTotal(request.total());
        entity.setDeposit(request.deposit());
        entity.setStatus(OrderStatus.PENDING);
        entity.setReceiveDate(request.receiveDate());
        entity.setDueDate(request.dueDate());
        entity.setAppointmentType(parseAppointmentType(request.appointmentType()));
        entity.setAppointmentDate(request.appointmentDate());
        entity.setAppointmentTime(request.appointmentTime());
        entity.setPromoCode(request.promoCode());
        entity.setNotes(request.notes());
        entity.setCorrectionNotes(request.correctionNotes());
        entity.setCode(generateOrderCode());
        
        OrderEntity saved = orderRepository.save(entity);
        return toResponseDTO(saved);
    }
    
    @Override
    public OrderResponseDTO update(Long id, OrderRequestDTO request) {
        OrderEntity entity = orderRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "Order not found"));
        
        if (entity.getIsDeleted()) {
            throw new BusinessException("ORDER_DELETED", "Order has been deleted");
        }
        
        // Update fields
        if (request.assignedTailorId() != null) {
            UserEntity tailor = userRepository.findById(request.assignedTailorId())
                .orElseThrow(() -> new BusinessException("TAILOR_NOT_FOUND", "Tailor not found"));
            entity.setAssignedTailor(tailor);
        }
        
        entity.setName(request.name());
        entity.setPhone(request.phone());
        entity.setEmail(request.email());
        entity.setAddress(request.address());
        entity.setProductName(request.productName());
        entity.setProductType(request.productType());
        entity.setDescription(request.description());
        entity.setBudget(request.budget());
        entity.setTotal(request.total());
        entity.setDeposit(request.deposit());
        entity.setReceiveDate(request.receiveDate());
        entity.setDueDate(request.dueDate());
        entity.setAppointmentType(parseAppointmentType(request.appointmentType()));
        entity.setAppointmentDate(request.appointmentDate());
        entity.setAppointmentTime(request.appointmentTime());
        entity.setPromoCode(request.promoCode());
        entity.setNotes(request.notes());
        entity.setCorrectionNotes(request.correctionNotes());
        
        OrderEntity saved = orderRepository.save(entity);
        return toResponseDTO(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO findById(Long id) {
        OrderEntity entity = orderRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "Order not found"));
        
        if (entity.getIsDeleted()) {
            throw new BusinessException("ORDER_DELETED", "Order has been deleted");
        }
        
        return toResponseDTO(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO findByCode(String code) {
        OrderEntity entity = orderRepository.findByCode(code)
            .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "Order not found"));
        
        if (entity.getIsDeleted()) {
            throw new BusinessException("ORDER_DELETED", "Order has been deleted");
        }
        
        return toResponseDTO(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> findAll(Pageable pageable) {
        return orderRepository.findByIsDeletedFalse(pageable)
            .map(this::toResponseDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> findByCustomerId(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerIdAndIsDeletedFalse(customerId, pageable)
            .map(this::toResponseDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> findByTailorId(Long tailorId, Pageable pageable) {
        return orderRepository.findByAssignedTailorIdAndIsDeletedFalse(tailorId, pageable)
            .map(this::toResponseDTO);
    }
    
    @Override
    public void delete(Long id) {
        OrderEntity entity = orderRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "Order not found"));
        
        entity.setIsDeleted(true);
        orderRepository.save(entity);
    }
    
    @Override
    public OrderResponseDTO updateStatus(Long id, String status) {
        OrderEntity entity = orderRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "Order not found"));
        
        if (entity.getIsDeleted()) {
            throw new BusinessException("ORDER_DELETED", "Order has been deleted");
        }
        
        try {
            OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
            entity.setStatus(newStatus);
            
            if (newStatus == OrderStatus.DONE && entity.getCompletedAt() == null) {
                entity.setCompletedAt(OffsetDateTime.now());
            }
            
            OrderEntity saved = orderRepository.save(entity);
            return toResponseDTO(saved);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("INVALID_STATUS", "Invalid order status: " + status);
        }
    }
    
    private String generateOrderCode() {
        String code;
        do {
            code = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (orderRepository.existsByCode(code));
        return code;
    }
    
    private OrderEntity.AppointmentType parseAppointmentType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        try {
            return OrderEntity.AppointmentType.valueOf(type.toLowerCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
    
    private OrderResponseDTO toResponseDTO(OrderEntity entity) {
        return new OrderResponseDTO(
            entity.getId(),
            entity.getCode(),
            entity.getCustomer() != null ? entity.getCustomer().getId() : null,
            entity.getCustomer() != null ? entity.getCustomer().getName() : null,
            entity.getAssignedTailor() != null ? entity.getAssignedTailor().getId() : null,
            entity.getAssignedTailor() != null ? entity.getAssignedTailor().getName() : null,
            entity.getName(),
            entity.getPhone(),
            entity.getEmail(),
            entity.getAddress(),
            entity.getProductName(),
            entity.getProductType(),
            entity.getDescription(),
            entity.getBudget(),
            entity.getTotal(),
            entity.getDeposit(),
            entity.getStatus(),
            entity.getReceiveDate(),
            entity.getDueDate(),
            entity.getAppointmentType() != null ? entity.getAppointmentType().name() : null,
            entity.getAppointmentDate(),
            entity.getAppointmentTime(),
            entity.getPromoCode(),
            entity.getNotes(),
            entity.getCorrectionNotes(),
            entity.getSampleImages(),
            entity.getCreatedAt(),
            entity.getCompletedAt(),
            entity.getUpdatedAt()
        );
    }
}


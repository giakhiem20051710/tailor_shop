package com.example.tailor_shop.modules.measurement.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.measurement.domain.MeasurementEntity;
import com.example.tailor_shop.modules.measurement.dto.MeasurementRequest;
import com.example.tailor_shop.modules.measurement.dto.MeasurementResponse;
import com.example.tailor_shop.modules.measurement.repository.MeasurementRepository;
import com.example.tailor_shop.modules.measurement.service.MeasurementService;
import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.repository.OrderRepository;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class MeasurementServiceImpl implements MeasurementService {

    private final MeasurementRepository measurementRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public MeasurementServiceImpl(MeasurementRepository measurementRepository,
                                  UserRepository userRepository,
                                  OrderRepository orderRepository) {
        this.measurementRepository = measurementRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MeasurementResponse> list(Long customerId, Long orderId, Long currentUserId, boolean isCustomer, Pageable pageable) {
        Long effectiveCustomer = customerId;
        if (isCustomer) {
            // customer chỉ xem của mình
            effectiveCustomer = currentUserId;
        }
        return measurementRepository.findLatest(effectiveCustomer, orderId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public MeasurementResponse detail(Long id, Long currentUserId, boolean isCustomer) {
        MeasurementEntity m = measurementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Measurement not found"));
        if (isCustomer && !m.getCustomer().getId().equals(currentUserId)) {
            throw new BadRequestException("Access denied");
        }
        return toResponse(m);
    }

    @Override
    public MeasurementResponse create(MeasurementRequest request, Long currentUserId) {
        UserEntity customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        OrderEntity order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order not found"));
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new BadRequestException("Order does not belong to customer");
            }
        }

        MeasurementEntity entity = new MeasurementEntity();
        entity.setGroupId(UUID.randomUUID().toString());
        entity.setCustomer(customer);
        entity.setOrder(order);
        entity.setVersion(1);
        entity.setIsLatest(true);
        applyRequest(entity, request);
        if (currentUserId != null) {
            userRepository.findById(currentUserId).ifPresent(entity::setCreatedBy);
        }
        measurementRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    public MeasurementResponse update(Long id, MeasurementRequest request, Long currentUserId) {
        MeasurementEntity current = measurementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Measurement not found"));
        UserEntity customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        if (!current.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Customer mismatch");
        }

        OrderEntity order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order not found"));
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new BadRequestException("Order does not belong to customer");
            }
        }

        // mark old latest = false
        List<MeasurementEntity> history = measurementRepository.findByGroupIdOrderByVersionDesc(current.getGroupId());
        history.stream().filter(MeasurementEntity::getIsLatest).forEach(h -> h.setIsLatest(false));
        measurementRepository.saveAll(history);

        MeasurementEntity entity = new MeasurementEntity();
        entity.setGroupId(current.getGroupId());
        entity.setCustomer(customer);
        entity.setOrder(order);
        entity.setVersion(history.get(0).getVersion() + 1);
        entity.setIsLatest(true);
        applyRequest(entity, request);
        if (currentUserId != null) {
            userRepository.findById(currentUserId).ifPresent(entity::setCreatedBy);
        }
        measurementRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeasurementResponse> history(Long id, Long currentUserId, boolean isCustomer) {
        MeasurementEntity current = measurementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Measurement not found"));
        if (isCustomer && !current.getCustomer().getId().equals(currentUserId)) {
            throw new BadRequestException("Access denied");
        }
        return measurementRepository.findByGroupIdOrderByVersionDesc(current.getGroupId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MeasurementResponse latest(Long id, Long currentUserId, boolean isCustomer) {
        MeasurementEntity current = measurementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Measurement not found"));
        if (isCustomer && !current.getCustomer().getId().equals(currentUserId)) {
            throw new BadRequestException("Access denied");
        }
        MeasurementEntity latest = measurementRepository.findFirstByGroupIdAndIsLatestTrue(current.getGroupId());
        if (latest == null) {
            throw new NotFoundException("Measurement not found");
        }
        return toResponse(latest);
    }

    private void applyRequest(MeasurementEntity entity, MeasurementRequest req) {
        entity.setChest(req.getChest());
        entity.setWaist(req.getWaist());
        entity.setHip(req.getHip());
        entity.setShoulder(req.getShoulder());
        entity.setSleeve(req.getSleeve());
        entity.setInseam(req.getInseam());
        entity.setOutseam(req.getOutseam());
        entity.setNeck(req.getNeck());
        entity.setHeight(req.getHeight());
        entity.setWeight(req.getWeight());
        entity.setFitPreference(req.getFitPreference());
        entity.setNote(req.getNote());
    }

    private MeasurementResponse toResponse(MeasurementEntity m) {
        MeasurementResponse dto = new MeasurementResponse();
        dto.setId(m.getId());
        dto.setGroupId(m.getGroupId());
        dto.setCustomerId(m.getCustomer().getId());
        dto.setCustomerName(m.getCustomer().getName());
        dto.setOrderId(m.getOrder() != null ? m.getOrder().getId() : null);
        dto.setVersion(m.getVersion());
        dto.setLatest(m.getIsLatest());
        dto.setChest(m.getChest());
        dto.setWaist(m.getWaist());
        dto.setHip(m.getHip());
        dto.setShoulder(m.getShoulder());
        dto.setSleeve(m.getSleeve());
        dto.setInseam(m.getInseam());
        dto.setOutseam(m.getOutseam());
        dto.setNeck(m.getNeck());
        dto.setHeight(m.getHeight());
        dto.setWeight(m.getWeight());
        dto.setFitPreference(m.getFitPreference());
        dto.setNote(m.getNote());
        dto.setCreatedAt(m.getCreatedAt());
        dto.setCreatedBy(m.getCreatedBy() != null ? m.getCreatedBy().getName() : null);
        return dto;
    }
}


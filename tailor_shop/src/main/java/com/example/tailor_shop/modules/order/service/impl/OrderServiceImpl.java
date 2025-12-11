package com.example.tailor_shop.modules.order.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.order.domain.*;
import com.example.tailor_shop.modules.order.dto.OrderResquest;
import com.example.tailor_shop.modules.order.dto.OrderResponse;
import com.example.tailor_shop.modules.order.dto.UpdateOrderStatusRequest;
import com.example.tailor_shop.modules.order.repository.*;
import com.example.tailor_shop.modules.order.service.OrderService;
import com.example.tailor_shop.config.storage.S3StorageService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import com.example.tailor_shop.modules.measurement.domain.MeasurementEntity;
import com.example.tailor_shop.modules.measurement.repository.MeasurementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderTimelineRepository orderTimelineRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final OrderAttachmentRepository orderAttachmentRepository;
    private final UserRepository userRepository;
    private final S3StorageService s3StorageService;
    private final MeasurementRepository measurementRepository;

    public OrderServiceImpl(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            OrderTimelineRepository orderTimelineRepository,
                            OrderPaymentRepository orderPaymentRepository,
                            OrderAttachmentRepository orderAttachmentRepository,
                            UserRepository userRepository,
                            S3StorageService s3StorageService,
                            MeasurementRepository measurementRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderTimelineRepository = orderTimelineRepository;
        this.orderPaymentRepository = orderPaymentRepository;
        this.orderAttachmentRepository = orderAttachmentRepository;
        this.userRepository = userRepository;
        this.s3StorageService = s3StorageService;
        this.measurementRepository = measurementRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> list(OrderStatus status,
                                    Long customerId,
                                    Long tailorId,
                                    Instant fromDate,
                                    Instant toDate,
                                    java.time.LocalDate appointmentDate,
                                    java.time.LocalDate dueDate,
                                    String search,
                                    Pageable pageable) {
        return orderRepository.search(status, customerId, tailorId, fromDate, toDate, appointmentDate, dueDate, normalize(search), pageable)
                .map(this::mapToSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse detail(Long id) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        return mapToDetail(order);
    }

    @Override
    public OrderResponse create(OrderResquest request, java.util.List<MultipartFile> files) {
        UserEntity customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        UserEntity tailor = null;
        if (request.getTailorId() != null) {
            tailor = userRepository.findById(request.getTailorId())
                    .orElseThrow(() -> new NotFoundException("Tailor not found"));
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order items is required");
        }

        OrderEntity order = new OrderEntity();
        order.setCode(generateCode());
        order.setCustomer(customer);
        order.setTailor(tailor);
        order.setStatus(OrderStatus.DRAFT);
        order.setDepositAmount(request.getDepositAmount() == null ? BigDecimal.ZERO : request.getDepositAmount());
        order.setNote(request.getNote());
        order.setAppointmentDate(request.getAppointmentDate());
        order.setDueDate(request.getDueDate());
        order.setTotal(BigDecimal.ZERO);

        order = orderRepository.save(order);

        BigDecimal total = BigDecimal.ZERO;
        for (OrderResquest.Item itemReq : request.getItems()) {
            OrderItemEntity item = new OrderItemEntity();
            item.setOrder(order);
            item.setProductId(itemReq.getProductId());
            item.setFabricId(itemReq.getFabricId());
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(itemReq.getUnitPrice());
            BigDecimal subtotal = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            item.setSubtotal(subtotal);
            item.setProductName(itemReq.getProductName());
            orderItemRepository.save(item);
            total = total.add(subtotal);
        }

        order.setTotal(total);
        orderRepository.save(order);

        // Upload files if provided
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String url = s3StorageService.upload("orders/" + order.getId(), file);

                        OrderAttachmentEntity attachment = new OrderAttachmentEntity();
                        attachment.setOrder(order);
                        attachment.setName(file.getOriginalFilename());
                        attachment.setUrl(url);
                        attachment.setType(file.getContentType());
                        orderAttachmentRepository.save(attachment);
                    } catch (Exception e) {
                        throw new BadRequestException("Failed to upload file: " + file.getOriginalFilename() + " - " + e.getMessage());
                    }
                }
            }
        }

        // Create measurement if provided
        if (request.getMeasurement() != null) {
            OrderResquest.Measurement measReq = request.getMeasurement();
            // Check if at least one measurement field is provided
            if (hasMeasurementData(measReq)) {
                MeasurementEntity measurement = new MeasurementEntity();
                measurement.setGroupId(UUID.randomUUID().toString());
                measurement.setCustomer(customer);
                measurement.setOrder(order);
                measurement.setVersion(1);
                measurement.setIsLatest(true);
                measurement.setChest(measReq.getChest());
                measurement.setWaist(measReq.getWaist());
                measurement.setHip(measReq.getHip());
                measurement.setShoulder(measReq.getShoulder());
                measurement.setSleeve(measReq.getSleeve());
                measurement.setInseam(measReq.getInseam());
                measurement.setOutseam(measReq.getOutseam());
                measurement.setNeck(measReq.getNeck());
                measurement.setHeight(measReq.getHeight());
                measurement.setWeight(measReq.getWeight());
                measurement.setFitPreference(measReq.getFitPreference());
                measurement.setNote(measReq.getNote());
                measurementRepository.save(measurement);
            }
        }

        addTimeline(order, order.getStatus(), "Order created");

        return mapToDetail(order);
    }

    private boolean hasMeasurementData(OrderResquest.Measurement meas) {
        return meas.getChest() != null || meas.getWaist() != null || meas.getHip() != null
                || meas.getShoulder() != null || meas.getSleeve() != null || meas.getInseam() != null
                || meas.getOutseam() != null || meas.getNeck() != null || meas.getHeight() != null
                || meas.getWeight() != null;
    }

    @Override
    public OrderResponse updateStatus(Long id, UpdateOrderStatusRequest request) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        OrderStatus target = request.getStatus();
        if (!isTransitionAllowed(order.getStatus(), target)) {
            throw new BadRequestException("Invalid status transition");
        }

        order.setStatus(target);
        orderRepository.save(order);

        addTimeline(order, target, request.getNote());

        return mapToDetail(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse tracking(Long id, Long currentUserId, boolean isCustomer) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (isCustomer && !order.getCustomer().getId().equals(currentUserId)) {
            throw new BadRequestException("Access denied");
        }

        OrderResponse resp = new OrderResponse();
        resp.setId(order.getId());
        resp.setCode(order.getCode());
        resp.setStatus(order.getStatus());
        resp.setCustomer(new OrderResponse.Party(order.getCustomer().getId(), order.getCustomer().getName()));
        if (order.getTailor() != null) {
            resp.setTailor(new OrderResponse.Party(order.getTailor().getId(), order.getTailor().getName()));
        }
        resp.setTimeline(orderTimelineRepository.findByOrderOrderByCreatedAtAsc(order).stream()
                .map(t -> {
                    OrderResponse.Timeline dto = new OrderResponse.Timeline();
                    dto.setId(t.getId());
                    dto.setStatus(t.getStatus());
                    dto.setNote(t.getNote());
                    dto.setCreatedAt(t.getCreatedAt());
                    dto.setCreatedBy(t.getCreatedBy() != null ? t.getCreatedBy().getName() : null);
                    return dto;
                }).collect(Collectors.toList()));
        return resp;
    }

    @Override
    public OrderResponse uploadAttachment(Long id, MultipartFile file, Long currentUserId) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Optional: enforce customer ownership view; here allow admin/staff/tailor/customer to upload; add custom checks if needed.
        String url = s3StorageService.upload("orders/" + order.getId(), file);

        OrderAttachmentEntity entity = new OrderAttachmentEntity();
        entity.setOrder(order);
        entity.setName(file.getOriginalFilename());
        entity.setUrl(url);
        entity.setType(file.getContentType());
        orderAttachmentRepository.save(entity);

        return mapToDetail(order);
    }

    private void addTimeline(OrderEntity order, OrderStatus status, String note) {
        OrderTimelineEntity timeline = new OrderTimelineEntity();
        timeline.setOrder(order);
        timeline.setStatus(status);
        timeline.setNote(note);
        orderTimelineRepository.save(timeline);
    }

    private boolean isTransitionAllowed(OrderStatus current, OrderStatus target) {
        return switch (current) {
            case DRAFT -> target == OrderStatus.CONFIRMED || target == OrderStatus.CANCELLED;
            case CONFIRMED -> target == OrderStatus.IN_PROGRESS || target == OrderStatus.CANCELLED;
            case IN_PROGRESS -> target == OrderStatus.FITTING || target == OrderStatus.CANCELLED;
            case FITTING -> target == OrderStatus.COMPLETED || target == OrderStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    private OrderResponse mapToSummary(OrderEntity order) {
        OrderResponse dto = new OrderResponse();
        dto.setId(order.getId());
        dto.setCode(order.getCode());
        dto.setStatus(order.getStatus());
        dto.setTotal(order.getTotal());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setCustomer(new OrderResponse.Party(order.getCustomer().getId(), order.getCustomer().getName()));
        dto.setCustomerPhone(order.getCustomer().getPhone());
        if (order.getTailor() != null) {
            dto.setTailor(new OrderResponse.Party(order.getTailor().getId(), order.getTailor().getName()));
        }
        dto.setAppointmentDate(order.getAppointmentDate());
        dto.setDueDate(order.getDueDate());
        return dto;
    }

    private OrderResponse mapToDetail(OrderEntity order) {
        OrderResponse dto = mapToSummary(order);
        dto.setDepositAmount(order.getDepositAmount());
        dto.setNote(order.getNote());
        dto.setCreatedAt(order.getCreatedAt());

        dto.setItems(orderItemRepository.findByOrder(order).stream().map(item -> {
            OrderResponse.Item di = new OrderResponse.Item();
            di.setId(item.getId());
            di.setProductId(item.getProductId());
            di.setFabricId(item.getFabricId());
            di.setQuantity(item.getQuantity());
            di.setUnitPrice(item.getUnitPrice());
            di.setSubtotal(item.getSubtotal());
            di.setProductName(item.getProductName());
            return di;
        }).collect(Collectors.toList()));

        dto.setPayments(orderPaymentRepository.findByOrder(order).stream().map(p -> {
            OrderResponse.Payment dp = new OrderResponse.Payment();
            dp.setId(p.getId());
            dp.setAmount(p.getAmount());
            dp.setMethod(p.getMethod());
            dp.setStatus(p.getStatus());
            dp.setTxnRef(p.getTxnRef());
            dp.setCreatedAt(p.getCreatedAt());
            return dp;
        }).collect(Collectors.toList()));

        dto.setAttachments(orderAttachmentRepository.findByOrder(order).stream().map(a -> {
            OrderResponse.Attachment da = new OrderResponse.Attachment();
            da.setId(a.getId());
            da.setName(a.getName());
            da.setUrl(a.getUrl());
            da.setType(a.getType());
            da.setCreatedAt(a.getCreatedAt());
            return da;
        }).collect(Collectors.toList()));

        dto.setTimeline(orderTimelineRepository.findByOrderOrderByCreatedAtAsc(order).stream().map(t -> {
            OrderResponse.Timeline dt = new OrderResponse.Timeline();
            dt.setId(t.getId());
            dt.setStatus(t.getStatus());
            dt.setNote(t.getNote());
            dt.setCreatedAt(t.getCreatedAt());
            dt.setCreatedBy(t.getCreatedBy() != null ? t.getCreatedBy().getName() : null);
            return dt;
        }).collect(Collectors.toList()));

        return dto;
    }

    private String generateCode() {
        String code;
        do {
            code = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (orderRepository.existsByCode(code));
        return code;
    }

    private String normalize(String text) {
        if (text == null) return null;
        String t = text.trim();
        return t.isEmpty() ? null : t;
    }
}

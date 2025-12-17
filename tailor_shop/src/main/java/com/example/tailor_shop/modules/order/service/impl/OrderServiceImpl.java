package com.example.tailor_shop.modules.order.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.order.domain.*;
import com.example.tailor_shop.modules.order.dto.OrderResquest;
import com.example.tailor_shop.modules.order.dto.OrderResponse;
import com.example.tailor_shop.modules.order.dto.OrderWizardRequest;
import com.example.tailor_shop.modules.order.dto.UpdateOrderStatusRequest;
import com.example.tailor_shop.modules.order.repository.*;
import com.example.tailor_shop.modules.order.service.OrderService;
import com.example.tailor_shop.config.storage.S3StorageService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import com.example.tailor_shop.modules.measurement.domain.MeasurementEntity;
import com.example.tailor_shop.modules.measurement.repository.MeasurementRepository;
import com.example.tailor_shop.modules.appointment.service.AppointmentService;
import com.example.tailor_shop.modules.appointment.dto.AppointmentRequest;
import com.example.tailor_shop.modules.appointment.domain.AppointmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
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
    private final AppointmentService appointmentService;

    public OrderServiceImpl(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            OrderTimelineRepository orderTimelineRepository,
                            OrderPaymentRepository orderPaymentRepository,
                            OrderAttachmentRepository orderAttachmentRepository,
                            UserRepository userRepository,
                            S3StorageService s3StorageService,
                            MeasurementRepository measurementRepository,
                            AppointmentService appointmentService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderTimelineRepository = orderTimelineRepository;
        this.orderPaymentRepository = orderPaymentRepository;
        this.orderAttachmentRepository = orderAttachmentRepository;
        this.userRepository = userRepository;
        this.s3StorageService = s3StorageService;
        this.measurementRepository = measurementRepository;
        this.appointmentService = appointmentService;
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
        order.setDepositAmount(
                request.getDepositAmount() == null ? BigDecimal.ZERO : request.getDepositAmount()
        );
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
                populateMeasurement(measurement, measReq);
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
        
        // Update total if provided (for quote confirmation)
        if (request.getTotal() != null) {
            order.setTotal(request.getTotal());
        }
        
        // Update deposit amount if provided
        if (request.getDepositAmount() != null) {
            order.setDepositAmount(request.getDepositAmount());
        } else if (request.getTotal() != null && order.getDepositAmount().compareTo(BigDecimal.ZERO) == 0) {
            // Auto-calculate 30% deposit if not set
            order.setDepositAmount(request.getTotal().multiply(new BigDecimal("0.3")));
        }
        
        orderRepository.save(order);

        addTimeline(order, target, request.getNote());

        return mapToDetail(order);
    }

    @Override
    public OrderResponse createWizard(OrderWizardRequest request) {
        UserEntity customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));

        UserEntity tailor = null;
        if (request.getTailorId() != null) {
            tailor = userRepository.findById(request.getTailorId())
                    .orElseThrow(() -> new NotFoundException("Tailor not found"));
        }

        OrderEntity order = new OrderEntity();
        order.setCode(generateCode());
        order.setCustomer(customer);
        order.setTailor(tailor);
        order.setStatus(OrderStatus.WAITING_FOR_QUOTE);
        order.setDepositAmount(BigDecimal.ZERO);
        order.setAppointmentDate(
                request.getProduct() != null ? request.getProduct().getDueDate() : null
        );
        order.setDueDate(
                request.getProduct() != null ? request.getProduct().getDueDate() : null
        );
        order.setTotal(BigDecimal.ZERO);
        if (request.getProduct() != null && request.getProduct().getBudget() != null) {
            order.setExpectedBudget(request.getProduct().getBudget());
        }
        order.setNote(buildWizardNote(request));
        order = orderRepository.save(order);

        if (request.getProduct() != null && request.getProduct().getProductName() != null) {
            OrderItemEntity item = new OrderItemEntity();
            item.setOrder(order);
            item.setProductId(null);
            item.setFabricId(null);
            item.setQuantity(1);
            item.setUnitPrice(BigDecimal.ZERO);
            item.setSubtotal(BigDecimal.ZERO);
            item.setProductName(request.getProduct().getProductName());
            orderItemRepository.save(item);
        }

        OrderWizardRequest.Measurement measReq = request.getMeasurement();
        if (measReq != null && hasMeasurementData(measReq)) {
            MeasurementEntity measurement = new MeasurementEntity();
            measurement.setGroupId(UUID.randomUUID().toString());
            measurement.setCustomer(customer);
            measurement.setOrder(order);
            measurement.setVersion(1);
            measurement.setIsLatest(true);
            populateMeasurement(measurement, measReq);
            measurement.setNote(measReq.getNote());
            measurementRepository.save(measurement);
        }

        addTimeline(order, order.getStatus(), "Order created via wizard");
        
        // Tự động tạo appointment nếu order có appointmentDate hoặc dueDate
        LocalDate appointmentDate = order.getAppointmentDate() != null 
            ? order.getAppointmentDate() 
            : order.getDueDate();
        
        if (appointmentDate != null) {
            try {
                AppointmentRequest appointmentRequest = new AppointmentRequest();
                appointmentRequest.setOrderId(order.getId());
                appointmentRequest.setCustomerId(customer.getId());
                
                // Set staffId nếu có tailor
                if (tailor != null) {
                    appointmentRequest.setStaffId(tailor.getId());
                }
                
                // Map appointmentType từ String sang AppointmentType enum
                String appointmentTypeStr = request.getProduct() != null 
                    ? request.getProduct().getAppointmentType() 
                    : null;
                AppointmentType appointmentType = AppointmentType.fitting; // Mặc định là fitting
                if (appointmentTypeStr != null) {
                    try {
                        appointmentType = AppointmentType.valueOf(appointmentTypeStr.toLowerCase());
                    } catch (IllegalArgumentException e) {
                        // Nếu không match, giữ mặc định
                        appointmentType = AppointmentType.fitting;
                    }
                }
                appointmentRequest.setType(appointmentType);
                
                appointmentRequest.setAppointmentDate(appointmentDate);
                
                // Parse appointmentTime từ String hoặc set mặc định 09:00
                String appointmentTimeStr = request.getProduct() != null 
                    ? request.getProduct().getAppointmentTime() 
                    : null;
                LocalTime appointmentTime = LocalTime.of(9, 0); // Mặc định 09:00
                if (appointmentTimeStr != null && !appointmentTimeStr.trim().isEmpty()) {
                    try {
                        // Hỗ trợ format "HH:mm" hoặc "HH:mm:ss"
                        if (appointmentTimeStr.contains(":")) {
                            String[] parts = appointmentTimeStr.split(":");
                            int hour = Integer.parseInt(parts[0]);
                            int minute = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
                            appointmentTime = LocalTime.of(hour, minute);
                        }
                    } catch (Exception e) {
                        // Nếu parse lỗi, giữ mặc định
                        appointmentTime = LocalTime.of(9, 0);
                    }
                }
                appointmentRequest.setAppointmentTime(appointmentTime);
                
                // Set notes nếu có
                if (request.getProduct() != null && request.getProduct().getNotes() != null) {
                    appointmentRequest.setNotes(request.getProduct().getNotes());
                }
                
                // Tạo appointment (không cần currentUserId vì đây là tự động từ hệ thống)
                appointmentService.create(appointmentRequest, null);
            } catch (Exception e) {
                // Log lỗi nhưng không block order creation
                System.err.println("Failed to create appointment for order " + order.getId() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        
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

    private String buildWizardNote(OrderWizardRequest request) {
        StringBuilder builder = new StringBuilder();
        if (request.getProduct() != null) {
            if (request.getProduct().getDescription() != null) {
                builder.append("Description: ")
                        .append(request.getProduct().getDescription())
                        .append(". ");
            }
            if (request.getProduct().getNotes() != null) {
                builder.append("Notes: ")
                        .append(request.getProduct().getNotes())
                        .append(". ");
            }
        }
        return builder.length() == 0 ? null : builder.toString().trim();
    }

    private boolean isTransitionAllowed(OrderStatus current, OrderStatus target) {
        return switch (current) {
            case DRAFT -> target == OrderStatus.WAITING_FOR_QUOTE || target == OrderStatus.CANCELLED;
            case WAITING_FOR_QUOTE -> target == OrderStatus.CONFIRMED || target == OrderStatus.CANCELLED;
            case CONFIRMED -> target == OrderStatus.IN_PROGRESS || target == OrderStatus.CANCELLED;
            case IN_PROGRESS -> target == OrderStatus.FITTING || target == OrderStatus.CANCELLED;
            case FITTING -> target == OrderStatus.COMPLETED || target == OrderStatus.CANCELLED
                    || target == OrderStatus.IN_PROGRESS; // allow revisions after fitting
            case COMPLETED, CANCELLED -> false;
        };
    }

    private void populateMeasurement(MeasurementEntity measurement, OrderResquest.Measurement measReq) {
        measurement.setChest(measReq.getChest());
        measurement.setWaist(measReq.getWaist());
        measurement.setHip(measReq.getHip());
        measurement.setShoulder(measReq.getShoulder());
        measurement.setSleeve(measReq.getSleeve());
        measurement.setBicep(measReq.getBicep());
        measurement.setInseam(measReq.getInseam());
        measurement.setOutseam(measReq.getOutseam());
        measurement.setNeck(measReq.getNeck());
        measurement.setThigh(measReq.getThigh());
        measurement.setCrotch(measReq.getCrotch());
        measurement.setAnkle(measReq.getAnkle());
        measurement.setShirtLength(measReq.getShirtLength());
        measurement.setPantsLength(measReq.getPantsLength());
        measurement.setHeight(measReq.getHeight());
        measurement.setWeight(measReq.getWeight());
        measurement.setFitPreference(measReq.getFitPreference());
        measurement.setNote(measReq.getNote());
    }

    private void populateMeasurement(MeasurementEntity measurement, OrderWizardRequest.Measurement measReq) {
        measurement.setChest(measReq.getChest());
        measurement.setWaist(measReq.getWaist());
        measurement.setHip(measReq.getHip());
        measurement.setShoulder(measReq.getShoulder());
        measurement.setSleeve(measReq.getSleeve());
        measurement.setBicep(measReq.getBicep());
        measurement.setNeck(measReq.getNeck());
        measurement.setThigh(measReq.getThigh());
        measurement.setCrotch(measReq.getCrotch());
        measurement.setAnkle(measReq.getAnkle());
        measurement.setShirtLength(measReq.getShirtLength());
        measurement.setPantsLength(measReq.getPantsLength());
        measurement.setHeight(measReq.getHeight());
        measurement.setWeight(measReq.getWeight());
        measurement.setNote(measReq.getNote());
    }

    private boolean hasMeasurementData(OrderWizardRequest.Measurement meas) {
        return meas.getChest() != null || meas.getWaist() != null || meas.getHip() != null
                || meas.getShoulder() != null || meas.getSleeve() != null || meas.getBicep() != null
                || meas.getThigh() != null || meas.getCrotch() != null || meas.getAnkle() != null
                || meas.getShirtLength() != null || meas.getPantsLength() != null || meas.getHeight() != null
                || meas.getWeight() != null || meas.getNeck() != null;
    }

    private OrderResponse mapToSummary(OrderEntity order) {
        OrderResponse dto = new OrderResponse();
        dto.setId(order.getId());
        dto.setCode(order.getCode());
        dto.setStatus(order.getStatus());
        dto.setTotal(order.getTotal());
        dto.setExpectedBudget(order.getExpectedBudget());
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

        var measurementPage = measurementRepository.findLatest(
                null,
                order.getId(),
                PageRequest.of(0, 1)
        );
        if (!measurementPage.isEmpty()) {
            MeasurementEntity m = measurementPage.getContent().get(0);
            OrderResponse.Measurement dm = new OrderResponse.Measurement();
            dm.setChest(m.getChest());
            dm.setWaist(m.getWaist());
            dm.setHip(m.getHip());
            dm.setShoulder(m.getShoulder());
            dm.setSleeve(m.getSleeve());
            dm.setBicep(m.getBicep());
            dm.setHeight(m.getHeight());
            dm.setWeight(m.getWeight());
            dm.setNeck(m.getNeck());
            dm.setThigh(m.getThigh());
            dm.setCrotch(m.getCrotch());
            dm.setAnkle(m.getAnkle());
            dm.setShirtLength(m.getShirtLength());
            dm.setPantsLength(m.getPantsLength());
            dm.setFitPreference(m.getFitPreference());
            dm.setNote(m.getNote());
            dto.setMeasurement(dm);
        }

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

package com.example.tailor_shop.modules.billing.service.impl;

import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.billing.domain.InvoiceEntity;
import com.example.tailor_shop.modules.billing.domain.InvoiceItemEntity;
import com.example.tailor_shop.modules.billing.domain.InvoiceStatus;
import com.example.tailor_shop.modules.billing.domain.PaymentProvider;
import com.example.tailor_shop.modules.billing.domain.PaymentStatus;
import com.example.tailor_shop.modules.billing.domain.PaymentTransactionEntity;
import com.example.tailor_shop.modules.billing.dto.InvoiceFilterRequest;
import com.example.tailor_shop.modules.billing.dto.InvoiceRequest;
import com.example.tailor_shop.modules.billing.dto.InvoiceResponse;
import com.example.tailor_shop.modules.billing.dto.PaymentCallbackRequest;
import com.example.tailor_shop.modules.billing.dto.PaymentRequest;
import com.example.tailor_shop.modules.billing.dto.PaymentResponse;
import com.example.tailor_shop.modules.billing.repository.InvoiceItemRepository;
import com.example.tailor_shop.modules.billing.repository.InvoiceRepository;
import com.example.tailor_shop.modules.billing.repository.PaymentTransactionRepository;
import com.example.tailor_shop.modules.billing.service.InvoiceService;
import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.repository.OrderRepository;
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
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceServiceImpl implements InvoiceService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> list(InvoiceFilterRequest filter, Pageable pageable) {
        java.time.OffsetDateTime from = null;
        java.time.OffsetDateTime to = null;
        if (filter != null && filter.getDateFrom() != null) {
            from = filter.getDateFrom().atStartOfDay().atOffset(java.time.ZoneOffset.UTC);
        }
        if (filter != null && filter.getDateTo() != null) {
            to = filter.getDateTo().plusDays(1).atStartOfDay().atOffset(java.time.ZoneOffset.UTC);
        }
        Page<InvoiceEntity> page = invoiceRepository.search(
                filter != null ? filter.getCode() : null,
                filter != null ? filter.getCustomerId() : null,
                filter != null ? filter.getStatus() : null,
                from,
                to,
                pageable
        );
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse detail(Long id, Long currentUserId, boolean isCustomer) {
        InvoiceEntity entity = invoiceRepository.findById(id)
                .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Invoice not found"));
        if (isCustomer && !Objects.equals(entity.getCustomer().getId(), currentUserId)) {
            throw new BadRequestException("Access denied");
        }
        return toResponse(entity);
    }

    @Override
    @Transactional
    public InvoiceResponse create(InvoiceRequest request, Long currentUserId) {
        UserEntity customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        UserEntity staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Staff not found"));

        OrderEntity order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new NotFoundException("Order not found"));
            if (!Objects.equals(order.getCustomer().getId(), customer.getId())) {
                throw new BadRequestException("Order does not belong to customer");
            }
        }

        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setCode(generateCode());
        invoice.setOrder(order);
        invoice.setCustomer(customer);
        invoice.setStaff(staff);
        invoice.setStatus(InvoiceStatus.issued);
        invoice.setCurrency(request.getCurrency());
        invoice.setNotes(request.getNotes());
        invoice.setDueDate(request.getDueDate());
        invoice.setIssuedAt(OffsetDateTime.now());
        invoice.setIsDeleted(false);

        BigDecimal subtotal = ZERO;
        BigDecimal taxAmount = request.getTaxAmount() != null ? request.getTaxAmount() : ZERO;
        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : ZERO;

        List<InvoiceItemEntity> items = request.getItems().stream().map(item -> {
            InvoiceItemEntity entity = new InvoiceItemEntity();
            entity.setName(item.getName());
            entity.setQuantity(item.getQuantity());
            entity.setUnitPrice(item.getUnitPrice());
            entity.setDiscountAmount(item.getDiscountAmount() != null ? item.getDiscountAmount() : ZERO);
            entity.setTaxRate(item.getTaxRate() != null ? item.getTaxRate() : ZERO);

            BigDecimal lineBase = item.getUnitPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()))
                    .subtract(entity.getDiscountAmount());
            BigDecimal lineTax = lineBase.multiply(entity.getTaxRate()).divide(BigDecimal.valueOf(100));
            BigDecimal lineTotal = lineBase.add(lineTax);

            entity.setLineTotal(lineTotal);
            return entity;
        }).collect(Collectors.toList());

        for (InvoiceItemEntity item : items) {
            subtotal = subtotal.add(item.getLineTotal());
        }

        if (taxAmount.compareTo(ZERO) <= 0) {
            taxAmount = ZERO;
        }
        BigDecimal total = subtotal.add(taxAmount).subtract(discount);
        if (total.compareTo(ZERO) < 0) {
            throw new BadRequestException("Total amount cannot be negative");
        }

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setDiscountAmount(discount);
        invoice.setTotal(total);
        invoice.setPaidAmount(ZERO);
        invoice.setDueAmount(total);

        InvoiceEntity savedInvoice = invoiceRepository.save(invoice);
        for (InvoiceItemEntity item : items) {
            item.setInvoice(savedInvoice);
        }
        invoiceItemRepository.saveAll(items);
        savedInvoice.setItems(items);

        return toResponse(savedInvoice);
    }

    @Override
    @Transactional
    public PaymentResponse addPayment(PaymentRequest request, Long currentUserId) {
        InvoiceEntity invoice = invoiceRepository.findById(request.getInvoiceId())
                .filter(i -> !Boolean.TRUE.equals(i.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Invoice not found"));

        if (invoice.getStatus() == InvoiceStatus.voided || invoice.getStatus() == InvoiceStatus.refunded) {
            throw new BadRequestException("Invoice is not payable");
        }

        BigDecimal dueAmount = invoice.getDueAmount();
        if (request.getAmount().compareTo(dueAmount) > 0) {
            throw new BadRequestException("Payment amount exceeds due amount");
        }

        PaymentTransactionEntity transaction = new PaymentTransactionEntity();
        transaction.setInvoice(invoice);
        transaction.setProvider(request.getProvider());
        transaction.setStatus(
                request.getProvider() == PaymentProvider.cash ? PaymentStatus.success : PaymentStatus.pending
        );
        transaction.setAmount(request.getAmount());
        transaction.setProviderRef(UUID.randomUUID().toString());
        transaction.setRequestPayload(null);
        transaction.setResponsePayload(null);
        transaction.setCreatedBy(currentUserId != null
                ? userRepository.findById(currentUserId).orElse(null)
                : null);
        if (transaction.getStatus() == PaymentStatus.success) {
            transaction.setPaidAt(OffsetDateTime.now());
            applyPayment(invoice, transaction.getAmount());
        }

        transaction = paymentTransactionRepository.save(transaction);
        invoice.getTransactions().add(transaction);
        invoiceRepository.save(invoice);

        String paymentUrl = request.getProvider() == PaymentProvider.cash ? null : buildDummyPaymentUrl(transaction);

        return PaymentResponse.builder()
                .transactionId(transaction.getId())
                .invoiceId(invoice.getId())
                .provider(transaction.getProvider())
                .status(transaction.getStatus())
                .amount(transaction.getAmount())
                .providerRef(transaction.getProviderRef())
                .paymentUrl(paymentUrl)
                .paidAt(transaction.getPaidAt())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse handleCallback(PaymentCallbackRequest request) {
        PaymentTransactionEntity transaction = paymentTransactionRepository.findByProviderRef(request.getProviderRef())
                .orElseThrow(() -> new NotFoundException("Transaction not found"));

        if (transaction.getStatus() == PaymentStatus.success) {
            return toPaymentResponse(transaction, null);
        }

        transaction.setResponsePayload(request.getRawPayload());
        transaction.setStatus(request.getSuccess() ? PaymentStatus.success : PaymentStatus.failed);
        if (request.getSuccess()) {
            transaction.setPaidAt(OffsetDateTime.now());
            applyPayment(transaction.getInvoice(), transaction.getAmount());
        }
        transaction = paymentTransactionRepository.save(transaction);
        invoiceRepository.save(transaction.getInvoice());

        return toPaymentResponse(transaction, null);
    }

    @Override
    @Transactional
    public void voidInvoice(Long id, Long currentUserId) {
        InvoiceEntity invoice = invoiceRepository.findById(id)
                .filter(i -> !Boolean.TRUE.equals(i.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Invoice not found"));
        if (invoice.getPaidAmount().compareTo(ZERO) > 0) {
            throw new BadRequestException("Cannot void an invoice with successful payments");
        }
        invoice.setStatus(InvoiceStatus.voided);
        invoiceRepository.save(invoice);
    }

    private void applyPayment(InvoiceEntity invoice, BigDecimal amount) {
        BigDecimal newPaid = invoice.getPaidAmount().add(amount);
        BigDecimal newDue = invoice.getTotal().subtract(newPaid);
        if (newDue.compareTo(ZERO) < 0) {
            throw new BadRequestException("Payment exceeds invoice total");
        }
        invoice.setPaidAmount(newPaid);
        invoice.setDueAmount(newDue);
        if (newDue.compareTo(ZERO) == 0) {
            invoice.setStatus(InvoiceStatus.paid);
        } else {
            invoice.setStatus(InvoiceStatus.partial_paid);
        }
    }

    private PaymentResponse toPaymentResponse(PaymentTransactionEntity tx, String paymentUrl) {
        return PaymentResponse.builder()
                .transactionId(tx.getId())
                .invoiceId(tx.getInvoice().getId())
                .provider(tx.getProvider())
                .status(tx.getStatus())
                .amount(tx.getAmount())
                .providerRef(tx.getProviderRef())
                .paymentUrl(paymentUrl)
                .paidAt(tx.getPaidAt())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private InvoiceResponse toResponse(InvoiceEntity entity) {
        InvoiceResponse.Party customer = InvoiceResponse.Party.builder()
                .id(entity.getCustomer().getId())
                .name(entity.getCustomer().getName())
                .role(entity.getCustomer().getRole() != null ? entity.getCustomer().getRole().getCode() : null)
                .phone(entity.getCustomer().getPhone())
                .build();

        InvoiceResponse.Party staff = InvoiceResponse.Party.builder()
                .id(entity.getStaff().getId())
                .name(entity.getStaff().getName())
                .role(entity.getStaff().getRole() != null ? entity.getStaff().getRole().getCode() : null)
                .phone(entity.getStaff().getPhone())
                .build();

        List<InvoiceResponse.ItemResponse> itemResponses = entity.getItems().stream()
                .map(item -> InvoiceResponse.ItemResponse.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .discountAmount(item.getDiscountAmount())
                        .taxRate(item.getTaxRate())
                        .lineTotal(item.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        List<InvoiceResponse.TransactionResponse> txResponses = entity.getTransactions().stream()
                .map(tx -> InvoiceResponse.TransactionResponse.builder()
                        .id(tx.getId())
                        .provider(tx.getProvider())
                        .status(tx.getStatus())
                        .amount(tx.getAmount())
                        .providerRef(tx.getProviderRef())
                        .paidAt(tx.getPaidAt())
                        .createdAt(tx.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return InvoiceResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .orderId(entity.getOrder() != null ? entity.getOrder().getId() : null)
                .customer(customer)
                .staff(staff)
                .status(entity.getStatus())
                .currency(entity.getCurrency())
                .subtotal(entity.getSubtotal())
                .taxAmount(entity.getTaxAmount())
                .discountAmount(entity.getDiscountAmount())
                .total(entity.getTotal())
                .paidAmount(entity.getPaidAmount())
                .dueAmount(entity.getDueAmount())
                .issuedAt(entity.getIssuedAt())
                .dueDate(entity.getDueDate())
                .notes(entity.getNotes())
                .items(itemResponses)
                .transactions(txResponses)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String generateCode() {
        return "INV-" + TraceIdUtil.getOrCreateTraceId();
    }

    private String buildDummyPaymentUrl(PaymentTransactionEntity transaction) {
        return "https://pay.example.com/redirect?ref=" + transaction.getProviderRef();
    }
}



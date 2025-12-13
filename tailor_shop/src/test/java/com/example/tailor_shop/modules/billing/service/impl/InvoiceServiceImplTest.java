package com.example.tailor_shop.modules.billing.service.impl;

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
import com.example.tailor_shop.modules.order.domain.OrderEntity;
import com.example.tailor_shop.modules.order.repository.OrderRepository;
import com.example.tailor_shop.modules.user.domain.RoleEntity;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("InvoiceServiceImpl Unit Tests")
class InvoiceServiceImplTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceItemRepository invoiceItemRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    private UserEntity customer;
    private UserEntity staff;
    private OrderEntity order;
    private InvoiceEntity invoice;
    private RoleEntity customerRole;
    private RoleEntity staffRole;

    @BeforeEach
    void setUp() {
        customerRole = new RoleEntity();
        customerRole.setId(1L);
        customerRole.setCode("CUSTOMER");
        customerRole.setName("Customer");

        staffRole = new RoleEntity();
        staffRole.setId(2L);
        staffRole.setCode("STAFF");
        staffRole.setName("Staff");

        customer = new UserEntity();
        customer.setId(1L);
        customer.setUsername("customer1");
        customer.setName("Nguyễn Văn A");
        customer.setEmail("customer@test.com");
        customer.setPhone("0123456789");
        customer.setRole(customerRole);

        staff = new UserEntity();
        staff.setId(2L);
        staff.setUsername("staff1");
        staff.setName("Trần Thị B");
        staff.setEmail("staff@test.com");
        staff.setPhone("0987654321");
        staff.setRole(staffRole);

        order = new OrderEntity();
        order.setId(1L);
        order.setCustomer(customer);

        invoice = new InvoiceEntity();
        invoice.setId(1L);
        invoice.setCode("INV-TEST-001");
        invoice.setOrder(order);
        invoice.setCustomer(customer);
        invoice.setStaff(staff);
        invoice.setStatus(InvoiceStatus.issued);
        invoice.setCurrency("VND");
        invoice.setSubtotal(new BigDecimal("1000000"));
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setDiscountAmount(BigDecimal.ZERO);
        invoice.setTotal(new BigDecimal("1000000"));
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setDueAmount(new BigDecimal("1000000"));
        invoice.setIssuedAt(OffsetDateTime.now());
        invoice.setDueDate(LocalDate.now().plusDays(30));
        invoice.setIsDeleted(false);
        invoice.setItems(new ArrayList<>());
        invoice.setTransactions(new ArrayList<>());
    }

    @Test
    @DisplayName("List invoices - Success with filter")
    void testList_Success() {
        // Given
        InvoiceFilterRequest filter = InvoiceFilterRequest.builder()
                .code("INV-")
                .customerId(1L)
                .status(InvoiceStatus.issued)
                .dateFrom(LocalDate.of(2024, 1, 1))
                .dateTo(LocalDate.of(2024, 12, 31))
                .build();

        Pageable pageable = PageRequest.of(0, 20);
        Page<InvoiceEntity> page = new PageImpl<>(List.of(invoice));

        when(invoiceRepository.search(
                eq("INV-"),
                eq(1L),
                eq(InvoiceStatus.issued),
                any(OffsetDateTime.class),
                any(OffsetDateTime.class),
                eq(pageable)
        )).thenReturn(page);

        // When
        Page<InvoiceResponse> result = invoiceService.list(filter, pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(invoiceRepository, times(1)).search(
                eq("INV-"),
                eq(1L),
                eq(InvoiceStatus.issued),
                any(OffsetDateTime.class),
                any(OffsetDateTime.class),
                eq(pageable)
        );
    }

    @Test
    @DisplayName("List invoices - Success with null filter")
    void testList_WithNullFilter() {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Page<InvoiceEntity> page = new PageImpl<>(List.of(invoice));

        when(invoiceRepository.search(
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                eq(pageable)
        )).thenReturn(page);

        // When
        Page<InvoiceResponse> result = invoiceService.list(null, pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(invoiceRepository, times(1)).search(
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                eq(pageable)
        );
    }

    @Test
    @DisplayName("Detail invoice - Success")
    void testDetail_Success() {
        // Given
        Long invoiceId = 1L;
        Long currentUserId = 1L;
        boolean isCustomer = false;

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        // When
        InvoiceResponse result = invoiceService.detail(invoiceId, currentUserId, isCustomer);

        // Then
        assertNotNull(result);
        assertEquals(invoiceId, result.getId());
        assertEquals("INV-TEST-001", result.getCode());
        verify(invoiceRepository, times(1)).findById(invoiceId);
    }

    @Test
    @DisplayName("Detail invoice - Not found")
    void testDetail_NotFound() {
        // Given
        Long invoiceId = 999L;
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            invoiceService.detail(invoiceId, 1L, false);
        });
        verify(invoiceRepository, times(1)).findById(invoiceId);
    }

    @Test
    @DisplayName("Detail invoice - Soft deleted")
    void testDetail_SoftDeleted() {
        // Given
        Long invoiceId = 1L;
        invoice.setIsDeleted(true);
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            invoiceService.detail(invoiceId, 1L, false);
        });
    }

    @Test
    @DisplayName("Detail invoice - Customer access denied")
    void testDetail_CustomerAccessDenied() {
        // Given
        Long invoiceId = 1L;
        Long currentUserId = 999L; // Different customer
        boolean isCustomer = true;

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            invoiceService.detail(invoiceId, currentUserId, isCustomer);
        });
    }

    @Test
    @DisplayName("Detail invoice - Customer access allowed")
    void testDetail_CustomerAccessAllowed() {
        // Given
        Long invoiceId = 1L;
        Long currentUserId = 1L; // Same customer
        boolean isCustomer = true;

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        // When
        InvoiceResponse result = invoiceService.detail(invoiceId, currentUserId, isCustomer);

        // Then
        assertNotNull(result);
        assertEquals(invoiceId, result.getId());
    }

    @Test
    @DisplayName("Create invoice - Success without order")
    void testCreate_SuccessWithoutOrder() {
        // Given
        InvoiceRequest request = InvoiceRequest.builder()
                .customerId(1L)
                .staffId(2L)
                .currency("VND")
                .discountAmount(new BigDecimal("50000"))
                .taxAmount(BigDecimal.ZERO)
                .dueDate(LocalDate.now().plusDays(30))
                .notes("Test invoice")
                .items(List.of(
                        InvoiceRequest.ItemRequest.builder()
                                .name("May áo sơ mi")
                                .quantity(2)
                                .unitPrice(new BigDecimal("500000"))
                                .discountAmount(BigDecimal.ZERO)
                                .taxRate(new BigDecimal("10"))
                                .build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenAnswer(invocation -> {
            InvoiceEntity inv = invocation.getArgument(0);
            inv.setId(1L);
            return inv;
        });
        when(invoiceItemRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<InvoiceItemEntity> items = invocation.getArgument(0);
            for (int i = 0; i < items.size(); i++) {
                items.get(i).setId((long) (i + 1));
            }
            return items;
        });

        // When
        InvoiceResponse result = invoiceService.create(request, 2L);

        // Then
        assertNotNull(result);
        assertNotNull(result.getCode());
        assertTrue(result.getCode().startsWith("INV-"));
        assertEquals(InvoiceStatus.issued, result.getStatus());
        assertEquals(1, result.getItems().size());
        assertEquals(new BigDecimal("1100000"), result.getSubtotal());
        assertEquals(new BigDecimal("1050000"), result.getTotal()); // subtotal - discount
        assertEquals(BigDecimal.ZERO, result.getPaidAmount());
        assertEquals(new BigDecimal("1050000"), result.getDueAmount());

        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).findById(2L);
        verify(orderRepository, never()).findById(anyLong());
        verify(invoiceRepository, times(1)).save(any(InvoiceEntity.class));
        verify(invoiceItemRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("Create invoice - Success with order")
    void testCreate_SuccessWithOrder() {
        // Given
        InvoiceRequest request = InvoiceRequest.builder()
                .orderId(1L)
                .customerId(1L)
                .staffId(2L)
                .currency("VND")
                .dueDate(LocalDate.now().plusDays(30))
                .items(List.of(
                        InvoiceRequest.ItemRequest.builder()
                                .name("May quần âu")
                                .quantity(1)
                                .unitPrice(new BigDecimal("800000"))
                                .discountAmount(new BigDecimal("50000"))
                                .taxRate(new BigDecimal("10"))
                                .build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenAnswer(invocation -> {
            InvoiceEntity inv = invocation.getArgument(0);
            inv.setId(1L);
            return inv;
        });
        when(invoiceItemRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<InvoiceItemEntity> items = invocation.getArgument(0);
            items.get(0).setId(1L);
            return items;
        });

        // When
        InvoiceResponse result = invoiceService.create(request, 2L);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getOrderId());
        verify(orderRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Create invoice - Customer not found")
    void testCreate_CustomerNotFound() {
        // Given
        InvoiceRequest request = InvoiceRequest.builder()
                .customerId(999L)
                .staffId(2L)
                .currency("VND")
                .items(List.of(
                        InvoiceRequest.ItemRequest.builder()
                                .name("Item")
                                .quantity(1)
                                .unitPrice(new BigDecimal("100000"))
                                .build()
                ))
                .build();

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            invoiceService.create(request, 2L);
        });
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create invoice - Staff not found")
    void testCreate_StaffNotFound() {
        // Given
        InvoiceRequest request = InvoiceRequest.builder()
                .customerId(1L)
                .staffId(999L)
                .currency("VND")
                .items(List.of(
                        InvoiceRequest.ItemRequest.builder()
                                .name("Item")
                                .quantity(1)
                                .unitPrice(new BigDecimal("100000"))
                                .build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            invoiceService.create(request, 2L);
        });
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create invoice - Order not found")
    void testCreate_OrderNotFound() {
        // Given
        InvoiceRequest request = InvoiceRequest.builder()
                .orderId(999L)
                .customerId(1L)
                .staffId(2L)
                .currency("VND")
                .items(List.of(
                        InvoiceRequest.ItemRequest.builder()
                                .name("Item")
                                .quantity(1)
                                .unitPrice(new BigDecimal("100000"))
                                .build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            invoiceService.create(request, 2L);
        });
    }

    @Test
    @DisplayName("Create invoice - Order does not belong to customer")
    void testCreate_OrderNotBelongToCustomer() {
        // Given
        UserEntity otherCustomer = new UserEntity();
        otherCustomer.setId(999L);
        otherCustomer.setUsername("other");
        otherCustomer.setName("Other Customer");
        otherCustomer.setEmail("other@test.com");
        otherCustomer.setPhone("0000000000");
        otherCustomer.setRole(customerRole);

        OrderEntity otherOrder = new OrderEntity();
        otherOrder.setId(2L);
        otherOrder.setCustomer(otherCustomer);

        InvoiceRequest request = InvoiceRequest.builder()
                .orderId(2L)
                .customerId(1L)
                .staffId(2L)
                .currency("VND")
                .items(List.of(
                        InvoiceRequest.ItemRequest.builder()
                                .name("Item")
                                .quantity(1)
                                .unitPrice(new BigDecimal("100000"))
                                .build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));
        when(orderRepository.findById(2L)).thenReturn(Optional.of(otherOrder));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            invoiceService.create(request, 2L);
        });
    }

    @Test
    @DisplayName("Create invoice - Negative total")
    void testCreate_NegativeTotal() {
        // Given
        InvoiceRequest request = InvoiceRequest.builder()
                .customerId(1L)
                .staffId(2L)
                .currency("VND")
                .discountAmount(new BigDecimal("2000000")) // Larger than subtotal
                .items(List.of(
                        InvoiceRequest.ItemRequest.builder()
                                .name("Item")
                                .quantity(1)
                                .unitPrice(new BigDecimal("100000"))
                                .build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenAnswer(invocation -> {
            InvoiceEntity inv = invocation.getArgument(0);
            inv.setId(1L);
            return inv;
        });
        when(invoiceItemRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<InvoiceItemEntity> items = invocation.getArgument(0);
            items.get(0).setId(1L);
            return items;
        });

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            invoiceService.create(request, 2L);
        });
    }

    @Test
    @DisplayName("Add payment - Success cash")
    void testAddPayment_SuccessCash() {
        // Given
        PaymentRequest request = PaymentRequest.builder()
                .invoiceId(1L)
                .provider(PaymentProvider.cash)
                .amount(new BigDecimal("500000"))
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(paymentTransactionRepository.save(any(PaymentTransactionEntity.class))).thenAnswer(invocation -> {
            PaymentTransactionEntity tx = invocation.getArgument(0);
            tx.setId(1L);
            tx.setCreatedAt(OffsetDateTime.now());
            return tx;
        });
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenReturn(invoice);

        // When
        PaymentResponse result = invoiceService.addPayment(request, 2L);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getInvoiceId());
        assertEquals(PaymentProvider.cash, result.getProvider());
        assertEquals(PaymentStatus.success, result.getStatus());
        assertEquals(new BigDecimal("500000"), result.getAmount());
        assertNotNull(result.getPaidAt());
        assertNotNull(result.getProviderRef());

        verify(invoiceRepository, times(1)).findById(1L);
        verify(paymentTransactionRepository, times(1)).save(any(PaymentTransactionEntity.class));
        verify(invoiceRepository, times(1)).save(any(InvoiceEntity.class));

        ArgumentCaptor<InvoiceEntity> invoiceCaptor = ArgumentCaptor.forClass(InvoiceEntity.class);
        verify(invoiceRepository).save(invoiceCaptor.capture());
        InvoiceEntity savedInvoice = invoiceCaptor.getValue();
        assertEquals(new BigDecimal("500000"), savedInvoice.getPaidAmount());
        assertEquals(new BigDecimal("500000"), savedInvoice.getDueAmount());
        assertEquals(InvoiceStatus.partial_paid, savedInvoice.getStatus());
    }

    @Test
    @DisplayName("Add payment - Success online (pending)")
    void testAddPayment_SuccessOnline() {
        // Given
        PaymentRequest request = PaymentRequest.builder()
                .invoiceId(1L)
                .provider(PaymentProvider.vnpay)
                .amount(new BigDecimal("1000000"))
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(paymentTransactionRepository.save(any(PaymentTransactionEntity.class))).thenAnswer(invocation -> {
            PaymentTransactionEntity tx = invocation.getArgument(0);
            tx.setId(1L);
            tx.setCreatedAt(OffsetDateTime.now());
            return tx;
        });
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenReturn(invoice);

        // When
        PaymentResponse result = invoiceService.addPayment(request, 2L);

        // Then
        assertNotNull(result);
        assertEquals(PaymentProvider.vnpay, result.getProvider());
        assertEquals(PaymentStatus.pending, result.getStatus());
        assertNotNull(result.getPaymentUrl());
        assertTrue(result.getPaymentUrl().contains("pay.example.com"));

        verify(paymentTransactionRepository, times(1)).save(any(PaymentTransactionEntity.class));
    }

    @Test
    @DisplayName("Add payment - Invoice not found")
    void testAddPayment_InvoiceNotFound() {
        // Given
        PaymentRequest request = PaymentRequest.builder()
                .invoiceId(999L)
                .provider(PaymentProvider.cash)
                .amount(new BigDecimal("500000"))
                .build();

        when(invoiceRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            invoiceService.addPayment(request, 2L);
        });
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Add payment - Invoice voided")
    void testAddPayment_InvoiceVoided() {
        // Given
        invoice.setStatus(InvoiceStatus.voided);
        PaymentRequest request = PaymentRequest.builder()
                .invoiceId(1L)
                .provider(PaymentProvider.cash)
                .amount(new BigDecimal("500000"))
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            invoiceService.addPayment(request, 2L);
        });
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Add payment - Amount exceeds due amount")
    void testAddPayment_AmountExceedsDue() {
        // Given
        PaymentRequest request = PaymentRequest.builder()
                .invoiceId(1L)
                .provider(PaymentProvider.cash)
                .amount(new BigDecimal("2000000")) // Exceeds dueAmount (1000000)
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            invoiceService.addPayment(request, 2L);
        });
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Add payment - Full payment (paid status)")
    void testAddPayment_FullPayment() {
        // Given
        PaymentRequest request = PaymentRequest.builder()
                .invoiceId(1L)
                .provider(PaymentProvider.cash)
                .amount(new BigDecimal("1000000")) // Full amount
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(paymentTransactionRepository.save(any(PaymentTransactionEntity.class))).thenAnswer(invocation -> {
            PaymentTransactionEntity tx = invocation.getArgument(0);
            tx.setId(1L);
            tx.setCreatedAt(OffsetDateTime.now());
            return tx;
        });
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenReturn(invoice);

        // When
        PaymentResponse result = invoiceService.addPayment(request, 2L);

        // Then
        assertNotNull(result);
        assertEquals(PaymentStatus.success, result.getStatus());

        ArgumentCaptor<InvoiceEntity> invoiceCaptor = ArgumentCaptor.forClass(InvoiceEntity.class);
        verify(invoiceRepository).save(invoiceCaptor.capture());
        InvoiceEntity savedInvoice = invoiceCaptor.getValue();
        assertEquals(InvoiceStatus.paid, savedInvoice.getStatus());
        assertEquals(BigDecimal.ZERO, savedInvoice.getDueAmount());
    }

    @Test
    @DisplayName("Handle callback - Success")
    void testHandleCallback_Success() {
        // Given
        PaymentTransactionEntity transaction = PaymentTransactionEntity.builder()
                .id(1L)
                .invoice(invoice)
                .provider(PaymentProvider.vnpay)
                .status(PaymentStatus.pending)
                .amount(new BigDecimal("1000000"))
                .providerRef("ref-123")
                .build();

        PaymentCallbackRequest request = PaymentCallbackRequest.builder()
                .provider(PaymentProvider.vnpay)
                .providerRef("ref-123")
                .success(true)
                .amount(new BigDecimal("1000000"))
                .rawPayload("{\"status\":\"success\"}")
                .build();

        when(paymentTransactionRepository.findByProviderRef("ref-123"))
                .thenReturn(Optional.of(transaction));
        when(paymentTransactionRepository.save(any(PaymentTransactionEntity.class)))
                .thenReturn(transaction);
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenReturn(invoice);

        // When
        PaymentResponse result = invoiceService.handleCallback(request);

        // Then
        assertNotNull(result);
        assertEquals(PaymentStatus.success, result.getStatus());
        assertNotNull(result.getPaidAt());

        verify(paymentTransactionRepository, times(1)).findByProviderRef("ref-123");
        verify(paymentTransactionRepository, times(1)).save(any(PaymentTransactionEntity.class));
        verify(invoiceRepository, times(1)).save(any(InvoiceEntity.class));
    }

    @Test
    @DisplayName("Handle callback - Failed")
    void testHandleCallback_Failed() {
        // Given
        PaymentTransactionEntity transaction = new PaymentTransactionEntity();
        transaction.setId(1L);
        transaction.setInvoice(invoice);
        transaction.setProvider(PaymentProvider.vnpay);
        transaction.setStatus(PaymentStatus.pending);
        transaction.setAmount(new BigDecimal("1000000"));
        transaction.setProviderRef("ref-123");

        PaymentCallbackRequest request = PaymentCallbackRequest.builder()
                .provider(PaymentProvider.vnpay)
                .providerRef("ref-123")
                .success(false)
                .amount(new BigDecimal("1000000"))
                .rawPayload("{\"status\":\"failed\"}")
                .build();

        when(paymentTransactionRepository.findByProviderRef("ref-123"))
                .thenReturn(Optional.of(transaction));
        when(paymentTransactionRepository.save(any(PaymentTransactionEntity.class)))
                .thenReturn(transaction);
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenReturn(invoice);

        // When
        PaymentResponse result = invoiceService.handleCallback(request);

        // Then
        assertNotNull(result);
        assertEquals(PaymentStatus.failed, result.getStatus());

        verify(invoiceRepository, never()).save(any(InvoiceEntity.class)); // Invoice not updated on failure
    }

    @Test
    @DisplayName("Handle callback - Transaction not found")
    void testHandleCallback_TransactionNotFound() {
        // Given
        PaymentCallbackRequest request = PaymentCallbackRequest.builder()
                .provider(PaymentProvider.vnpay)
                .providerRef("ref-999")
                .success(true)
                .amount(new BigDecimal("1000000"))
                .build();

        when(paymentTransactionRepository.findByProviderRef("ref-999"))
                .thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            invoiceService.handleCallback(request);
        });
    }

    @Test
    @DisplayName("Handle callback - Idempotent (already success)")
    void testHandleCallback_Idempotent() {
        // Given
        PaymentTransactionEntity transaction = new PaymentTransactionEntity();
        transaction.setId(1L);
        transaction.setInvoice(invoice);
        transaction.setProvider(PaymentProvider.vnpay);
        transaction.setStatus(PaymentStatus.success); // Already success
        transaction.setAmount(new BigDecimal("1000000"));
        transaction.setProviderRef("ref-123");
        transaction.setPaidAt(OffsetDateTime.now());

        PaymentCallbackRequest request = PaymentCallbackRequest.builder()
                .provider(PaymentProvider.vnpay)
                .providerRef("ref-123")
                .success(true)
                .amount(new BigDecimal("1000000"))
                .build();

        when(paymentTransactionRepository.findByProviderRef("ref-123"))
                .thenReturn(Optional.of(transaction));

        // When
        PaymentResponse result = invoiceService.handleCallback(request);

        // Then
        assertNotNull(result);
        assertEquals(PaymentStatus.success, result.getStatus());

        // Should not save again (idempotent)
        verify(paymentTransactionRepository, never()).save(any());
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Void invoice - Success")
    void testVoidInvoice_Success() {
        // Given
        Long invoiceId = 1L;
        invoice.setPaidAmount(BigDecimal.ZERO);

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenReturn(invoice);

        // When
        invoiceService.voidInvoice(invoiceId, 2L);

        // Then
        ArgumentCaptor<InvoiceEntity> invoiceCaptor = ArgumentCaptor.forClass(InvoiceEntity.class);
        verify(invoiceRepository).save(invoiceCaptor.capture());
        InvoiceEntity savedInvoice = invoiceCaptor.getValue();
        assertEquals(InvoiceStatus.voided, savedInvoice.getStatus());

        verify(invoiceRepository, times(1)).findById(invoiceId);
        verify(invoiceRepository, times(1)).save(any(InvoiceEntity.class));
    }

    @Test
    @DisplayName("Void invoice - Not found")
    void testVoidInvoice_NotFound() {
        // Given
        Long invoiceId = 999L;
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            invoiceService.voidInvoice(invoiceId, 2L);
        });
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Void invoice - Has payments")
    void testVoidInvoice_HasPayments() {
        // Given
        Long invoiceId = 1L;
        invoice.setPaidAmount(new BigDecimal("500000")); // Has payment

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            invoiceService.voidInvoice(invoiceId, 2L);
        });
        verify(invoiceRepository, never()).save(any());
    }
}


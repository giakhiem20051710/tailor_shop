package com.myhien.tailor.modules.order.domain;

import com.myhien.tailor.modules.user.domain.UserEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String code;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_tailor_id")
    private UserEntity assignedTailor;
    
    @Column(length = 150)
    private String name;
    
    @Column(length = 30)
    private String phone;
    
    @Column(length = 180)
    private String email;
    
    @Column(length = 255)
    private String address;
    
    @Column(length = 200)
    private String productName;
    
    @Column(length = 100)
    private String productType;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(precision = 14, scale = 2)
    private BigDecimal budget;
    
    @Column(precision = 14, scale = 2)
    private BigDecimal total;
    
    @Column(precision = 14, scale = 2)
    private BigDecimal deposit;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private OrderStatus status = OrderStatus.PENDING;
    
    @Column(name = "receive_date")
    private LocalDate receiveDate;
    
    @Column(name = "due_date")
    private LocalDate dueDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_type", length = 20)
    private AppointmentType appointmentType;
    
    @Column(name = "appointment_date")
    private LocalDate appointmentDate;
    
    @Column(name = "appointment_time")
    private LocalTime appointmentTime;
    
    @Column(name = "promo_code", length = 50)
    private String promoCode;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "correction_notes", columnDefinition = "TEXT")
    private String correctionNotes;
    
    @Column(name = "sample_images", columnDefinition = "JSON")
    private String sampleImages; // JSON array as string
    
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
    
    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
    
    @PreUpdate
    void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
    
    public enum AppointmentType {
        pickup, delivery, fitting
    }
}


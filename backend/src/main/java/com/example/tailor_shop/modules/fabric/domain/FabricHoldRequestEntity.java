package com.example.tailor_shop.modules.fabric.domain;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

/**
 * Fabric Hold/Visit Request Entity - Yêu cầu giữ vải hoặc đặt lịch đến xem
 */
@Entity
@Table(name = "fabric_hold_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"fabric", "user", "handledBy"})
public class FabricHoldRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fabric_id", nullable = false)
    private FabricEntity fabric;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private FabricHoldRequestType type;

    @Column(name = "quantity", precision = 10, scale = 2)
    private BigDecimal quantity; // For HOLD type

    @Column(name = "requested_date")
    private LocalDate requestedDate; // For VISIT type

    @Column(name = "requested_time")
    private LocalTime requestedTime; // For VISIT type

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private FabricHoldRequestStatus status = FabricHoldRequestStatus.PENDING;

    @Column(name = "expiry_date")
    private LocalDate expiryDate; // For HOLD type

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "staff_notes", columnDefinition = "TEXT")
    private String staffNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by")
    private UserEntity handledBy;

    @Column(name = "handled_at")
    private OffsetDateTime handledAt;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}


package com.example.tailor_shop.modules.product.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "category_templates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_code", nullable = false, unique = true, length = 100)
    private String categoryCode; // e.g., "vest", "ao_dai"

    @Column(name = "category_name", nullable = false, length = 200)
    private String categoryName; // e.g., "Vest Nam", "Áo Dài"

    @Column(name = "tailoring_time", length = 100)
    private String tailoringTime;

    @Column(name = "fitting_count", length = 50)
    private String fittingCount;

    @Column(name = "warranty", length = 200)
    private String warranty;

    @Column(name = "silhouette", length = 200)
    private String silhouette;

    @Column(name = "materials", columnDefinition = "JSON")
    private String materials; // JSON array

    @Column(name = "colors", columnDefinition = "JSON")
    private String colors; // JSON array

    @Column(name = "length_info", length = 200)
    private String lengthInfo;

    @Column(name = "lining", length = 200)
    private String lining;

    @Column(name = "accessories", length = 500)
    private String accessories;

    @Column(name = "occasions", columnDefinition = "JSON")
    private String occasions; // JSON array

    @Column(name = "customer_styles", columnDefinition = "JSON")
    private String customerStyles; // JSON array

    @Column(name = "care_instructions", columnDefinition = "JSON")
    private String careInstructions; // JSON array

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}

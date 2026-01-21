package com.example.tailor_shop.modules.product.domain;

import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Image Asset Entity - Quản lý metadata của ảnh trên S3
 * Dùng để phân loại và filter ảnh khi upload hàng loạt
 */
@Entity
@Table(name = "image_assets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageAssetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "s3_key", nullable = false, length = 255)
    private String s3Key; // "templates/ao-dai-do-1.jpg"

    @Column(name = "url", length = 500)
    private String url; // full S3 URL (original or medium)

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl; // thumbnail URL (300x300)

    @Column(name = "large_url", length = 500)
    private String largeUrl; // large URL (1200px width)

    @Column(name = "category", nullable = false, length = 50)
    private String category; // "template", "fabric", "style"

    @Column(name = "type", nullable = false, length = 50)
    private String type; // "ao_dai", "quan_tay", "vest", ...

    @Column(name = "gender", length = 10)
    @Builder.Default
    private String gender = "unisex"; // "male", "female", "unisex"

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "JSON")
    private List<String> tags; // ["traditional", "red", "tet"]

    // === AI ANALYSIS FIELDS ===

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Mô tả chi tiết từ AI

    @Column(name = "occasion", length = 50)
    private String occasion; // daily, work, party, wedding...

    @Column(name = "season", length = 50)
    private String season; // spring, summer, autumn, winter

    @Column(name = "style_category", length = 50)
    private String styleCategory; // elegant, casual, vintage... (renamed from style to avoid conflict with
                                  // StyleEntity)

    @Column(name = "silhouette", length = 200)
    private String silhouette; // Form dáng

    @Column(name = "length_info", length = 200)
    private String lengthInfo; // Độ dài

    @Column(name = "lining", length = 200)
    private String lining; // Thông tin lót

    @Column(name = "accessories", length = 500)
    private String accessories; // Phụ kiện gợi ý

    @Column(name = "tailoring_time", length = 50)
    private String tailoringTime; // Thời gian may

    @Column(name = "fitting_count", length = 50)
    private String fittingCount; // Số lần thử

    @Column(name = "warranty", length = 200)
    private String warranty; // Bảo hành

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "materials", columnDefinition = "JSON")
    private List<String> materials; // ["Lụa", "Satin"]

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "colors", columnDefinition = "JSON")
    private List<String> colors; // ["Đỏ", "Xanh"]

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "occasions", columnDefinition = "JSON")
    private List<String> occasions; // ["Cưới hỏi", "Lễ tối"]

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "customer_styles", columnDefinition = "JSON")
    private List<String> customerStyles; // ["Nữ tính", "Thanh lịch"]

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "care_instructions", columnDefinition = "JSON")
    private List<String> careInstructions; // ["Giặt tay"]

    @Column(name = "confidence")
    private Double confidence; // Độ tin cậy AI

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_template_id")
    private ProductTemplateEntity productTemplate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fabric_id")
    private FabricEntity fabric;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "style_id")
    private StyleEntity style;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}

package com.example.tailor_shop.modules.favorite.domain;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/**
 * Favorite Entity - Danh sách yêu thích generic (có thể chứa nhiều loại sản phẩm)
 * Giống Shopee, FPT Shop: Favorite là module riêng
 */
@Entity
@Table(name = "favorites")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"user"})
public class FavoriteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // Legacy field - database có field customer_id yêu cầu có giá trị
    // Set cùng giá trị với user.id
    @Column(name = "customer_id", nullable = false)
    private Long customerId; // Legacy field - set cùng giá trị với user.id

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 50)
    private FavoriteItemType itemType;

    @Column(name = "item_id", nullable = false)
    private Long itemId; // ID của sản phẩm (product_id, fabric_id, service_id, etc.)

    @Column(name = "item_key", length = 100)
    private String itemKey; // Key của sản phẩm (product_key, fabric_code, etc.) - để backward compatibility
    
    // Legacy field - database có field product_key yêu cầu có giá trị
    // Map cùng giá trị với item_key
    @Column(name = "product_key", length = 100)
    private String productKey; // Legacy field - set cùng giá trị với itemKey

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}


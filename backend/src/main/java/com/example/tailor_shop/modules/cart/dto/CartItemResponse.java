package com.example.tailor_shop.modules.cart.dto;

import com.example.tailor_shop.modules.cart.domain.CartItemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * DTO cho cart item response (generic)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private Long id;
    private CartItemType itemType;
    private Long itemId;
    private String itemName; // Tên sản phẩm (lấy từ Product/Fabric service)
    private String itemCode; // Code sản phẩm
    private String itemImage; // Hình ảnh
    private BigDecimal itemPrice; // Giá sản phẩm
    private BigDecimal quantity;
    private BigDecimal subtotal; // quantity * itemPrice
    private BigDecimal availableQuantity; // Số lượng có sẵn
    private Boolean isAvailable; // Còn hàng không
    private OffsetDateTime addedAt;
    private OffsetDateTime updatedAt;
}


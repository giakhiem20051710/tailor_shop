package com.example.tailor_shop.modules.cart.service.impl;

import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.cart.domain.CartItemEntity;
import com.example.tailor_shop.modules.cart.domain.CartItemType;
import com.example.tailor_shop.modules.cart.dto.AddToCartRequest;
import com.example.tailor_shop.modules.cart.dto.CartItemResponse;
import com.example.tailor_shop.modules.cart.dto.CartSummaryResponse;
import com.example.tailor_shop.modules.cart.repository.CartItemRepository;
import com.example.tailor_shop.modules.cart.service.CartService;
import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import com.example.tailor_shop.modules.fabric.repository.FabricInventoryRepository;
import com.example.tailor_shop.modules.fabric.repository.FabricRepository;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Cart Service Implementation - Module riêng, có thể tái sử dụng cho nhiều loại sản phẩm
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    
    // Dependencies cho các loại sản phẩm (có thể inject thêm ProductService, ServiceService, etc.)
    private final FabricRepository fabricRepository;
    private final FabricInventoryRepository fabricInventoryRepository;

    @Override
    @Transactional
    public CartItemResponse addToCart(AddToCartRequest request, Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Validate item based on type
        validateItem(request.getItemType(), request.getItemId(), request.getQuantity());

        // Find existing cart item or create new
        CartItemEntity cartItem = cartItemRepository
                .findByUserIdAndItemTypeAndItemId(userId, request.getItemType(), request.getItemId())
                .orElseGet(() -> CartItemEntity.builder()
                        .user(user)
                        .itemType(request.getItemType())
                        .itemId(request.getItemId())
                        .quantity(BigDecimal.ZERO)
                        .build());

        cartItem.setQuantity(cartItem.getQuantity().add(request.getQuantity()));
        cartItem = cartItemRepository.save(cartItem);

        log.info("[TraceId: {}] Added to cart: type={}, itemId={}, quantity={}, userId={}",
                TraceIdUtil.getTraceId(), request.getItemType(), request.getItemId(), request.getQuantity(), userId);

        return toCartItemResponse(cartItem);
    }

    @Override
    @Transactional(readOnly = true)
    public CartSummaryResponse getCart(Long userId) {
        List<CartItemEntity> cartItems = cartItemRepository.findByUserId(userId);

        List<CartItemResponse> items = cartItems.stream()
                .map(this::toCartItemResponse)
                .collect(Collectors.toList());

        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::getSubtotal)
                .filter(sub -> sub != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean hasAvailableItems = items.stream()
                .allMatch(item -> Boolean.TRUE.equals(item.getIsAvailable()) &&
                        item.getQuantity().compareTo(item.getAvailableQuantity()) <= 0);

        return CartSummaryResponse.builder()
                .items(items)
                .itemCount(items.size())
                .subtotal(subtotal)
                .discountAmount(BigDecimal.ZERO) // Will be calculated at checkout
                .shippingFee(BigDecimal.ZERO) // Will be calculated at checkout
                .total(subtotal)
                .hasAvailableItems(hasAvailableItems)
                .build();
    }

    @Override
    @Transactional
    public void updateCartItem(Long cartItemId, BigDecimal quantity, Long userId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .filter(item -> item.getUser().getId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Cart item not found"));

        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            cartItemRepository.delete(cartItem);
            return;
        }

        // Validate quantity based on item type
        validateItemQuantity(cartItem.getItemType(), cartItem.getItemId(), quantity);

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
    }

    @Override
    @Transactional
    public void removeFromCart(Long cartItemId, Long userId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .filter(item -> item.getUser().getId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Cart item not found"));
        cartItemRepository.delete(cartItem);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public void clearCartByType(CartItemType itemType, Long userId) {
        cartItemRepository.deleteByUserIdAndItemType(userId, itemType);
    }

    // ========== PRIVATE HELPERS ==========

    private void validateItem(CartItemType itemType, Long itemId, BigDecimal quantity) {
        switch (itemType) {
            case FABRIC:
                validateFabricItem(itemId, quantity);
                break;
            case PRODUCT:
                // TODO: Validate product when ProductService is available
                // validateProductItem(itemId, quantity);
                break;
            case SERVICE:
                // TODO: Validate service when ServiceService is available
                break;
            default:
                throw new BadRequestException("Unsupported item type: " + itemType);
        }
    }

    private void validateFabricItem(Long fabricId, BigDecimal quantity) {
        FabricEntity fabric = fabricRepository.findById(fabricId)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));

        if (!Boolean.TRUE.equals(fabric.getIsAvailable())) {
            throw new BadRequestException("Fabric is not available");
        }

        BigDecimal availableQuantity = fabricInventoryRepository
                .sumAvailableQuantityByFabricId(fabric.getId());
        if (availableQuantity == null) {
            availableQuantity = BigDecimal.ZERO;
        }
        if (quantity.compareTo(availableQuantity) > 0) {
            throw new BadRequestException(
                    String.format("Insufficient quantity. Available: %s", availableQuantity)
            );
        }
    }

    private void validateItemQuantity(CartItemType itemType, Long itemId, BigDecimal quantity) {
        switch (itemType) {
            case FABRIC:
                validateFabricQuantity(itemId, quantity);
                break;
            case PRODUCT:
                // TODO: Validate product quantity
                break;
            case SERVICE:
                // TODO: Validate service quantity
                break;
            default:
                throw new BadRequestException("Unsupported item type: " + itemType);
        }
    }

    private void validateFabricQuantity(Long fabricId, BigDecimal quantity) {
        BigDecimal availableQuantity = fabricInventoryRepository
                .sumAvailableQuantityByFabricId(fabricId);
        if (availableQuantity == null) {
            availableQuantity = BigDecimal.ZERO;
        }
        if (quantity.compareTo(availableQuantity) > 0) {
            throw new BadRequestException(
                    String.format("Insufficient quantity. Available: %s", availableQuantity)
            );
        }
    }

    private CartItemResponse toCartItemResponse(CartItemEntity entity) {
        CartItemResponse.CartItemResponseBuilder builder = CartItemResponse.builder()
                .id(entity.getId())
                .itemType(entity.getItemType())
                .itemId(entity.getItemId())
                .quantity(entity.getQuantity())
                .addedAt(entity.getAddedAt())
                .updatedAt(entity.getUpdatedAt());

        // Load item details based on type
        switch (entity.getItemType()) {
            case FABRIC:
                enrichFabricItem(builder, entity.getItemId(), entity.getQuantity());
                break;
            case PRODUCT:
                // TODO: Enrich product item when ProductService is available
                break;
            case SERVICE:
                // TODO: Enrich service item when ServiceService is available
                break;
        }

        return builder.build();
    }

    private void enrichFabricItem(CartItemResponse.CartItemResponseBuilder builder, Long fabricId, BigDecimal quantity) {
        FabricEntity fabric = fabricRepository.findById(fabricId)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElse(null);

        if (fabric != null) {
            BigDecimal availableQuantity = fabricInventoryRepository
                    .sumAvailableQuantityByFabricId(fabric.getId());
            if (availableQuantity == null) {
                availableQuantity = BigDecimal.ZERO;
            }

            builder.itemName(fabric.getName())
                    .itemCode(fabric.getCode())
                    .itemImage(fabric.getImage())
                    .itemPrice(fabric.getPricePerMeter())
                    .availableQuantity(availableQuantity)
                    .isAvailable(Boolean.TRUE.equals(fabric.getIsAvailable()));
        }
    }
}


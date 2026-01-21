package com.example.tailor_shop.modules.favorite.service.impl;

import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.favorite.domain.FavoriteEntity;
import com.example.tailor_shop.modules.favorite.domain.FavoriteItemType;
import com.example.tailor_shop.modules.favorite.dto.AddFavoriteRequest;
import com.example.tailor_shop.modules.favorite.dto.FavoriteCheckResponse;
import com.example.tailor_shop.modules.favorite.dto.FavoriteResponse;
import com.example.tailor_shop.modules.favorite.repository.FavoriteRepository;
import com.example.tailor_shop.modules.favorite.service.FavoriteService;
import com.example.tailor_shop.modules.fabric.domain.FabricEntity;
import com.example.tailor_shop.modules.fabric.repository.FabricRepository;
import com.example.tailor_shop.modules.product.domain.ProductEntity;
import com.example.tailor_shop.modules.product.repository.ProductRepository;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Favorite Service Implementation - Module riêng, có thể tái sử dụng cho nhiều
 * loại sản phẩm
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;

    // Dependencies cho các loại sản phẩm (có thể inject thêm ServiceService, etc.)
    private final ProductRepository productRepository;
    private final FabricRepository fabricRepository;
    private final com.example.tailor_shop.modules.product.repository.ImageAssetRepository imageAssetRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<FavoriteResponse> list(Long userId, Pageable pageable) {
        Page<FavoriteEntity> page = favoriteRepository.findByUserId(userId, pageable);
        return page.map(this::toFavoriteResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FavoriteResponse> listByType(FavoriteItemType itemType, Long userId, Pageable pageable) {
        Page<FavoriteEntity> page = favoriteRepository.findByUserIdAndItemType(userId, itemType, pageable);
        return page.map(this::toFavoriteResponse);
    }

    @Override
    @Transactional
    public FavoriteResponse add(Long userId, AddFavoriteRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Validate item based on type
        validateItem(request.getItemType(), request.getItemId());

        // Check if already favorited
        if (favoriteRepository.existsByUserIdAndItemTypeAndItemId(userId, request.getItemType(), request.getItemId())) {
            throw new BadRequestException("Item already in favorites");
        }

        // Ensure itemKey is not null (database may require it)
        String itemKey = request.getItemKey();
        if (itemKey == null || itemKey.trim().isEmpty()) {
            // Generate a default key if not provided
            itemKey = request.getItemType().name() + "-" + request.getItemId();
        }

        FavoriteEntity favorite = FavoriteEntity.builder()
                .user(user)
                .customerId(user.getId()) // Set customer_id cùng giá trị với user.id (database yêu cầu)
                .itemType(request.getItemType())
                .itemId(request.getItemId())
                .itemKey(itemKey)
                .productKey(itemKey) // Set product_key cùng giá trị với item_key (database yêu cầu)
                .build();

        FavoriteEntity saved = favoriteRepository.save(favorite);

        log.info("[TraceId: {}] Added to favorites: type={}, itemId={}, userId={}",
                TraceIdUtil.getTraceId(), request.getItemType(), request.getItemId(), userId);

        return toFavoriteResponse(saved);
    }

    @Override
    @Transactional
    public void remove(Long userId, FavoriteItemType itemType, Long itemId) {
        FavoriteEntity favorite = favoriteRepository.findByUserIdAndItemTypeAndItemId(userId, itemType, itemId)
                .orElseThrow(() -> new NotFoundException("Favorite not found"));
        favoriteRepository.delete(favorite);
        log.info("[TraceId: {}] Removed from favorites: type={}, itemId={}, userId={}",
                TraceIdUtil.getTraceId(), itemType, itemId, userId);
    }

    @Override
    @Transactional
    public void removeByKey(Long userId, String itemKey) {
        FavoriteEntity favorite = favoriteRepository.findByUserIdAndItemKey(userId, itemKey)
                .orElseThrow(() -> new NotFoundException("Favorite not found"));
        favoriteRepository.delete(favorite);
        log.info("[TraceId: {}] Removed from favorites by key: itemKey={}, userId={}",
                TraceIdUtil.getTraceId(), itemKey, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public FavoriteCheckResponse check(Long userId, FavoriteItemType itemType, Long itemId) {
        boolean isFavorite = favoriteRepository.existsByUserIdAndItemTypeAndItemId(userId, itemType, itemId);
        return FavoriteCheckResponse.builder()
                .isFavorite(isFavorite)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public FavoriteCheckResponse checkByKey(Long userId, String itemKey) {
        boolean isFavorite = favoriteRepository.existsByUserIdAndItemKey(userId, itemKey);
        return FavoriteCheckResponse.builder()
                .isFavorite(isFavorite)
                .build();
    }

    // ========== PRIVATE HELPERS ==========

    private void validateItem(FavoriteItemType itemType, Long itemId) {
        switch (itemType) {
            case PRODUCT:
                validateProductItem(itemId);
                break;
            case FABRIC:
                validateFabricItem(itemId);
                break;
            case SERVICE:
                // TODO: Validate service when ServiceService is available
                break;
            case IMAGE_ASSET:
                validateImageAssetItem(itemId);
                break;
            default:
                throw new BadRequestException("Unsupported item type: " + itemType);
        }
    }

    private void validateProductItem(Long productId) {
        productRepository.findById(productId)
                .filter(p -> Boolean.FALSE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Product not found"));
    }

    private void validateFabricItem(Long fabricId) {
        fabricRepository.findById(fabricId)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElseThrow(() -> new NotFoundException("Fabric not found"));
    }

    private void validateImageAssetItem(Long imageAssetId) {
        // ImageAsset không có isDeleted flag (hoặc chưa check), chỉ cần check tồn tại
        if (!imageAssetRepository.existsById(imageAssetId)) {
            throw new NotFoundException("Image Asset not found");
        }
    }

    private FavoriteResponse toFavoriteResponse(FavoriteEntity entity) {
        FavoriteResponse.FavoriteResponseBuilder builder = FavoriteResponse.builder()
                .id(entity.getId())
                .itemType(entity.getItemType())
                .itemId(entity.getItemId())
                .itemKey(entity.getItemKey())
                .addedAt(entity.getCreatedAt());

        // Load item details based on type
        switch (entity.getItemType()) {
            case PRODUCT:
                enrichProductItem(builder, entity.getItemId());
                break;
            case FABRIC:
                enrichFabricItem(builder, entity.getItemId());
                break;
            case SERVICE:
                // TODO: Enrich service item when ServiceService is available
                break;
            case IMAGE_ASSET:
                enrichImageAssetItem(builder, entity.getItemId());
                break;
        }

        return builder.build();
    }

    private void enrichProductItem(FavoriteResponse.FavoriteResponseBuilder builder, Long productId) {
        ProductEntity product = productRepository.findById(productId)
                .filter(p -> Boolean.FALSE.equals(p.getIsDeleted()))
                .orElse(null);

        if (product != null) {
            builder.itemName(product.getName())
                    .itemCode(product.getKey())
                    .itemImage(product.getImage())
                    .itemPrice(product.getPrice())
                    .itemRating(product.getRating())
                    .isAvailable(Boolean.TRUE.equals(!product.getIsDeleted()));
        }
    }

    private void enrichFabricItem(FavoriteResponse.FavoriteResponseBuilder builder, Long fabricId) {
        FabricEntity fabric = fabricRepository.findById(fabricId)
                .filter(f -> Boolean.FALSE.equals(f.getIsDeleted()))
                .orElse(null);

        if (fabric != null) {
            builder.itemName(fabric.getName())
                    .itemCode(fabric.getCode())
                    .itemImage(fabric.getImage())
                    .itemPrice(fabric.getPricePerMeter())
                    .isAvailable(Boolean.TRUE.equals(fabric.getIsAvailable()));
        }
    }

    private void enrichImageAssetItem(FavoriteResponse.FavoriteResponseBuilder builder, Long imageAssetId) {
        com.example.tailor_shop.modules.product.domain.ImageAssetEntity imageAsset = imageAssetRepository
                .findById(imageAssetId)
                .orElse(null);

        if (imageAsset != null) {
            // Tạm dùng Description hoặc Category/Type làm tên vì không có field Name
            String name = imageAsset.getDescription() != null
                    ? (imageAsset.getDescription().length() > 50 ? imageAsset.getDescription().substring(0, 50) + "..."
                            : imageAsset.getDescription())
                    : (imageAsset.getType() != null ? imageAsset.getType() : "Image Asset");

            builder.itemName(name)
                    .itemCode(imageAsset.getS3Key())
                    .itemImage(
                            imageAsset.getThumbnailUrl() != null ? imageAsset.getThumbnailUrl() : imageAsset.getUrl())
                    .itemPrice(null)
                    .isAvailable(true);
        }
    }
}

package com.example.tailor_shop.modules.product.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.product.domain.FavoriteEntity;
import com.example.tailor_shop.modules.product.domain.ProductEntity;
import com.example.tailor_shop.modules.product.dto.AddFavoriteRequest;
import com.example.tailor_shop.modules.product.dto.FavoriteCheckResponse;
import com.example.tailor_shop.modules.product.dto.FavoriteResponse;
import com.example.tailor_shop.modules.product.dto.ProductListItemResponse;
import com.example.tailor_shop.modules.product.repository.FavoriteRepository;
import com.example.tailor_shop.modules.product.repository.ProductRepository;
import com.example.tailor_shop.modules.product.service.FavoriteService;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<FavoriteResponse> list(Long customerId, Pageable pageable) {
        UserEntity customer = userRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found"));

        Page<FavoriteEntity> page = favoriteRepository.findByCustomerId(customerId, pageable);

        Set<String> productKeys = page.getContent().stream()
                .map(FavoriteEntity::getProductKey)
                .collect(Collectors.toSet());

        List<ProductEntity> products = productRepository.findAll().stream()
                .filter(p -> productKeys.contains(p.getKey()) && !Boolean.TRUE.equals(p.getIsDeleted()))
                .collect(Collectors.toList());

        return page.map(favorite -> {
            ProductEntity product = products.stream()
                    .filter(p -> p.getKey().equals(favorite.getProductKey()))
                    .findFirst()
                    .orElse(null);

            ProductListItemResponse productResponse = null;
            if (product != null) {
                productResponse = ProductListItemResponse.builder()
                        .id(product.getId())
                        .key(product.getKey())
                        .name(product.getName())
                        .image(product.getImage())
                        .price(product.getPrice())
                        .rating(product.getRating())
                        .build();
            }

            return FavoriteResponse.builder()
                    .id(favorite.getId())
                    .productKey(favorite.getProductKey())
                    .product(productResponse)
                    .addedAt(favorite.getCreatedAt())
                    .build();
        });
    }

    @Override
    @Transactional
    public FavoriteResponse add(Long customerId, AddFavoriteRequest request) {
        UserEntity customer = userRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found"));

        ProductEntity product = productRepository.findByKeyAndIsDeletedFalse(request.getProductKey())
                .orElseThrow(() -> new NotFoundException("Product not found"));

        if (favoriteRepository.existsByCustomerIdAndProductKey(customerId, request.getProductKey())) {
            throw new BadRequestException("Product already in favorites");
        }

        FavoriteEntity favorite = new FavoriteEntity();
        favorite.setCustomer(customer);
        favorite.setProductKey(request.getProductKey());

        FavoriteEntity saved = favoriteRepository.save(favorite);

        ProductListItemResponse productResponse = ProductListItemResponse.builder()
                .id(product.getId())
                .key(product.getKey())
                .name(product.getName())
                .image(product.getImage())
                .price(product.getPrice())
                .rating(product.getRating())
                .build();

        return FavoriteResponse.builder()
                .id(saved.getId())
                .productKey(saved.getProductKey())
                .product(productResponse)
                .addedAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void remove(Long customerId, String productKey) {
        FavoriteEntity favorite = favoriteRepository.findByCustomerIdAndProductKey(customerId, productKey)
                .orElseThrow(() -> new NotFoundException("Favorite not found"));

        favoriteRepository.delete(favorite);
    }

    @Override
    @Transactional(readOnly = true)
    public FavoriteCheckResponse check(Long customerId, String productKey) {
        boolean isFavorite = favoriteRepository.existsByCustomerIdAndProductKey(customerId, productKey);
        return FavoriteCheckResponse.builder()
                .isFavorite(isFavorite)
                .build();
    }
}


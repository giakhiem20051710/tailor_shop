package com.example.tailor_shop.modules.product.service.impl;

import com.example.tailor_shop.config.exception.BadRequestException;
import com.example.tailor_shop.config.exception.NotFoundException;
import com.example.tailor_shop.modules.favorite.domain.FavoriteItemType;
import com.example.tailor_shop.modules.favorite.repository.FavoriteRepository;
import com.example.tailor_shop.modules.product.domain.ProductEntity;
import com.example.tailor_shop.modules.product.dto.MediaDTO;
import com.example.tailor_shop.modules.product.dto.PriceDTO;
import com.example.tailor_shop.modules.product.dto.ProductDetailResponse;
import com.example.tailor_shop.modules.product.dto.ProductFilterRequest;
import com.example.tailor_shop.modules.product.dto.ProductListItemResponse;
import com.example.tailor_shop.modules.product.dto.ProductRequest;
import com.example.tailor_shop.modules.product.dto.StatsDTO;
import com.example.tailor_shop.modules.product.dto.TailoringSpecDTO;
import com.example.tailor_shop.modules.product.repository.ProductRepository;
import com.example.tailor_shop.modules.product.service.ProductService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final FavoriteRepository favoriteRepository;
    private final ObjectMapper objectMapper;
    private final com.example.tailor_shop.modules.product.repository.CategoryTemplateRepository categoryTemplateRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductListItemResponse> list(
            ProductFilterRequest filter,
            Pageable pageable,
            Long currentUserId) {
        Page<ProductEntity> page = productRepository.search(
                filter != null ? filter.getCategory() : null,
                filter != null ? filter.getOccasion() : null,
                filter != null ? filter.getBudget() : null,
                filter != null ? filter.getTag() : null,
                filter != null ? filter.getKeyword() : null,
                filter != null ? filter.getMinPrice() : null,
                filter != null ? filter.getMaxPrice() : null,
                filter != null ? filter.getMinRating() : null,
                pageable);

        // Get favorite product keys directly using new generic FavoriteRepository
        final Set<String> favoriteKeys;
        if (currentUserId != null) {
            List<String> favoriteKeysList = favoriteRepository.findItemKeysByUserIdAndItemType(
                    currentUserId, FavoriteItemType.PRODUCT);
            favoriteKeys = favoriteKeysList.isEmpty() ? Set.of() : new java.util.HashSet<>(favoriteKeysList);
        } else {
            favoriteKeys = Set.of();
        }

        return page.map(entity -> toListItemResponse(entity, favoriteKeys));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDetailResponse detail(String key, Long currentUserId) {
        ProductEntity entity = productRepository.findByKeyAndIsDeletedFalse(key)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        boolean isFavorite = false;
        if (currentUserId != null) {
            // Check if product is favorite using new generic FavoriteRepository
            // Option 1: By itemKey (product key) - simpler and backward compatible
            isFavorite = favoriteRepository.existsByUserIdAndItemKey(currentUserId, key);

            // Option 2: By itemType and itemId (alternative approach)
            // isFavorite = favoriteRepository.existsByUserIdAndItemTypeAndItemId(
            // currentUserId, FavoriteItemType.PRODUCT, entity.getId());
        }

        List<ProductListItemResponse> relatedProducts = new ArrayList<>();
        if (entity.getCategory() != null) {
            Pageable relatedPageable = PageRequest.of(0, 6);
            List<ProductEntity> related = productRepository.findRelatedProducts(
                    entity.getCategory(),
                    entity.getId(),
                    relatedPageable);
            relatedProducts = related.stream()
                    .map(e -> toListItemResponse(e, null))
                    .collect(Collectors.toList());
        }

        return toDetailResponse(entity, isFavorite, relatedProducts);
    }

    @Override
    @Transactional
    public ProductDetailResponse create(ProductRequest request) {
        if (productRepository.existsByKeyAndIsDeletedFalse(request.getKey())) {
            throw new BadRequestException("Product key already exists");
        }

        ProductEntity entity = new ProductEntity();
        entity.setKey(request.getKey());
        entity.setName(request.getName());
        entity.setSlug(generateSlug(request.getSlug(), request.getName()));
        entity.setDescription(request.getDescription());
        entity.setTag(request.getTag());
        entity.setPrice(request.getPrice());
        entity.setPriceRange(request.getPriceRange());
        entity.setImage(request.getImage());
        entity.setGallery(convertGalleryToString(request.getGallery()));
        entity.setOccasion(request.getOccasion());
        entity.setCategory(request.getCategory());
        entity.setBudget(request.getBudget());
        entity.setType(request.getType());
        entity.setIsDeleted(false);
        entity.setSold(0);

        // Set tailoring specifications
        entity.setTailoringTime(request.getTailoringTime());
        entity.setFittingCount(request.getFittingCount());
        entity.setWarranty(request.getWarranty());
        entity.setSilhouette(request.getSilhouette());
        entity.setMaterials(convertListToJson(request.getMaterials()));
        entity.setColors(convertListToJson(request.getColors()));
        entity.setLengthInfo(request.getLengthInfo());
        entity.setLining(request.getLining());
        entity.setAccessories(request.getAccessories());
        entity.setOccasions(convertListToJson(request.getOccasions()));
        entity.setCustomerStyles(convertListToJson(request.getCustomerStyles()));
        entity.setCareInstructions(convertListToJson(request.getCareInstructions()));

        if (entity.getSlug() != null && productRepository.existsBySlugAndIsDeletedFalse(entity.getSlug())) {
            entity.setSlug(entity.getSlug() + "-" + System.currentTimeMillis());
        }

        ProductEntity saved = productRepository.save(entity);
        return toDetailResponse(saved, false, new ArrayList<>());
    }

    @Override
    @Transactional
    public ProductDetailResponse update(String key, ProductRequest request) {
        ProductEntity entity = productRepository.findByKeyAndIsDeletedFalse(key)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        if (!entity.getKey().equals(request.getKey())) {
            throw new BadRequestException("Product key cannot be changed");
        }

        entity.setName(request.getName());
        if (request.getSlug() != null && !request.getSlug().isEmpty()) {
            String newSlug = request.getSlug();
            if (!newSlug.equals(entity.getSlug()) &&
                    productRepository.existsBySlugAndIsDeletedFalse(newSlug)) {
                throw new BadRequestException("Slug already exists");
            }
            entity.setSlug(newSlug);
        } else if (request.getName() != null && !request.getName().equals(entity.getName())) {
            entity.setSlug(generateSlug(null, request.getName()));
        }

        entity.setDescription(request.getDescription());
        entity.setTag(request.getTag());
        entity.setPrice(request.getPrice());
        entity.setPriceRange(request.getPriceRange());
        entity.setImage(request.getImage());
        entity.setGallery(convertGalleryToString(request.getGallery()));
        entity.setOccasion(request.getOccasion());
        entity.setCategory(request.getCategory());
        entity.setBudget(request.getBudget());
        entity.setType(request.getType());

        // Update tailoring specifications
        entity.setTailoringTime(request.getTailoringTime());
        entity.setFittingCount(request.getFittingCount());
        entity.setWarranty(request.getWarranty());
        entity.setSilhouette(request.getSilhouette());
        entity.setMaterials(convertListToJson(request.getMaterials()));
        entity.setColors(convertListToJson(request.getColors()));
        entity.setLengthInfo(request.getLengthInfo());
        entity.setLining(request.getLining());
        entity.setAccessories(request.getAccessories());
        entity.setOccasions(convertListToJson(request.getOccasions()));
        entity.setCustomerStyles(convertListToJson(request.getCustomerStyles()));
        entity.setCareInstructions(convertListToJson(request.getCareInstructions()));

        ProductEntity saved = productRepository.save(entity);
        return toDetailResponse(saved, false, new ArrayList<>());
    }

    @Override
    @Transactional
    public void delete(String key) {
        ProductEntity entity = productRepository.findByKeyAndIsDeletedFalse(key)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        entity.setIsDeleted(true);
        productRepository.save(entity);
    }

    private ProductListItemResponse toListItemResponse(
            ProductEntity entity,
            Set<String> favoriteKeys) {
        boolean isFavorite = favoriteKeys != null && favoriteKeys.contains(entity.getKey());
        TailoringSpecDTO specs = getTailoringDetails(entity);
        return ProductListItemResponse.builder()
                .id(entity.getId())
                .key(entity.getKey())
                .name(entity.getName())
                .slug(entity.getSlug())
                .image(entity.getImage())
                .price(entity.getPrice())
                .priceRange(entity.getPriceRange())
                .category(entity.getCategory())
                .occasion(entity.getOccasion())
                .tag(entity.getTag())
                .rating(entity.getRating())
                .sold(entity.getSold())
                .isFavorite(isFavorite)
                .specifications(specs)
                .build();
    }

    private ProductDetailResponse toDetailResponse(
            ProductEntity entity,
            boolean isFavorite,
            List<ProductListItemResponse> relatedProducts) {
        List<String> gallery = convertGalleryFromString(entity.getGallery());

        // Build nested DTOs
        MediaDTO media = MediaDTO.builder()
                .thumbnail(entity.getImage())
                .gallery(gallery)
                .build();

        PriceDTO pricing = PriceDTO.builder()
                .basePrice(entity.getPrice())
                .priceRange(entity.getPriceRange())
                .budget(entity.getBudget())
                .build();

        StatsDTO stats = StatsDTO.builder()
                .rating(entity.getRating())
                .reviewCount(0)
                .sold(entity.getSold())
                .isFavorite(isFavorite)
                .build();

        TailoringSpecDTO specifications = getTailoringDetails(entity);

        return ProductDetailResponse.builder()
                .id(entity.getId())
                .key(entity.getKey())
                .name(entity.getName())
                .slug(entity.getSlug())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .type(entity.getType())
                .tag(entity.getTag())
                .media(media)
                .pricing(pricing)
                .stats(stats)
                .specifications(specifications)
                .tags(null) // Can be extended later if needed
                .occasions(specifications.getOccasions())
                .customerStyles(specifications.getStyleRecommendations())
                .careInstructions(specifications.getCareInstructions())
                .relatedProducts(relatedProducts)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // Helper methods for fallback values
    private String getOrDefault(String value, String defaultValue) {
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }

    private List<String> getListOrDefault(String jsonValue, List<String> defaultValue) {
        List<String> list = convertJsonToList(jsonValue);
        return (list != null && !list.isEmpty()) ? list : defaultValue;
    }

    private TailoringSpecDTO getTailoringDetails(ProductEntity entity) {
        // 1. Try to get Category Template from DB
        String categoryCode = normalizeCategory(entity.getCategory());
        com.example.tailor_shop.modules.product.domain.CategoryTemplateEntity template = categoryTemplateRepository
                .findByCategoryCode(categoryCode).orElse(null);

        // 2. Prepare defaults from Template
        String defaultTime = template != null ? template.getTailoringTime() : "7-14 ngày";
        String defaultFitting = template != null ? template.getFittingCount() : "1-2 lần";
        String defaultWarranty = template != null ? template.getWarranty() : "Chỉnh sửa miễn phí 1 lần";
        String defaultSilhouette = template != null ? template.getSilhouette() : "Chuẩn Form";
        List<String> defaultMaterials = template != null ? convertJsonToList(template.getMaterials())
                : List.of("Đang cập nhật");
        List<String> defaultColors = template != null ? convertJsonToList(template.getColors()) : List.of();
        List<String> defaultOccasions = template != null ? convertJsonToList(template.getOccasions()) : List.of();
        List<String> defaultCare = template != null ? convertJsonToList(template.getCareInstructions())
                : List.of("Giặt khô");

        // 3. Merge Entity values with Defaults
        return TailoringSpecDTO.builder()
                .tailoringTime(getOrDefault(entity.getTailoringTime(), defaultTime))
                .fittingCount(getOrDefault(entity.getFittingCount(), defaultFitting))
                .warranty(getOrDefault(entity.getWarranty(), defaultWarranty))
                .materials(getListOrDefault(entity.getMaterials(), defaultMaterials))
                .colors(getListOrDefault(entity.getColors(), defaultColors))
                .silhouette(getOrDefault(entity.getSilhouette(), defaultSilhouette))
                .length(getOrDefault(entity.getLengthInfo(), "Tùy chỉnh"))
                .lining(getOrDefault(entity.getLining(), "Có"))
                .occasions(getListOrDefault(entity.getOccasions(), defaultOccasions))
                .fabricOrigin(entity.getMaterials() != null && entity.getMaterials().contains("Ý") ? "Ý" : "Việt Nam")
                .accessories(getOrDefault(entity.getAccessories(), "Không"))
                .styleRecommendations(getListOrDefault(entity.getCustomerStyles(), List.of()))
                .careInstructions(getListOrDefault(entity.getCareInstructions(), defaultCare))
                .build();
    }

    private String normalizeCategory(String category) {
        if (category == null)
            return "unknown";
        String s = category.toLowerCase();
        if (s.contains("vest"))
            return "vest";
        if (s.contains("áo dài") || s.contains("ao dai"))
            return "ao_dai";
        if (s.contains("váy") || s.contains("đầm"))
            return "vay";
        return "unknown";
    }

    private String generateSlug(String providedSlug, String name) {
        if (providedSlug != null && !providedSlug.isEmpty()) {
            return providedSlug.toLowerCase().replaceAll("[^a-z0-9-]", "-");
        }
        if (name != null) {
            return name.toLowerCase()
                    .replaceAll("[^a-z0-9\\s-]", "")
                    .replaceAll("\\s+", "-")
                    .replaceAll("-+", "-")
                    .replaceAll("^-|-$", "");
        }
        return null;
    }

    private String convertGalleryToString(List<String> gallery) {
        if (gallery == null || gallery.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(gallery);
        } catch (Exception e) {
            log.error("Error converting gallery to JSON", e);
            return null;
        }
    }

    private List<String> convertGalleryFromString(String galleryJson) {
        if (galleryJson == null || galleryJson.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(galleryJson, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            log.error("Error converting gallery from JSON", e);
            return new ArrayList<>();
        }
    }

    private String convertListToJson(List<String> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            log.error("Error converting list to JSON", e);
            return null;
        }
    }

    private List<String> convertJsonToList(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            log.error("Error converting JSON to list", e);
            return null;
        }
    }
}

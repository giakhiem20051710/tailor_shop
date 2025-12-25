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

    @Override
    @Transactional(readOnly = true)
    public Page<ProductListItemResponse> list(
            ProductFilterRequest filter,
            Pageable pageable,
            Long currentUserId
    ) {
        Page<ProductEntity> page = productRepository.search(
                filter != null ? filter.getCategory() : null,
                filter != null ? filter.getOccasion() : null,
                filter != null ? filter.getBudget() : null,
                filter != null ? filter.getTag() : null,
                filter != null ? filter.getKeyword() : null,
                filter != null ? filter.getMinPrice() : null,
                filter != null ? filter.getMaxPrice() : null,
                filter != null ? filter.getMinRating() : null,
                pageable
        );

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
            //         currentUserId, FavoriteItemType.PRODUCT, entity.getId());
        }

        List<ProductListItemResponse> relatedProducts = new ArrayList<>();
        if (entity.getCategory() != null) {
            Pageable relatedPageable = PageRequest.of(0, 6);
            List<ProductEntity> related = productRepository.findRelatedProducts(
                    entity.getCategory(),
                    entity.getId(),
                    relatedPageable
            );
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
            Set<String> favoriteKeys
    ) {
        boolean isFavorite = favoriteKeys != null && favoriteKeys.contains(entity.getKey());
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
                .build();
    }

    private ProductDetailResponse toDetailResponse(
            ProductEntity entity,
            boolean isFavorite,
            List<ProductListItemResponse> relatedProducts
    ) {
        List<String> gallery = convertGalleryFromString(entity.getGallery());
        
        // Map các thông tin chi tiết may đo dựa trên category và type
        TailoringDetails details = getTailoringDetails(entity.getCategory(), entity.getType());
        
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
        
        TailoringSpecDTO specifications = TailoringSpecDTO.builder()
                .tailoringTime(details.tailoringTime)
                .fittingCount(details.fittingCount)
                .warranty(details.warranty)
                .silhouette(details.silhouette)
                .materials(details.materials)
                .colors(details.colors)
                .length(details.length)
                .lining(details.lining)
                .accessories(details.accessories)
                .build();
        
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
                .occasions(details.occasions)
                .customerStyles(details.customerStyles)
                .careInstructions(details.careInstructions)
                .relatedProducts(relatedProducts)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // Helper class để lưu thông tin chi tiết may đo
    private static class TailoringDetails {
        String tailoringTime;
        String fittingCount;
        String warranty;
        String silhouette; // Renamed from formDang
        List<String> materials; // Changed from String to List<String>
        List<String> colors; // Changed from String to List<String>
        String length;
        String lining;
        String accessories;
        List<String> occasions;
        List<String> customerStyles;
        List<String> careInstructions;
    }

    // Lấy thông tin chi tiết may đo dựa trên category và type
    private TailoringDetails getTailoringDetails(String category, String type) {
        TailoringDetails details = new TailoringDetails();
        
        // Default values chung cho tất cả sản phẩm
        details.tailoringTime = "7-14 ngày";
        details.fittingCount = "1-2 lần";
        details.warranty = "Chỉnh sửa miễn phí 1 lần";
        details.lining = "Có, chống hằn & thoáng";
        details.colors = List.of("Tùy chọn theo bảng màu tại tiệm");
        details.accessories = "Có thể phối thêm belt, hoa cài, khăn choàng";
        
        // Care instructions chung
        details.careInstructions = List.of(
                "Ưu tiên giặt tay hoặc giặt chế độ nhẹ, nước lạnh.",
                "Không vắt xoắn mạnh, phơi nơi thoáng mát, tránh nắng gắt.",
                "Ủi ở nhiệt độ thấp, dùng khăn lót để bề mặt vải luôn mịn."
        );

        // Map theo category
        if (category != null) {
            switch (category.toLowerCase()) {
                case "ao-dai":
                case "áo dài":
                    details.silhouette = "Ôm nhẹ, tôn eo";
                    details.materials = List.of("Lụa", "Satin", "Crepe cao cấp");
                    details.length = "Qua gối / maxi tùy chọn";
                    details.colors = List.of("Đỏ", "Trắng", "Xanh navy", "Hồng pastel", "Vàng ống");
                    details.occasions = List.of(
                            "Cưới hỏi, lễ kỷ niệm, tiệc tối",
                            "Chụp ảnh kỷ niệm, pre-wedding",
                            "Sự kiện cần sự chỉn chu, thanh lịch"
                    );
                    details.customerStyles = List.of(
                            "Thích sự nữ tính, mềm mại nhưng không sến",
                            "Muốn tôn dáng nhưng vẫn di chuyển thoải mái",
                            "Cần trang phục \"đẹp ngoài đời & đẹp trên hình\""
                    );
                    break;
                    
                case "vest":
                case "suit":
                    details.silhouette = "Slim-fit, classic hoặc relaxed tùy chọn";
                    details.materials = List.of("Vải len cao cấp", "Cotton", "Linen");
                    details.length = "Áo vest chuẩn dáng";
                    details.colors = List.of("Đen", "Xám chuột", "Xanh navy", "Nâu café", "Beige");
                    details.occasions = List.of(
                            "Đi làm, gặp khách hàng",
                            "Sự kiện công sở, hội nghị",
                            "Tiệc tối trang trọng"
                    );
                    details.customerStyles = List.of(
                            "Thích phong cách chuyên nghiệp, lịch sự",
                            "Cần trang phục tự tin trong công việc",
                            "Muốn tôn dáng nhưng vẫn thoải mái khi ngồi lâu"
                    );
                    break;
                    
                case "dam":
                case "vay":
                case "đầm":
                case "váy":
                    details.silhouette = "Body, A-line hoặc suông tùy chọn";
                    details.materials = List.of("Satin", "Chiffon", "Lụa cao cấp");
                    details.length = "Midi hoặc maxi tùy chọn";
                    details.colors = List.of("Đỏ", "Đen", "Xanh ngọc", "Tím lavender", "Hồng pha lê");
                    details.occasions = List.of(
                            "Dạ hội, tiệc tối",
                            "Sự kiện sang trọng",
                            "Chụp ảnh nghệ thuật"
                    );
                    details.customerStyles = List.of(
                            "Thích sự quyến rũ, nổi bật nhưng thanh lịch",
                            "Muốn tôn dáng, lên hình đẹp",
                            "Cần trang phục \"đẹp ngoài đời & đẹp trên hình\""
                    );
                    break;
                    
                default:
                    // Default cho các category khác
                    details.silhouette = "Tùy chọn theo dáng người";
                    details.materials = List.of("Chất liệu cao cấp phù hợp");
                    details.length = "Tùy chọn";
                    details.colors = List.of("Tùy chọn theo bảng màu");
                    details.occasions = List.of(
                            "Nhiều dịp khác nhau",
                            "Phù hợp với nhu cầu cá nhân"
                    );
                    details.customerStyles = List.of(
                            "Thích sự thoải mái và phù hợp với dáng người",
                            "Muốn trang phục chất lượng, bền đẹp"
                    );
            }
        } else {
            // Fallback nếu không có category
            details.silhouette = "Tùy chọn theo dáng người";
            details.materials = List.of("Chất liệu cao cấp phù hợp");
            details.length = "Tùy chọn";
            details.colors = List.of("Tùy chọn theo bảng màu");
            details.occasions = List.of("Nhiều dịp khác nhau");
            details.customerStyles = List.of("Phù hợp với nhu cầu cá nhân");
        }
        
        return details;
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
            return objectMapper.readValue(galleryJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.error("Error converting gallery from JSON", e);
            return new ArrayList<>();
        }
    }
}


package com.example.tailor_shop.modules.product.service;

import com.example.tailor_shop.modules.product.domain.ImageAssetEntity;
import com.example.tailor_shop.modules.product.dto.TrendAnalysisResponse;
import com.example.tailor_shop.modules.product.dto.TrendAnalysisResponse.CategoryTrend;
import com.example.tailor_shop.modules.product.dto.TrendAnalysisResponse.AIInsights;
import com.example.tailor_shop.modules.product.repository.ImageAssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service phân tích xu hướng thời trang dựa trên dữ liệu ImageAsset và AI
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrendAnalysisService {

    private final ImageAssetRepository imageAssetRepository;

    // Mapping từ type sang tên tiếng Việt
    private static final Map<String, String> TYPE_LABELS = Map.ofEntries(
            Map.entry("ao_dai", "Áo dài"),
            Map.entry("ao_dai_cuoi", "Áo dài cưới"),
            Map.entry("ao_dai_cach_tan", "Áo dài cách tân"),
            Map.entry("vest", "Vest"),
            Map.entry("blazer", "Blazer"),
            Map.entry("dam_da_hoi", "Đầm dạ hội"),
            Map.entry("dam_cocktail", "Đầm cocktail"),
            Map.entry("dam_cuoi", "Đầm cưới"),
            Map.entry("dam_cong_so", "Đầm công sở"),
            Map.entry("vay_dam", "Váy đầm"),
            Map.entry("ao_so_mi", "Áo sơ mi"),
            Map.entry("quan_tay", "Quần tây"),
            Map.entry("jumpsuit", "Jumpsuit"),
            Map.entry("ao_khoac", "Áo khoác"));

    /**
     * Phân tích xu hướng theo khoảng thời gian
     *
     * @param period week, month, quarter, year
     * @return Kết quả phân tích xu hướng
     */
    public TrendAnalysisResponse analyzeTrends(String period) {
        log.info("📊 Analyzing trends for period: {}", period);

        // 1. Xác định khoảng thời gian
        OffsetDateTime startDate = calculateStartDate(period);
        OffsetDateTime previousStartDate = calculatePreviousStartDate(period, startDate);

        // 2. Lấy tất cả images trong khoảng thời gian
        List<ImageAssetEntity> currentPeriodImages = imageAssetRepository.findAll().stream()
                .filter(img -> img.getCreatedAt() != null && img.getCreatedAt().isAfter(startDate))
                .collect(Collectors.toList());

        List<ImageAssetEntity> previousPeriodImages = imageAssetRepository.findAll().stream()
                .filter(img -> img.getCreatedAt() != null
                        && img.getCreatedAt().isAfter(previousStartDate)
                        && img.getCreatedAt().isBefore(startDate))
                .collect(Collectors.toList());

        // 3. Aggregate theo type
        Map<String, List<ImageAssetEntity>> currentByType = currentPeriodImages.stream()
                .filter(img -> img.getType() != null && !"unknown".equals(img.getType()))
                .collect(Collectors.groupingBy(ImageAssetEntity::getType));

        Map<String, Long> previousCountByType = previousPeriodImages.stream()
                .filter(img -> img.getType() != null)
                .collect(Collectors.groupingBy(ImageAssetEntity::getType, Collectors.counting()));

        // 4. Tạo danh sách trends
        List<CategoryTrend> trends = new ArrayList<>();
        long idCounter = 1;

        for (Map.Entry<String, List<ImageAssetEntity>> entry : currentByType.entrySet()) {
            String type = entry.getKey();
            List<ImageAssetEntity> images = entry.getValue();

            long currentCount = images.size();
            long previousCount = previousCountByType.getOrDefault(type, 0L);

            // Tính phần trăm thay đổi
            double changePercent = previousCount > 0
                    ? ((double) (currentCount - previousCount) / previousCount) * 100
                    : (currentCount > 0 ? 100.0 : 0.0);

            // Xác định trend
            String trendLabel = determineTrendLabel(changePercent);

            // Lấy ảnh đại diện (ảnh mới nhất)
            String representativeImage = images.stream()
                    .filter(img -> img.getUrl() != null)
                    .max(Comparator.comparing(ImageAssetEntity::getCreatedAt))
                    .map(ImageAssetEntity::getUrl)
                    .orElse(null);

            // Lấy popular colors từ images
            List<String> popularColors = extractPopularColors(images);

            // Lấy popular styles từ occasions
            List<String> popularStyles = extractPopularStyles(images, type);

            // Xác định season
            String season = extractSeason(images);

            CategoryTrend trend = CategoryTrend.builder()
                    .id(idCounter++)
                    .category(TYPE_LABELS.getOrDefault(type, formatTypeName(type)))
                    .type(type)
                    .trend(trendLabel)
                    .change(String.format("%+.0f%%", changePercent))
                    .changePercent(changePercent)
                    .popularStyles(popularStyles)
                    .popularColors(popularColors)
                    .season(formatSeason(season))
                    .image(representativeImage)
                    .imageCount(currentCount)
                    .build();

            trends.add(trend);
        }

        // Sắp xếp theo số lượng giảm dần
        trends.sort((a, b) -> Long.compare(b.getImageCount(), a.getImageCount()));

        // Giới hạn top 6 trends
        if (trends.size() > 6) {
            trends = trends.subList(0, 6);
        }

        // 5. Tạo AI insights
        AIInsights insights = generateAIInsights(trends, period);

        log.info(" Trend analysis complete: {} categories analyzed", trends.size());

        return TrendAnalysisResponse.builder()
                .trends(trends)
                .insights(insights)
                .build();
    }

    private String determineTrendLabel(double changePercent) {
        if (changePercent >= 40) {
            return "Tăng mạnh";
        } else if (changePercent >= 10) {
            return "Tăng";
        } else if (changePercent >= -10) {
            return "Ổn định";
        } else {
            return "Giảm";
        }
    }

    private List<String> extractPopularColors(List<ImageAssetEntity> images) {
        List<String> colors = images.stream()
                .filter(img -> img.getColors() != null)
                .flatMap(img -> img.getColors().stream())
                .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(4)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        return colors.isEmpty() ? List.of("Đen", "Trắng", "Đỏ") : colors;
    }

    private List<String> extractPopularStyles(List<ImageAssetEntity> images, String type) {
        List<String> styles = images.stream()
                .filter(img -> img.getOccasions() != null)
                .flatMap(img -> img.getOccasions().stream())
                .distinct()
                .limit(3)
                .collect(Collectors.toList());

        return styles.isEmpty() ? generateDefaultStyles(type) : styles;
    }

    private String extractSeason(List<ImageAssetEntity> images) {
        return images.stream()
                .filter(img -> img.getSeason() != null)
                .collect(Collectors.groupingBy(ImageAssetEntity::getSeason, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Quanh năm");
    }

    private OffsetDateTime calculateStartDate(String period) {
        OffsetDateTime now = OffsetDateTime.now();
        return switch (period.toLowerCase()) {
            case "week" -> now.minusWeeks(1);
            case "month" -> now.minusMonths(1);
            case "quarter" -> now.minusMonths(3);
            case "year" -> now.minusYears(1);
            default -> now.minusMonths(1);
        };
    }

    private OffsetDateTime calculatePreviousStartDate(String period, OffsetDateTime currentStart) {
        return switch (period.toLowerCase()) {
            case "week" -> currentStart.minusWeeks(1);
            case "month" -> currentStart.minusMonths(1);
            case "quarter" -> currentStart.minusMonths(3);
            case "year" -> currentStart.minusYears(1);
            default -> currentStart.minusMonths(1);
        };
    }

    private List<String> generateDefaultStyles(String type) {
        return switch (type) {
            case "ao_dai", "ao_dai_cuoi" -> List.of(
                    "Áo dài cưới cổ điển",
                    "Áo dài hiện đại tối giản",
                    "Áo dài cách tân");
            case "vest", "blazer" -> List.of(
                    "Vest công sở 2 lớp",
                    "Vest cưới sang trọng",
                    "Vest blazer casual");
            case "dam_da_hoi", "dam_cocktail" -> List.of(
                    "Đầm slip dress",
                    "Đầm dạ hội maxi",
                    "Đầm công sở A-line");
            default -> List.of(
                    "Kiểu dáng truyền thống",
                    "Kiểu dáng hiện đại",
                    "Kiểu dáng cách tân");
        };
    }

    private String formatTypeName(String type) {
        if (type == null) {
            return "Khác";
        }
        String formatted = type.replace("_", " ");
        return formatted.substring(0, 1).toUpperCase() + formatted.substring(1);
    }

    private String formatSeason(String season) {
        if (season == null) {
            return "Quanh năm";
        }
        return switch (season.toLowerCase()) {
            case "spring" -> "Mùa xuân";
            case "summer" -> "Mùa hè";
            case "autumn" -> "Mùa thu";
            case "winter" -> "Mùa đông";
            case "all_season" -> "Quanh năm";
            default -> season;
        };
    }

    private AIInsights generateAIInsights(List<CategoryTrend> trends, String period) {
        // Lấy top trend
        CategoryTrend topTrend = trends.isEmpty() ? null : trends.get(0);

        // Lấy rising trends (change > 20%)
        List<String> risingStyles = trends.stream()
                .filter(t -> t.getChangePercent() > 20)
                .map(CategoryTrend::getCategory)
                .limit(3)
                .collect(Collectors.toList());

        // Tạo highlight
        String highlight = generateHighlight(topTrend, period);

        // Tạo business suggestion
        String businessSuggestion = generateBusinessSuggestion(trends, risingStyles);

        // Top trends
        List<String> topTrends = trends.stream()
                .limit(3)
                .map(t -> t.getCategory() + " (" + t.getChange() + ")")
                .collect(Collectors.toList());

        long totalImages = trends.stream().mapToLong(CategoryTrend::getImageCount).sum();

        return AIInsights.builder()
                .highlight(highlight)
                .businessSuggestion(businessSuggestion)
                .topTrends(topTrends)
                .risingStyles(risingStyles)
                .marketAnalysis(String.format(
                        "Phân tích dựa trên %d mẫu thiết kế trong %s.",
                        totalImages,
                        getPeriodLabel(period)))
                .build();
    }

    private String generateHighlight(CategoryTrend topTrend, String period) {
        if (topTrend == null) {
            return "Chưa có đủ dữ liệu để phân tích xu hướng.";
        }

        String colorInfo = "";
        if (!topTrend.getPopularColors().isEmpty()) {
            colorInfo = " Màu sắc phổ biến: " + String.join(", ", topTrend.getPopularColors()) + ".";
        }

        return String.format(
                "%s đang có xu hướng %s trong %s với %d mẫu thiết kế mới.%s",
                topTrend.getCategory(),
                topTrend.getTrend().toLowerCase(),
                getPeriodLabel(period),
                topTrend.getImageCount(),
                colorInfo);
    }

    private String generateBusinessSuggestion(List<CategoryTrend> trends, List<String> risingStyles) {
        List<String> topColors = trends.stream()
                .filter(t -> t.getPopularColors() != null)
                .flatMap(t -> t.getPopularColors().stream())
                .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .toList();

        String colors = String.join(", ", topColors.isEmpty() ? List.of("đỏ", "trắng", "đen") : topColors);
        String styles = risingStyles.isEmpty() ? "truyền thống" : String.join(", ", risingStyles);

        return String.format(
                "Nên chuẩn bị nhiều vải chất liệu cao cấp trong các màu %s để đáp ứng nhu cầu. "
                        + "Các mẫu %s đang được khách hàng quan tâm nhiều nhất.",
                colors,
                styles);
    }

    private String getPeriodLabel(String period) {
        return switch (period.toLowerCase()) {
            case "week" -> "tuần này";
            case "month" -> "tháng này";
            case "quarter" -> "quý này";
            case "year" -> "năm nay";
            default -> "khoảng thời gian này";
        };
    }
}

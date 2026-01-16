package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO chứa kết quả phân tích xu hướng thời trang
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendAnalysisResponse {

    private List<CategoryTrend> trends;
    private AIInsights insights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryTrend {
        private Long id;
        private String category; // Tên category: "Áo dài", "Vest", "Đầm"
        private String type; // Type từ AI: ao_dai, vest, dam_da_hoi
        private String trend; // "Tăng mạnh", "Tăng", "Ổn định", "Giảm"
        private String change; // "+35%", "-10%"
        private Double changePercent; // 35.0, -10.0
        private List<String> popularStyles; // Các kiểu dáng phổ biến
        private List<String> popularColors; // Màu sắc được yêu thích
        private String season; // Mùa phù hợp
        private String image; // URL ảnh đại diện từ database
        private Long imageCount; // Số lượng ảnh trong category
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AIInsights {
        private String highlight; // Xu hướng nổi bật
        private String businessSuggestion; // Gợi ý kinh doanh
        private List<String> topTrends; // Top xu hướng
        private List<String> risingStyles; // Kiểu dáng đang lên
        private String marketAnalysis; // Phân tích thị trường
    }
}

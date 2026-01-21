package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO chứa kết quả phân tích ảnh sản phẩm từ Gemini AI
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductAnalysisResult {

    // === THÔNG TIN PHÂN LOẠI ===

    /** Category: "template", "fabric", "style" */
    private String category;

    /** Type: "ao_dai", "vest", "vay_dam", "ao_so_mi", "quan_tay"... */
    private String type;

    /** Gender: "male", "female", "unisex" */
    private String gender;

    /**
     * Occasion: "daily", "work", "party", "wedding", "formal", "casual", "date",
     * "beach", "gym", "travel", "tet", "photoshoot"
     */
    private String occasion;

    /** Season: "spring", "summer", "autumn", "winter", "all_season" */
    private String season;

    /**
     * Style: "elegant", "casual", "vintage", "modern", "romantic", "minimalist",
     * "bohemian", "streetwear"...
     */
    private String style;

    // === MÔ TẢ SẢN PHẨM ===

    /** Mô tả chi tiết sản phẩm */
    private String description;

    /** Thời gian may dự kiến, ví dụ: "7-14 ngày" */
    private String tailoringTime;

    /** Số lần thử đồ, ví dụ: "1-2 lần" */
    private String fittingCount;

    /** Chính sách bảo hành, ví dụ: "Chỉnh sửa miễn phí 1 lần" */
    private String warranty;

    // === CHI TIẾT MAY ĐO ===

    /** Form dáng, ví dụ: "Ôm nhẹ, tôn eo" */
    private String silhouette;

    /** Độ dài, ví dụ: "Qua gối / maxi tùy chọn" */
    private String lengthInfo;

    /** Chất liệu gợi ý, ví dụ: ["Lụa", "Satin", "Crepe cao cấp"] */
    private List<String> materials;

    /** Lót trong, ví dụ: "Có, chống hằn & thoáng" */
    private String lining;

    /** Màu sắc phát hiện trong ảnh */
    private List<String> colors;

    /** Phụ kiện gợi ý, ví dụ: "Có thể phối thêm belt, hoa cài, khăn choàng" */
    private String accessories;

    // === MẪU PHÙ HỢP VỚI ===

    /** Dịp sử dụng, ví dụ: ["Cưới hỏi", "Lễ kỷ niệm", "Tiệc tối"] */
    private List<String> occasions;

    /**
     * Phong cách khách hàng phù hợp, ví dụ: ["Nữ tính", "Thanh lịch", "Tôn dáng"]
     */
    private List<String> customerStyles;

    // === GỢI Ý BẢO QUẢN ===

    /**
     * Hướng dẫn bảo quản, ví dụ: ["Giặt tay hoặc chế độ nhẹ", "Phơi nơi thoáng
     * mát"]
     */
    private List<String> careInstructions;

    // === TAGS VÀ METADATA ===

    /** Tags tự động detect, ví dụ: ["vintage", "elegant", "formal"] */
    private List<String> tags;

    /** Độ tin cậy của kết quả (0.0 - 1.0) */
    private Double confidence;

    // === THÔNG TIN ẢNH (được thêm sau khi upload) ===

    /** URL ảnh đã upload lên S3 */
    private String imageUrl;

    /** URL thumbnail */
    private String thumbnailUrl;

    /** URL ảnh lớn */
    private String largeUrl;

    /** ID của ImageAsset đã tạo */
    private Long imageAssetId;
}

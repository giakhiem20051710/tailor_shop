package com.example.tailor_shop.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Tailoring Specification DTO - Core domain concept for Tailor Shop
 * Contains all tailoring-related information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TailoringSpecDTO {
    // Process information
    private String tailoringTime; // e.g., "7-14 ngày"
    private String fittingCount; // e.g., "1-2 lần"
    private String warranty; // e.g., "Chỉnh sửa miễn phí 1 lần"

    // Technical details
    private String silhouette; // Form dáng (e.g., "Ôm nhẹ, tôn eo", "Slim-fit", "Body")
    private List<String> materials; // Suggested materials (e.g., ["Lụa", "Satin", "Crepe cao cấp"])
    private List<String> colors; // Available colors (e.g., ["Đỏ", "Xanh navy", "Trắng"])
    private String length; // Length options (e.g., "Qua gối / maxi tùy chọn")
    private String lining; // Lining information (e.g., "Có, chống hằn & thoáng")
    private String accessories; // Accessories information (e.g., "Có thể phối thêm belt, hoa cài, khăn choàng")
}


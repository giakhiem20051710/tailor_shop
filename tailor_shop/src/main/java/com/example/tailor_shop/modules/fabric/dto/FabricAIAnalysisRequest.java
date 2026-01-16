package com.example.tailor_shop.modules.fabric.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for AI fabric image analysis
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FabricAIAnalysisRequest {

    /**
     * Base64 encoded image data (with or without data:image prefix)
     */
    @NotBlank(message = "Image data is required")
    private String imageData;

    /**
     * Optional: MIME type of the image (e.g., image/jpeg, image/png)
     * If not provided, will be extracted from imageData or default to image/jpeg
     */
    private String mimeType;
}

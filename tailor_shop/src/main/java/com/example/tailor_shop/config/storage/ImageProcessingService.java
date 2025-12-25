package com.example.tailor_shop.config.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;

/**
 * Service xử lý ảnh chất lượng cao với các tính năng:
 * 1. Smart Cropping (tự động cắt bỏ khoảng trống)
 * 2. Resize với độ phân giải 2x cho màn hình Retina
 * 3. RenderingHints chất lượng cao
 * 4. Hỗ trợ WebP format
 */
@Service
@Slf4j
public class ImageProcessingService {

    /**
     * Bounding box cho Smart Cropping
     */
    public static class BoundingBox {
        public final int x;
        public final int y;
        public final int width;
        public final int height;

        public BoundingBox(int x, int y, int width, int height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
    }

    /**
     * Xử lý ảnh với tất cả các tính năng tối ưu:
     * - Smart Cropping (nếu có bounding box)
     * - Resize với độ phân giải 2x cho Retina
     * - Chất lượng cao với RenderingHints
     * - Chuyển đổi sang WebP (nếu cần)
     * 
     * @param imageData Dữ liệu ảnh gốc
     * @param targetWidth Chiều rộng hiển thị (sẽ resize thành targetWidth * 2)
     * @param targetHeight Chiều cao hiển thị (sẽ resize thành targetHeight * 2)
     * @param boundingBox Bounding box để crop (optional)
     * @param convertToWebp Có chuyển sang WebP không
     * @return Dữ liệu ảnh đã xử lý
     */
    public byte[] processImage(
            byte[] imageData,
            int targetWidth,
            int targetHeight,
            Optional<BoundingBox> boundingBox,
            boolean convertToWebp
    ) throws IOException {
        if (imageData == null || imageData.length == 0) {
            throw new IllegalArgumentException("Image data is empty");
        }

        log.info("Processing image: targetSize={}x{}, hasBoundingBox={}, convertToWebp={}", 
                targetWidth, targetHeight, boundingBox.isPresent(), convertToWebp);

        // Đọc ảnh từ byte array
        BufferedImage originalImage;
        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageData)) {
            originalImage = ImageIO.read(bais);
        }

        if (originalImage == null) {
            throw new IOException("Cannot read image from data");
        }

        // Bước 1: Smart Cropping (nếu có bounding box)
        BufferedImage croppedImage = boundingBox
                .map(box -> cropImage(originalImage, box))
                .orElse(originalImage);

        // Bước 2: Resize với độ phân giải 2x cho Retina
        int retinaWidth = targetWidth * 2;
        int retinaHeight = targetHeight * 2;
        BufferedImage resizedImage = resizeImageHighQuality(croppedImage, retinaWidth, retinaHeight);

        // Bước 3: Chuyển đổi sang byte array với format phù hợp
        String format = convertToWebp ? "webp" : getImageFormat(imageData);
        byte[] processedData = imageToBytes(resizedImage, format);

        log.info("Image processed successfully: originalSize={}x{}, finalSize={}x{}, format={}, size={}KB",
                originalImage.getWidth(), originalImage.getHeight(),
                resizedImage.getWidth(), resizedImage.getHeight(),
                format, processedData.length / 1024);

        return processedData;
    }

    /**
     * Xử lý ảnh đơn giản với resize 2x Retina (không crop)
     */
    public byte[] processImage(byte[] imageData, int targetWidth, int targetHeight) throws IOException {
        return processImage(imageData, targetWidth, targetHeight, Optional.empty(), false);
    }

    /**
     * Smart Cropping: Tự động phát hiện và cắt bỏ khoảng trống
     * Sử dụng thuật toán đơn giản: tìm vùng có nội dung (không phải màu nền)
     * 
     * @param image Ảnh gốc
     * @return Bounding box của vùng chứa nội dung
     */
    public Optional<BoundingBox> detectContentBounds(BufferedImage image) {
        if (image == null) {
            return Optional.empty();
        }

        int width = image.getWidth();
        int height = image.getHeight();

        // Tìm màu nền phổ biến nhất (thường là màu ở 4 góc)
        int bgColor = getBackgroundColor(image);

        // Tìm ranh giới của nội dung
        int minX = width;
        int maxX = 0;
        int minY = height;
        int maxY = 0;

        boolean foundContent = false;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                // Nếu pixel khác màu nền (cho phép sai số nhỏ)
                if (!isSimilarColor(rgb, bgColor, 30)) {
                    foundContent = true;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (!foundContent) {
            return Optional.empty();
        }

        // Thêm padding nhỏ (5%)
        int paddingX = (maxX - minX) / 20;
        int paddingY = (maxY - minY) / 20;
        minX = Math.max(0, minX - paddingX);
        minY = Math.max(0, minY - paddingY);
        maxX = Math.min(width - 1, maxX + paddingX);
        maxY = Math.min(height - 1, maxY + paddingY);

        return Optional.of(new BoundingBox(minX, minY, maxX - minX + 1, maxY - minY + 1));
    }

    /**
     * Crop ảnh theo bounding box
     */
    private BufferedImage cropImage(BufferedImage image, BoundingBox box) {
        int x = Math.max(0, box.x);
        int y = Math.max(0, box.y);
        int width = Math.min(box.width, image.getWidth() - x);
        int height = Math.min(box.height, image.getHeight() - y);

        BufferedImage cropped = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = cropped.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.drawImage(image, 0, 0, width, height, x, y, x + width, y + height, null);
        g2d.dispose();

        log.info("Cropped image: original={}x{}, cropped={}x{} at ({}, {})",
                image.getWidth(), image.getHeight(), width, height, x, y);

        return cropped;
    }

    /**
     * Resize ảnh với chất lượng cao sử dụng RenderingHints
     */
    private BufferedImage resizeImageHighQuality(BufferedImage original, int targetWidth, int targetHeight) {
        // Tính toán tỷ lệ để giữ nguyên aspect ratio
        double scaleX = (double) targetWidth / original.getWidth();
        double scaleY = (double) targetHeight / original.getHeight();
        double scale = Math.min(scaleX, scaleY);

        int newWidth = (int) (original.getWidth() * scale);
        int newHeight = (int) (original.getHeight() * scale);

        // Tạo ảnh mới với type phù hợp
        int imageType = original.getType();
        if (imageType == BufferedImage.TYPE_CUSTOM) {
            imageType = BufferedImage.TYPE_INT_RGB;
        }

        BufferedImage resized = new BufferedImage(newWidth, newHeight, imageType);
        Graphics2D g2d = resized.createGraphics();

        // Cấu hình RenderingHints cho chất lượng cao nhất
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION, RenderingHints.VALUE_ALPHA_INTERPOLATION_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);

        // Vẽ ảnh đã resize
        g2d.drawImage(original, 0, 0, newWidth, newHeight, null);
        g2d.dispose();

        return resized;
    }

    /**
     * Chuyển BufferedImage sang byte array
     */
    private byte[] imageToBytes(BufferedImage image, String format) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        // Kiểm tra format hỗ trợ
        String[] writerFormats = ImageIO.getWriterFormatNames();
        boolean formatSupported = false;
        for (String writerFormat : writerFormats) {
            if (writerFormat.equalsIgnoreCase(format)) {
                formatSupported = true;
                break;
            }
        }

        if (!formatSupported) {
            log.warn("Format {} not supported, falling back to JPEG", format);
            format = "jpeg";
        }

        ImageIO.write(image, format, baos);
        return baos.toByteArray();
    }

    /**
     * Xác định format ảnh từ byte data
     */
    private String getImageFormat(byte[] imageData) {
        // Kiểm tra magic bytes
        if (imageData.length >= 4) {
            // JPEG: FF D8 FF
            if (imageData[0] == (byte) 0xFF && imageData[1] == (byte) 0xD8 && imageData[2] == (byte) 0xFF) {
                return "jpeg";
            }
            // PNG: 89 50 4E 47
            if (imageData[0] == (byte) 0x89 && imageData[1] == (byte) 0x50 
                    && imageData[2] == (byte) 0x4E && imageData[3] == (byte) 0x47) {
                return "png";
            }
            // WebP: RIFF...WEBP
            if (imageData.length >= 12 && new String(imageData, 0, 4).equals("RIFF")
                    && new String(imageData, 8, 4).equals("WEBP")) {
                return "webp";
            }
        }
        return "jpeg"; // Default
    }

    /**
     * Lấy màu nền (màu phổ biến nhất ở 4 góc)
     */
    private int getBackgroundColor(BufferedImage image) {
        // Lấy màu ở góc trên trái làm màu nền mặc định
        // Có thể cải thiện bằng cách tính màu trung bình của 4 góc
        return image.getRGB(0, 0);
    }

    /**
     * Kiểm tra 2 màu có tương tự nhau không (trong phạm vi threshold)
     */
    private boolean isSimilarColor(int rgb1, int rgb2, int threshold) {
        int r1 = (rgb1 >> 16) & 0xFF;
        int g1 = (rgb1 >> 8) & 0xFF;
        int b1 = rgb1 & 0xFF;
        
        int r2 = (rgb2 >> 16) & 0xFF;
        int g2 = (rgb2 >> 8) & 0xFF;
        int b2 = rgb2 & 0xFF;
        
        int diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        return diff <= threshold;
    }
}


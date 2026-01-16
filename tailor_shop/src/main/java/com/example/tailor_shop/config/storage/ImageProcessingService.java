package com.example.tailor_shop.config.storage;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
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
     * 1. Smart Cropping (Trim viền đen/trắng) - tự động detect nếu không có bounding box
     * 2. Center Crop về tỉ lệ 3:4 với Thumbnailator
     * 3. Resize với độ phân giải 2x cho Retina
     * 4. Chất lượng cao với RenderingHints
     * 
     * @param imageData Dữ liệu ảnh gốc
     * @param targetWidth Chiều rộng hiển thị (sẽ resize thành targetWidth * 2)
     * @param targetHeight Chiều cao hiển thị (sẽ resize thành targetHeight * 2)
     * @param boundingBox Bounding box để crop (optional, nếu không có sẽ tự động detect)
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

        // Đọc ảnh từ byte array (chỉ đọc 1 lần để tối ưu RAM)
        BufferedImage originalImage;
        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageData)) {
            originalImage = ImageIO.read(bais);
        }

        if (originalImage == null) {
            throw new IOException("Cannot read image from data");
        }

        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Bước 1: Tự động detect bounding box nếu không có
        Optional<BoundingBox> detectedBox = boundingBox;
        if (!detectedBox.isPresent()) {
            detectedBox = detectContentBounds(originalImage);
            if (detectedBox.isPresent()) {
                log.info("Auto-detected content bounds: {}x{} at ({}, {})", 
                        detectedBox.get().width, detectedBox.get().height,
                        detectedBox.get().x, detectedBox.get().y);
            } else {
                log.info("No content bounds detected, using full image");
            }
        }

        // Bước 2: Trim viền đen/trắng (crop theo bounding box)
        BufferedImage trimmedImage = originalImage;
        if (detectedBox.isPresent()) {
            BoundingBox box = detectedBox.get();
            trimmedImage = cropImage(originalImage, box);
            log.info("Step 1 - Trimmed: {}x{} at ({}, {}) from {}x{}", 
                    box.width, box.height, box.x, box.y, originalWidth, originalHeight);
            
            // Giải phóng bộ nhớ ảnh gốc nếu đã crop
            originalImage.flush();
        }

        // Bước 3: Ép về tỉ lệ chuẩn 3:4 và Resize với Thumbnailator
        // Thumbnailator sẽ tự động center crop để lấp đầy khung hình
        int retinaWidth = targetWidth * 2;
        int retinaHeight = targetHeight * 2;
        
        // Tính toán tỉ lệ 3:4 chính xác
        double targetRatio = (double) targetWidth / targetHeight; // 3:4 = 0.75
        
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        try {
            // Sử dụng Thumbnailator để center crop và ép về đúng tỉ lệ 3:4
            // keepAspectRatio(false) để ép về đúng tỉ lệ, không giữ tỉ lệ gốc
            Thumbnails.of(trimmedImage)
                    .size(retinaWidth, retinaHeight) // Kích thước đích (VD: 1600x2134 cho 800x1067)
                    .crop(Positions.CENTER)          // Cắt từ tâm để giữ chủ thể (full frame lookbook)
                    .keepAspectRatio(false)          // Ép về đúng tỉ lệ 3:4, không giữ tỉ lệ gốc
                    .imageType(BufferedImage.TYPE_INT_RGB)
                    .outputFormat("jpg")
                    .outputQuality(0.9f)             // 90% quality
                    .toOutputStream(os);
            
            // Giải phóng bộ nhớ ảnh đã trim
            trimmedImage.flush();
            
        } catch (IOException e) {
            log.error("Error processing image with Thumbnailator: {}", e.getMessage(), e);
            // Fallback to old method
            BufferedImage resizedImage = resizeImageHighQuality(trimmedImage, retinaWidth, retinaHeight);
            String format = convertToWebp ? "webp" : getImageFormat(imageData);
            byte[] processedData = imageToBytes(resizedImage, format);
            trimmedImage.flush();
            resizedImage.flush();
            return processedData;
        }

        // Bước 4: Chuyển đổi sang byte array với format phù hợp
        String format = convertToWebp ? "webp" : getImageFormat(imageData);
        byte[] processedData = os.toByteArray();
        
        // Nếu cần format khác JPEG, convert lại (tối ưu: chỉ convert khi cần)
        if (!"jpeg".equalsIgnoreCase(format) && !"jpg".equalsIgnoreCase(format)) {
            try (ByteArrayInputStream bais = new ByteArrayInputStream(processedData)) {
                BufferedImage finalImage = ImageIO.read(bais);
                processedData = imageToBytes(finalImage, format);
                finalImage.flush();
            }
        }

        log.info("Image processed successfully: originalSize={}x{}, finalSize={}x{} (ratio 3:4), format={}, size={}KB",
                originalWidth, originalHeight,
                retinaWidth, retinaHeight,
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
     * Tạo thumbnail (300x300px, chất lượng 70%)
     */
    public byte[] createThumbnail(byte[] imageData) throws IOException {
        BufferedImage originalImage;
        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageData)) {
            originalImage = ImageIO.read(bais);
        }
        if (originalImage == null) {
            throw new IOException("Cannot read image from data");
        }

        // Resize với max 300x300, giữ nguyên aspect ratio
        BufferedImage thumbnail = resizeImageHighQuality(originalImage, 300, 300);
        
        // Convert với chất lượng 70% (JPEG quality)
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        String format = getImageFormat(imageData);
        
        // Nếu là JPEG, có thể điều chỉnh quality
        if ("jpeg".equalsIgnoreCase(format) || "jpg".equalsIgnoreCase(format)) {
            // Sử dụng ImageWriter với quality setting
            javax.imageio.ImageWriter writer = javax.imageio.ImageIO.getImageWritersByFormatName("jpeg").next();
            javax.imageio.stream.ImageOutputStream ios = javax.imageio.ImageIO.createImageOutputStream(baos);
            writer.setOutput(ios);
            
            javax.imageio.ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(0.7f); // 70% quality
            }
            
            writer.write(null, new javax.imageio.IIOImage(thumbnail, null, null), param);
            writer.dispose();
            ios.close();
        } else {
            ImageIO.write(thumbnail, format, baos);
        }
        
        log.info("Thumbnail created: {}x{}, size={}KB", 
                thumbnail.getWidth(), thumbnail.getHeight(), baos.size() / 1024);
        
        return baos.toByteArray();
    }

    /**
     * Tạo large version (1200px width, giữ nguyên tỷ lệ, chất lượng 90%)
     */
    public byte[] createLargeVersion(byte[] imageData) throws IOException {
        BufferedImage originalImage;
        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageData)) {
            originalImage = ImageIO.read(bais);
        }
        if (originalImage == null) {
            throw new IOException("Cannot read image from data");
        }

        // Tính toán kích thước mới với max width 1200px, giữ nguyên aspect ratio
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();
        int maxWidth = 1200;
        
        int newWidth, newHeight;
        if (originalWidth <= maxWidth) {
            // Ảnh nhỏ hơn hoặc bằng 1200px, giữ nguyên
            newWidth = originalWidth;
            newHeight = originalHeight;
        } else {
            // Resize với max width 1200px
            double scale = (double) maxWidth / originalWidth;
            newWidth = maxWidth;
            newHeight = (int) (originalHeight * scale);
        }

        BufferedImage largeImage = resizeImageHighQuality(originalImage, newWidth, newHeight);
        
        // Convert với chất lượng 90%
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        String format = getImageFormat(imageData);
        
        // Nếu là JPEG, điều chỉnh quality
        if ("jpeg".equalsIgnoreCase(format) || "jpg".equalsIgnoreCase(format)) {
            javax.imageio.ImageWriter writer = javax.imageio.ImageIO.getImageWritersByFormatName("jpeg").next();
            javax.imageio.stream.ImageOutputStream ios = javax.imageio.ImageIO.createImageOutputStream(baos);
            writer.setOutput(ios);
            
            javax.imageio.ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(0.9f); // 90% quality
            }
            
            writer.write(null, new javax.imageio.IIOImage(largeImage, null, null), param);
            writer.dispose();
            ios.close();
        } else {
            ImageIO.write(largeImage, format, baos);
        }
        
        log.info("Large version created: {}x{}, size={}KB", 
                largeImage.getWidth(), largeImage.getHeight(), baos.size() / 1024);
        
        return baos.toByteArray();
    }

    /**
     * Smart Cropping: Tự động phát hiện và cắt bỏ khoảng trống
     * Quét pixel từ 4 phía để tìm Bounding Box chứa chủ thể thực sự
     * Loại bỏ toàn bộ phần background đồng nhất (đen hoặc trắng) với tolerance 15-20
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
        
        // Kiểm tra ảnh quá nhỏ
        if (width < 10 || height < 10) {
            return Optional.empty();
        }

        // Tolerance cho việc so sánh màu (15-20 như yêu cầu)
        final int TOLERANCE = 18;

        // Bước 1: Xác định màu nền từ 4 góc và viền
        int bgColor = getBackgroundColorFromEdges(image, width, height);

        // Bước 2: Quét từ trên xuống để tìm top boundary
        int top = 0;
        boolean foundTop = false;
        for (int y = 0; y < height; y++) {
            int nonBgCount = 0;
            // Quét ngang để tìm dòng có nhiều pixel khác nền
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                if (!isSimilarColor(rgb, bgColor, TOLERANCE)) {
                    nonBgCount++;
                }
            }
            // Nếu có > 5% pixel khác nền, coi là có nội dung
            if (nonBgCount > width / 20) {
                top = y;
                foundTop = true;
                break;
            }
        }

        // Bước 3: Quét từ dưới lên để tìm bottom boundary
        int bottom = height - 1;
        boolean foundBottom = false;
        for (int y = height - 1; y >= top; y--) {
            int nonBgCount = 0;
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                if (!isSimilarColor(rgb, bgColor, TOLERANCE)) {
                    nonBgCount++;
                }
            }
            if (nonBgCount > width / 20) {
                bottom = y;
                foundBottom = true;
                break;
            }
        }

        // Bước 4: Quét từ trái sang phải để tìm left boundary
        int left = 0;
        boolean foundLeft = false;
        for (int x = 0; x < width; x++) {
            int nonBgCount = 0;
            for (int y = top; y <= bottom; y++) {
                int rgb = image.getRGB(x, y);
                if (!isSimilarColor(rgb, bgColor, TOLERANCE)) {
                    nonBgCount++;
                }
            }
            if (nonBgCount > (bottom - top + 1) / 20) {
                left = x;
                foundLeft = true;
                break;
            }
        }

        // Bước 5: Quét từ phải sang trái để tìm right boundary
        int right = width - 1;
        boolean foundRight = false;
        for (int x = width - 1; x >= left; x--) {
            int nonBgCount = 0;
            for (int y = top; y <= bottom; y++) {
                int rgb = image.getRGB(x, y);
                if (!isSimilarColor(rgb, bgColor, TOLERANCE)) {
                    nonBgCount++;
                }
            }
            if (nonBgCount > (bottom - top + 1) / 20) {
                right = x;
                foundRight = true;
                break;
            }
        }

        // Kiểm tra xem có tìm thấy nội dung không
        if (!foundTop || !foundBottom || !foundLeft || !foundRight) {
            log.debug("No content bounds detected, using full image");
            return Optional.empty();
        }

        // Đảm bảo bounds hợp lệ
        if (right <= left || bottom <= top) {
            log.debug("Invalid bounds detected, using full image");
            return Optional.empty();
        }

        // Tính toán kích thước bounding box
        int boxWidth = right - left + 1;
        int boxHeight = bottom - top + 1;

        // Kiểm tra bounding box có quá nhỏ không (ít hơn 10% kích thước gốc)
        if (boxWidth < width * 0.1 || boxHeight < height * 0.1) {
            log.debug("Bounding box too small ({}x{}), using full image", boxWidth, boxHeight);
            return Optional.empty();
        }

        log.info("Content bounds detected: {}x{} at ({}, {}) from original {}x{}", 
                boxWidth, boxHeight, left, top, width, height);

        return Optional.of(new BoundingBox(left, top, boxWidth, boxHeight));
    }

    /**
     * Lấy màu nền từ 4 góc và viền ảnh để xác định chính xác hơn
     */
    private int getBackgroundColorFromEdges(BufferedImage image, int width, int height) {
        // Lấy màu từ 4 góc
        int[] cornerColors = {
            image.getRGB(0, 0),                    // Top-left
            image.getRGB(width - 1, 0),           // Top-right
            image.getRGB(0, height - 1),          // Bottom-left
            image.getRGB(width - 1, height - 1)   // Bottom-right
        };

        // Tính màu trung bình của 4 góc
        long rSum = 0, gSum = 0, bSum = 0;
        for (int color : cornerColors) {
            rSum += (color >> 16) & 0xFF;
            gSum += (color >> 8) & 0xFF;
            bSum += color & 0xFF;
        }

        int avgR = (int) (rSum / 4);
        int avgG = (int) (gSum / 4);
        int avgB = (int) (bSum / 4);

        return (avgR << 16) | (avgG << 8) | avgB;
    }

    /**
     * Crop ảnh theo bounding box
     * Sử dụng getSubimage để tối ưu RAM, sau đó copy để có thể flush ảnh gốc an toàn
     */
    private BufferedImage cropImage(BufferedImage image, BoundingBox box) {
        int x = Math.max(0, box.x);
        int y = Math.max(0, box.y);
        int width = Math.min(box.width, image.getWidth() - x);
        int height = Math.min(box.height, image.getHeight() - y);

        // Sử dụng getSubimage để tối ưu (chỉ reference, không copy toàn bộ)
        BufferedImage subImage = image.getSubimage(x, y, width, height);
        
        // Tạo ảnh mới để có thể flush ảnh gốc an toàn
        BufferedImage cropped = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = cropped.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.drawImage(subImage, 0, 0, null);
        g2d.dispose();

        log.debug("Cropped image: original={}x{}, cropped={}x{} at ({}, {})",
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




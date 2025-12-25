package com.example.tailor_shop.config.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.List;

/**
 * Service để download ảnh từ web
 */
@Service
@Slf4j
public class ImageDownloadService {

    private static final int MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );

    /**
     * Download ảnh từ URL và trả về byte array
     */
    public byte[] downloadImage(String imageUrl) throws IOException {
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException("Image URL is empty");
        }

        log.info("Downloading image from: {}", imageUrl);

        URL url = new URL(imageUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(10000); // 10 seconds
        connection.setReadTimeout(30000); // 30 seconds
        connection.setRequestProperty("User-Agent", "Mozilla/5.0");

        int responseCode = connection.getResponseCode();
        if (responseCode != HttpURLConnection.HTTP_OK) {
            throw new IOException("Failed to download image. HTTP code: " + responseCode);
        }

        String contentType = connection.getContentType();
        if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid content type: " + contentType);
        }

        long contentLength = connection.getContentLengthLong();
        if (contentLength > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Image too large: " + contentLength + " bytes");
        }

        try (InputStream inputStream = connection.getInputStream()) {
            byte[] buffer = new byte[8192];
            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            int bytesRead;
            long totalBytes = 0;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                totalBytes += bytesRead;
                if (totalBytes > MAX_SIZE_BYTES) {
                    throw new IllegalArgumentException("Image too large");
                }
                outputStream.write(buffer, 0, bytesRead);
            }

            byte[] imageData = outputStream.toByteArray();
            log.info("Downloaded image: {} bytes", imageData.length);
            return imageData;
        } finally {
            connection.disconnect();
        }
    }

    /**
     * Kiểm tra URL có phải là ảnh hợp lệ không
     */
    public boolean isValidImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") 
                || lowerUrl.endsWith(".png") || lowerUrl.endsWith(".webp")
                || lowerUrl.endsWith(".gif") || lowerUrl.contains("image");
    }
}


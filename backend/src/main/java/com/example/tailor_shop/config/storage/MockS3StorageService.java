package com.example.tailor_shop.config.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Mock implementation of S3StorageService for development/testing
 * when AWS credentials are not configured.
 */
@Slf4j
@Service
@ConditionalOnExpression("'${aws.s3.access-key:}' == ''")
public class MockS3StorageService extends S3StorageService {

    public MockS3StorageService() {
        super(null, null);
    }

    @Override
    public String upload(String prefix, MultipartFile file) {
        log.info("🔧 Mock S3 Upload: {} -> {}/{}",
                file.getOriginalFilename(), prefix, file.getOriginalFilename());

        // Return a mock URL
        String mockUrl = String.format("https://mock-bucket.s3.amazonaws.com/%s/%s",
                prefix != null ? prefix : "uploads",
                file.getOriginalFilename());

        log.info("📎 Mock URL: {}", mockUrl);
        return mockUrl;
    }

    @Override
    public String uploadImage(String prefix, byte[] imageData, String fileName, String contentType) {
        log.info("🔧 Mock S3 Image Upload: {} -> {}/{} ({})",
                fileName, prefix, fileName, contentType);

        // Return a mock URL
        String mockUrl = String.format("https://mock-bucket.s3.amazonaws.com/%s/%s",
                prefix != null ? prefix : "images", fileName);

        log.info("📎 Mock URL: {}", mockUrl);
        return mockUrl;
    }

    @Override
    public boolean objectExists(String s3Key) {
        log.info("🔧 Mock S3 Object Exists check: {} - returning false", s3Key);
        return false;
    }

    @Override
    public byte[] downloadObject(String s3Key) throws IOException {
        log.warn("🔧 Mock S3 Download attempted for key: {} - returning empty byte array", s3Key);
        return new byte[0];
    }

    @Override
    public String extractS3KeyFromUrl(String s3Url) {
        log.info("🔧 Mock S3 Extract Key from URL: {}", s3Url);
        if (s3Url == null)
            return null;

        // Simple extraction for mock URLs
        if (s3Url.contains("mock-bucket.s3.amazonaws.com/")) {
            return s3Url.substring(
                    s3Url.indexOf("mock-bucket.s3.amazonaws.com/") + "mock-bucket.s3.amazonaws.com/".length());
        }

        return s3Url;
    }

    @Override
    public boolean deleteFile(String s3Key) {
        log.info("🔧 Mock S3 Delete: {} - returning true", s3Key);
        return true;
    }
}

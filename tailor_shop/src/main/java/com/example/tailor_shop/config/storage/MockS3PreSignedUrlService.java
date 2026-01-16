package com.example.tailor_shop.config.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Mock implementation of S3PreSignedUrlService for development/testing
 * when AWS credentials are not configured.
 */
@Slf4j
@Service
@ConditionalOnExpression("'${aws.s3.access-key:}' == ''")
public class MockS3PreSignedUrlService extends S3PreSignedUrlService {

    public MockS3PreSignedUrlService() {
        super(null);
    }

    /**
     * Generate pre-signed URL cho một file
     */
    @Override
    public PreSignedUrlInfo generatePresignedUploadUrl(String fileName, String contentType) {
        log.info("🔧 Mock S3 Pre-signed URL generation: {} ({})", fileName, contentType);

        String key = "images/" + UUID.randomUUID() + "_" + fileName;
        String mockPresignedUrl = "https://mock-bucket.s3.amazonaws.com/presigned-upload/" + key;
        String mockS3Url = "https://mock-bucket.s3.amazonaws.com/" + key;

        log.info("📎 Mock Pre-signed URL: {}", mockPresignedUrl);
        log.info("📎 Mock S3 URL: {}", mockS3Url);

        return PreSignedUrlInfo.builder()
                .fileName(fileName)
                .presignedUrl(mockPresignedUrl)
                .s3Key(key)
                .s3Url(mockS3Url)
                .build();
    }

    /**
     * Generate pre-signed URLs cho nhiều files
     */
    @Override
    public List<PreSignedUrlInfo> generatePresignedUploadUrls(List<FileInfo> fileInfos) {
        log.info("🔧 Mock S3 Pre-signed URLs generation for {} files", fileInfos.size());

        List<PreSignedUrlInfo> results = new ArrayList<>();

        for (FileInfo fileInfo : fileInfos) {
            try {
                PreSignedUrlInfo urlInfo = generatePresignedUploadUrl(
                        fileInfo.getFileName(),
                        fileInfo.getContentType());
                results.add(urlInfo);
            } catch (Exception e) {
                log.error("Failed to generate mock pre-signed URL for {}: {}", fileInfo.getFileName(), e.getMessage());
                // Continue with other files
            }
        }

        return results;
    }

    /**
     * Extract S3 key from URL
     */
    @Override
    public String extractS3KeyFromUrl(String url) {
        log.info("🔧 Mock S3 Extract Key from URL: {}", url);
        if (url == null || url.isEmpty()) {
            return null;
        }

        // Simple extraction for mock URLs
        if (url.contains("mock-bucket.s3.amazonaws.com/")) {
            return url
                    .substring(url.indexOf("mock-bucket.s3.amazonaws.com/") + "mock-bucket.s3.amazonaws.com/".length());
        }

        return url;
    }
}

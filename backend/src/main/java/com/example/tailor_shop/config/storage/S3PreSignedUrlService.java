package com.example.tailor_shop.config.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service để generate pre-signed URLs cho direct S3 upload từ browser
 */
@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnExpression("'${aws.s3.access-key:}' != ''")
public class S3PreSignedUrlService {

    private final S3Properties props;
    private static final long MAX_SIZE_BYTES = 50L * 1024 * 1024; // 50 MB
    private static final int PRESIGNED_URL_EXPIRATION_HOURS = 1;

    private S3Presigner createPresigner() {
        AwsBasicCredentials creds = AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey());
        return S3Presigner.builder()
                .region(Region.of(props.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .build();
    }

    /**
     * Generate pre-signed URL cho một file
     */
    public PreSignedUrlInfo generatePresignedUploadUrl(String fileName, String contentType) {
        String key = "images/" + UUID.randomUUID() + "_" + fileName;
        
        try (S3Presigner presigner = createPresigner()) {
            // Không set contentLength để S3 chấp nhận bất kỳ size nào (trong giới hạn bucket policy)
            // Nếu set contentLength cụ thể, signature sẽ không khớp khi file size khác
            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofHours(PRESIGNED_URL_EXPIRATION_HOURS))
                    .putObjectRequest(PutObjectRequest.builder()
                            .bucket(props.getBucket())
                            .key(key)
                            .contentType(contentType != null ? contentType : "image/jpeg")
                            // Không set contentLength - để S3 tự động detect từ request body
                            .build())
                    .build();
            
            PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(presignRequest);
            String presignedUrl = presignedRequest.url().toString();
            String s3Url = buildS3Url(key);
            
            log.info("Generated pre-signed URL for file: {} -> key: {}", fileName, key);
            
            return PreSignedUrlInfo.builder()
                    .fileName(fileName)
                    .presignedUrl(presignedUrl)
                    .s3Key(key)
                    .s3Url(s3Url)
                    .build();
        } catch (Exception e) {
            log.error("Error generating pre-signed URL for file {}: {}", fileName, e.getMessage(), e);
            throw new RuntimeException("Failed to generate pre-signed URL: " + e.getMessage(), e);
        }
    }

    /**
     * Generate pre-signed URLs cho nhiều files
     */
    public List<PreSignedUrlInfo> generatePresignedUploadUrls(List<FileInfo> fileInfos) {
        List<PreSignedUrlInfo> results = new ArrayList<>();
        
        for (FileInfo fileInfo : fileInfos) {
            try {
                PreSignedUrlInfo urlInfo = generatePresignedUploadUrl(
                    fileInfo.getFileName(), 
                    fileInfo.getContentType()
                );
                results.add(urlInfo);
            } catch (Exception e) {
                log.error("Failed to generate pre-signed URL for {}: {}", fileInfo.getFileName(), e.getMessage());
                // Continue with other files
            }
        }
        
        return results;
    }

    private String buildS3Url(String key) {
        if (props.getBaseUrl() != null && !props.getBaseUrl().isBlank()) {
            String base = props.getBaseUrl().endsWith("/") 
                ? props.getBaseUrl().substring(0, props.getBaseUrl().length() - 1) 
                : props.getBaseUrl();
            return base + "/" + key;
        }
        return "https://" + props.getBucket() + ".s3." + props.getRegion() + ".amazonaws.com/" + key;
    }

    /**
     * Extract S3 key from URL
     */
    public String extractS3KeyFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        // Tìm phần sau domain
        int index = url.indexOf(".amazonaws.com/");
        if (index > 0) {
            return url.substring(index + ".amazonaws.com/".length());
        }
        // Nếu dùng baseUrl
        if (props.getBaseUrl() != null && url.startsWith(props.getBaseUrl())) {
            return url.substring(props.getBaseUrl().length() + 1);
        }
        return null;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class FileInfo {
        private String fileName;
        private String contentType;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PreSignedUrlInfo {
        private String fileName;
        private String presignedUrl;
        private String s3Key;
        private String s3Url;
    }
}


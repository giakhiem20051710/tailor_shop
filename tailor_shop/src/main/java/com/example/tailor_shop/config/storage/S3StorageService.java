package com.example.tailor_shop.config.storage;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3StorageService {

    private static final long MAX_SIZE_BYTES = 50L * 1024 * 1024; // 50 MB

    private final S3Client s3Client;
    private final S3Properties props;

    public S3StorageService(S3Client s3Client, S3Properties props) {
        this.s3Client = s3Client;
        this.props = props;
    }

    public String upload(String prefix, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("File vượt quá 50MB");
        }

        String original = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(original);
        String key = (prefix != null ? prefix + "/" : "") + UUID.randomUUID() + (ext != null ? "." + ext : "");
        String contentType = file.getContentType() != null ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        try {
            PutObjectRequest req = PutObjectRequest.builder()
                    .bucket(props.getBucket())
                    .key(key)
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(req, RequestBody.fromBytes(file.getBytes()));
            if (props.getBaseUrl() != null && !props.getBaseUrl().isBlank()) {
                String base = props.getBaseUrl().endsWith("/") ? props.getBaseUrl().substring(0, props.getBaseUrl().length() - 1) : props.getBaseUrl();
                return base + "/" + key;
            }
            return "https://" + props.getBucket() + ".s3." + props.getRegion() + ".amazonaws.com/" + key;
        } catch (IOException | SdkException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }
}


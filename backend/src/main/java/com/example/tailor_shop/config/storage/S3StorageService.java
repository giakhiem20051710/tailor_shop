package com.example.tailor_shop.config.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
// import software.amazon.awssdk.services.s3.model.ObjectCannedACL; // Không dùng nữa vì bucket không cho phép ACLs
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

@Service
@ConditionalOnExpression("'${aws.s3.access-key:}' != ''")
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
        String contentType = file.getContentType() != null ? file.getContentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        try {
            // Bỏ ACL vì bucket không cho phép ACLs (AWS S3 mặc định)
            // Thay vào đó, dùng bucket policy để set public read
            PutObjectRequest req = PutObjectRequest.builder()
                    .bucket(props.getBucket())
                    .key(key)
                    // .acl(ObjectCannedACL.PUBLIC_READ) // Bỏ vì bucket không cho phép ACLs
                    .contentType(contentType)
                    .build();
            s3Client.putObject(req, RequestBody.fromBytes(file.getBytes()));
            if (props.getBaseUrl() != null && !props.getBaseUrl().isBlank()) {
                String base = props.getBaseUrl().endsWith("/")
                        ? props.getBaseUrl().substring(0, props.getBaseUrl().length() - 1)
                        : props.getBaseUrl();
                return base + "/" + key;
            }
            return "https://" + props.getBucket() + ".s3." + props.getRegion() + ".amazonaws.com/" + key;
        } catch (IOException e) {
            throw new RuntimeException("Error reading file: " + e.getMessage(), e);
        } catch (SdkException e) {
            // Log chi tiết lỗi S3
            String errorMsg = String.format(
                    "S3 Upload failed - Bucket: %s, Key: %s, Error: %s",
                    props.getBucket(), key, e.getMessage());
            throw new RuntimeException(errorMsg, e);
        }
    }

    /**
     * Upload ảnh từ byte array lên S3
     * 
     * @param prefix      Thư mục trên S3 (ví dụ: "templates", "fabrics")
     * @param imageData   Byte array của ảnh
     * @param fileName    Tên file (ví dụ: "shirt.jpg")
     * @param contentType Content type (ví dụ: "image/jpeg")
     * @return URL của ảnh trên S3
     */
    public String uploadImage(String prefix, byte[] imageData, String fileName, String contentType) {
        if (imageData == null || imageData.length == 0) {
            throw new IllegalArgumentException("Image data is empty");
        }
        if (imageData.length > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Image vượt quá 50MB");
        }

        String ext = StringUtils.getFilenameExtension(fileName);
        String key = (prefix != null ? prefix + "/" : "") + UUID.randomUUID() + (ext != null ? "." + ext : "");

        if (contentType == null || contentType.isBlank()) {
            contentType = MediaType.IMAGE_JPEG_VALUE; // Default to JPEG
        }

        try {
            // Bỏ ACL vì bucket không cho phép ACLs (AWS S3 mặc định)
            // Thay vào đó, dùng bucket policy để set public read
            PutObjectRequest req = PutObjectRequest.builder()
                    .bucket(props.getBucket())
                    .key(key)
                    // .acl(ObjectCannedACL.PUBLIC_READ) // Bỏ vì bucket không cho phép ACLs
                    .contentType(contentType)
                    .build();
            s3Client.putObject(req, RequestBody.fromBytes(imageData));

            if (props.getBaseUrl() != null && !props.getBaseUrl().isBlank()) {
                String base = props.getBaseUrl().endsWith("/")
                        ? props.getBaseUrl().substring(0, props.getBaseUrl().length() - 1)
                        : props.getBaseUrl();
                return base + "/" + key;
            }
            return "https://" + props.getBucket() + ".s3." + props.getRegion() + ".amazonaws.com/" + key;
        } catch (SdkException e) {
            // Log chi tiết lỗi S3
            String errorMsg = String.format(
                    "S3 Upload failed - Bucket: %s, Key: %s, Error: %s",
                    props.getBucket(), key, e.getMessage());
            throw new RuntimeException(errorMsg, e);
        }
    }

    /**
     * Kiểm tra object có tồn tại trong S3 không
     * 
     * @param s3Key S3 key của object
     * @return true nếu object tồn tại, false nếu không
     */
    public boolean objectExists(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) {
            return false;
        }
        try {
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(props.getBucket())
                    .key(s3Key)
                    .build();
            s3Client.headObject(headRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (SdkException e) {
            // Log error nhưng return false
            return false;
        }
    }

    /**
     * Download object từ S3 bằng S3 SDK (không cần public read)
     * 
     * @param s3Key S3 key của object (ví dụ: "uploads/uuid_filename.jpg")
     * @return Byte array của object
     * @throws IOException Nếu không thể download
     */
    public byte[] downloadObject(String s3Key) throws IOException {
        if (s3Key == null || s3Key.isBlank()) {
            throw new IllegalArgumentException("S3 key is empty");
        }

        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(props.getBucket())
                    .key(s3Key)
                    .build();

            ResponseInputStream<GetObjectResponse> response = s3Client.getObject(getObjectRequest);

            try (InputStream inputStream = response) {
                byte[] buffer = new byte[8192];
                java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
                int bytesRead;
                long totalBytes = 0;
                long maxSize = MAX_SIZE_BYTES;

                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    totalBytes += bytesRead;
                    if (totalBytes > maxSize) {
                        throw new IllegalArgumentException("Object too large: " + totalBytes + " bytes");
                    }
                    outputStream.write(buffer, 0, bytesRead);
                }

                return outputStream.toByteArray();
            }
        } catch (NoSuchKeyException e) {
            throw new IOException("Object not found in S3: " + s3Key, e);
        } catch (SdkException e) {
            throw new IOException("Failed to download object from S3: " + s3Key + ", Error: " + e.getMessage(), e);
        }
    }

    /**
     * Extract S3 key từ S3 URL
     * 
     * @param s3Url Full S3 URL (ví dụ:
     *              "https://bucket.s3.region.amazonaws.com/key")
     * @return S3 key (ví dụ: "uploads/uuid_filename.jpg")
     */
    public String extractS3KeyFromUrl(String s3Url) {
        if (s3Url == null || s3Url.isBlank()) {
            return null;
        }

        // Nếu có base URL, remove nó
        if (props.getBaseUrl() != null && !props.getBaseUrl().isBlank()) {
            String baseUrl = props.getBaseUrl().endsWith("/")
                    ? props.getBaseUrl().substring(0, props.getBaseUrl().length() - 1)
                    : props.getBaseUrl();
            if (s3Url.startsWith(baseUrl)) {
                return s3Url.substring(baseUrl.length() + 1); // +1 để bỏ dấu /
            }
        }

        // Fallback: Parse từ standard S3 URL format
        // https://bucket.s3.region.amazonaws.com/key
        String pattern = "https://" + props.getBucket() + ".s3." + props.getRegion() + ".amazonaws.com/";
        if (s3Url.startsWith(pattern)) {
            return s3Url.substring(pattern.length());
        }

        // Nếu không match, thử extract key từ URL (sau dấu / cuối cùng)
        int lastSlash = s3Url.lastIndexOf("/");
        if (lastSlash > 0 && lastSlash < s3Url.length() - 1) {
            return s3Url.substring(lastSlash + 1);
        }

        return s3Url; // Return as is if can't parse
    }

    /**
     * Xóa file từ S3
     * 
     * @param s3Key S3 key của file cần xóa (ví dụ: "images/uuid.jpg")
     * @return true nếu xóa thành công, false nếu file không tồn tại
     */
    public boolean deleteFile(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) {
            throw new IllegalArgumentException("S3 key cannot be empty");
        }

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(props.getBucket())
                    .key(s3Key)
                    .build();

            s3Client.deleteObject(deleteRequest);
            return true;
        } catch (NoSuchKeyException e) {
            // File không tồn tại, không phải lỗi nghiêm trọng
            return false;
        } catch (SdkException e) {
            String errorMsg = String.format(
                    "S3 Delete failed - Bucket: %s, Key: %s, Error: %s",
                    props.getBucket(), s3Key, e.getMessage());
            throw new RuntimeException(errorMsg, e);
        }
    }
}

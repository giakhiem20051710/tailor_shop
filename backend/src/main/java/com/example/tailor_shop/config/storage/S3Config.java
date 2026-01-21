package com.example.tailor_shop.config.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@EnableConfigurationProperties(S3Properties.class)
public class S3Config {

    @Bean
    @ConditionalOnExpression("'${aws.s3.access-key:}' != ''")
    public S3Client s3Client(S3Properties props) {
        // Kiểm tra credentials có tồn tại không
        if (props.getAccessKey() == null || props.getAccessKey().isBlank() ||
                props.getSecretKey() == null || props.getSecretKey().isBlank()) {
            throw new IllegalStateException("AWS S3 credentials not configured. " +
                    "Set aws.s3.access-key and aws.s3.secret-key in application.yml or environment variables.");
        }

        AwsBasicCredentials creds = AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey());
        return S3Client.builder()
                .region(Region.of(props.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .build();
    }
}

package com.example.tailor_shop.config.redis;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Cache Configuration with different TTLs for different cache types
 */
@Configuration
@EnableCaching
@ConditionalOnProperty(name = "spring.data.redis.host", matchIfMissing = false)
public class CacheConfig {

    // Cache names
    public static final String PRODUCTS_CACHE = "products";
    public static final String PRODUCT_DETAIL_CACHE = "product-detail";
    public static final String FABRICS_CACHE = "fabrics";
    public static final String IMAGE_ASSETS_CACHE = "image-assets";
    public static final String CATEGORIES_CACHE = "categories";

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Default configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        // Custom TTLs for different caches
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Products list: 5 minutes (frequently updated)
        cacheConfigurations.put(PRODUCTS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // Product detail: 10 minutes (less frequently updated)
        cacheConfigurations.put(PRODUCT_DETAIL_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(10)));

        // Fabrics: 15 minutes (rarely updated)
        cacheConfigurations.put(FABRICS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(15)));

        // Image assets: 30 minutes (very stable)
        cacheConfigurations.put(IMAGE_ASSETS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Categories: 1 hour (almost never changes)
        cacheConfigurations.put(CATEGORIES_CACHE, defaultConfig.entryTtl(Duration.ofHours(1)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}

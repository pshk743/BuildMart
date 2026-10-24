package com.buildingstore.cache;

import com.buildingstore.dto.response.ProductListResponse;
import java.time.Duration;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductCacheService {

    private final RedisCache redisCache;

    @Value("${app.cache.products.ttl}")
    private Duration ttl;

    @Value("${app.cache.products.key}")
    private String keyPrefix;

    public Optional<ProductListResponse> get(String queryKey) {
        return redisCache.get(buildKey(queryKey), ProductListResponse.class);
    }

    public void put(String queryKey, ProductListResponse response) {
        redisCache.put(buildKey(queryKey), response, ttl);
    }

    public void evictAll() {
        redisCache.evictByPrefix(keyPrefix + ":");
    }

    private String buildKey(String queryKey) {
        return keyPrefix + ":" + queryKey;
    }
}

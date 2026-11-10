package com.buildingstore.bootstrap;

import com.buildingstore.cache.ProductCacheService;
import com.buildingstore.dto.request.ProductRequest;
import com.buildingstore.entity.ProductEntity;
import com.buildingstore.factory.ProductFactory;
import com.buildingstore.mapper.ProductSeedMapper;
import com.buildingstore.repository.ProductRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Order(20)
@RequiredArgsConstructor
public class ProductSeeder implements ApplicationRunner {

    private final ProductRepository productRepository;
    private final ProductFactory productFactory;
    private final ProductSeedMapper productSeedMapper;
    private final ProductCacheService productCacheService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/products.json");
        if (!resource.exists()) {
            log.warn("Seed file seed/products.json not found, skipping product seed");
            return;
        }

        List<ProductSeedData> seeds;
        try (InputStream inputStream = resource.getInputStream()) {
            seeds = objectMapper.readValue(inputStream, new TypeReference<>() {
            });
        }

        if (productRepository.count() == 0) {
            List<ProductEntity> products = seeds.stream()
                    .map(productSeedMapper::toProductRequest)
                    .map(this::createProduct)
                    .toList();
            productRepository.saveAll(products);
            log.info("Seeded {} products from seed/products.json", products.size());
            return;
        }

        int updated = 0;
        for (ProductSeedData seed : seeds) {
            ProductRequest request = productSeedMapper.toProductRequest(seed);
            var existing = productRepository.findByTitle(seed.title());
            if (existing.isEmpty()) {
                continue;
            }

            ProductEntity product = existing.get();
            boolean needsImageUpdate = product.getImages() == null
                    || product.getImages().isEmpty()
                    || product.getImages().stream().anyMatch(url -> url == null || !url.startsWith("http"));

            if (!needsImageUpdate) {
                continue;
            }

            productFactory.createProduct(product, request);
            productRepository.save(product);
            updated++;
        }

        if (updated > 0) {
            productCacheService.evictAll();
            log.info("Updated Cloudinary images for {} products", updated);
        }
    }

    private ProductEntity createProduct(ProductRequest request) {
        return productFactory.createProduct(new ProductEntity(), request);
    }
}

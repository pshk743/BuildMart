package com.buildingstore.mapper;

import com.buildingstore.bootstrap.ProductSeedData;
import com.buildingstore.dto.request.ProductRequest;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ProductSeedMapper {

    private static final int DEFAULT_STOCK = 100;
    private static final int MIN_IMAGES = 3;

    public ProductRequest toProductRequest(ProductSeedData seed) {
        List<String> images = seed.images();
        if (images == null || images.size() < MIN_IMAGES) {
            throw new IllegalStateException(
                    "Seed product requires at least " + MIN_IMAGES + " images: " + seed.title()
            );
        }

        return new ProductRequest(
                seed.title(),
                seed.description(),
                seed.price(),
                seed.rating() == null ? 0.0 : seed.rating(),
                DEFAULT_STOCK,
                seed.category(),
                seed.specifications() == null ? Map.of() : seed.specifications(),
                images
        );
    }
}

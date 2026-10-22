package com.buildingstore.mapper;

import com.buildingstore.bootstrap.ProductSeedData;
import com.buildingstore.dto.request.ProductRequest;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ProductSeedMapper {

    private static final int DEFAULT_STOCK = 100;
    private static final int MIN_IMAGES = 3;

    private static final List<String> FALLBACK_GALLERY = List.of(
            "img/ExteriorPaintSet.jpg",
            "img/PlywoodSheets.jpg",
            "img/PremiumCementBags.jpg",
            "img/PremiumLumberPlanks.jpg",
            "img/RedClayBricks.jpg",
            "img/SteelI-Beams.jpg"
    );

    public ProductRequest toProductRequest(ProductSeedData seed) {
        return new ProductRequest(
                seed.title(),
                seed.description(),
                seed.price(),
                seed.rating() == null ? 0.0 : seed.rating(),
                DEFAULT_STOCK,
                seed.category(),
                seed.specifications() == null ? Map.of() : seed.specifications(),
                resolveImages(seed)
        );
    }

    private List<String> resolveImages(ProductSeedData seed) {
        Set<String> unique = new LinkedHashSet<>();
        if (seed.images() != null) {
            seed.images().stream()
                    .filter(StringUtils::hasText)
                    .forEach(unique::add);
        }
        if (StringUtils.hasText(seed.image())) {
            unique.add(seed.image());
        }

        for (String fallback : FALLBACK_GALLERY) {
            if (unique.size() >= MIN_IMAGES) {
                break;
            }
            unique.add(fallback);
        }

        List<String> images = new ArrayList<>(unique);
        if (images.size() < MIN_IMAGES) {
            throw new IllegalStateException("Seed product requires at least 3 distinct images: " + seed.title());
        }
        return images.subList(0, MIN_IMAGES);
    }
}

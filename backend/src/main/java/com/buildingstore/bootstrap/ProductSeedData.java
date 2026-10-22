package com.buildingstore.bootstrap;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductSeedData(
        String title,
        String description,
        BigDecimal price,
        Double rating,
        String category,
        String image,
        List<String> images,
        Map<String, String> specifications
) {
}

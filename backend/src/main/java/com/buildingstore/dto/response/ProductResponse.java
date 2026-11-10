package com.buildingstore.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductResponse(
        Long id,
        String title,
        String description,
        BigDecimal price,
        Double rating,
        Integer stockQuantity,
        String category,
        Map<String, String> specifications,
        List<String> images
) {
}

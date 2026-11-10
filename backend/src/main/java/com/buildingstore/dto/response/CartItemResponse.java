package com.buildingstore.dto.response;

import java.math.BigDecimal;

public record CartItemResponse(
        Long id,
        Long productId,
        String title,
        BigDecimal price,
        String image,
        Integer quantity,
        BigDecimal lineTotal
) {
}

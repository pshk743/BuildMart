package com.buildingstore.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        Long id,
        List<CartItemResponse> items,
        BigDecimal subtotal,
        String promoCode,
        Integer discountPercentage,
        BigDecimal discountAmount,
        BigDecimal total
) {
}

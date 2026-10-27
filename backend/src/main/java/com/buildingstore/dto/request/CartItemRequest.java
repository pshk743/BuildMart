package com.buildingstore.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CartItemRequest(
        @NotNull @JsonAlias("product_id") Long productId,
        @Min(1) Integer quantity
) {
    public int resolvedQuantity() {
        return quantity == null ? 1 : quantity;
    }
}

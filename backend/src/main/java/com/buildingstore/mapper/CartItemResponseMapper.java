package com.buildingstore.mapper;

import com.buildingstore.dto.response.CartItemResponse;
import com.buildingstore.entity.CartItemEntity;
import com.buildingstore.entity.ProductEntity;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Component;

@Component
public class CartItemResponseMapper {

    public CartItemResponse toCartItemResponse(CartItemEntity item) {
        ProductEntity product = item.getProduct();
        return new CartItemResponse(
                item.getId(),
                product.getId(),
                product.getTitle(),
                product.getPrice(),
                product.getImages().isEmpty() ? null : product.getImages().getFirst(),
                item.getQuantity(),
                product.getPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity()))
                        .setScale(2, RoundingMode.HALF_UP)
        );
    }
}

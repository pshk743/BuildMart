package com.buildingstore.mapper;

import com.buildingstore.dto.response.CartItemResponse;
import com.buildingstore.entity.CartEntity;
import com.buildingstore.entity.CartItemEntity;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CartResponseMapper {

    private final CartItemResponseMapper cartItemResponseMapper;

    public List<CartItemResponse> toCartItemResponses(CartEntity cart) {
        Map<Long, CartItemEntity> uniqueItems = new LinkedHashMap<>();
        for (CartItemEntity item : cart.getItems()) {
            if (item.getId() != null) {
                uniqueItems.putIfAbsent(item.getId(), item);
            }
        }

        return new ArrayList<>(uniqueItems.values()).stream()
                .map(cartItemResponseMapper::toCartItemResponse)
                .toList();
    }
}

package com.buildingstore.factory;

import com.buildingstore.entity.CartEntity;
import com.buildingstore.entity.CartItemEntity;
import com.buildingstore.entity.ProductEntity;
import org.springframework.stereotype.Component;

@Component
public class CartItemFactory {

    public CartItemEntity createCartItem(CartEntity cart, ProductEntity product) {
        CartItemEntity item = new CartItemEntity();
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantity(0);
        cart.addItem(item);
        return item;
    }
}

package com.buildingstore.factory;

import com.buildingstore.entity.CartEntity;
import com.buildingstore.entity.UserEntity;
import org.springframework.stereotype.Component;

@Component
public class CartFactory {

    public CartEntity createCart(UserEntity user) {
        CartEntity cart = new CartEntity();
        cart.setUser(user);
        return cart;
    }
}

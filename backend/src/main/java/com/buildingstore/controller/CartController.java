package com.buildingstore.controller;

import com.buildingstore.dto.request.ApplyPromoRequest;
import com.buildingstore.dto.request.CartItemRequest;
import com.buildingstore.dto.request.UpdateCartItemRequest;
import com.buildingstore.dto.response.CartResponse;
import com.buildingstore.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse getCart() {
        return cartService.getCart();
    }

    @PostMapping("/items")
    public CartResponse addItem(@Valid @RequestBody CartItemRequest request) {
        return cartService.addItem(request);
    }

    @PatchMapping("/items/{id}")
    public CartResponse updateItem(@PathVariable Long id, @Valid @RequestBody UpdateCartItemRequest request) {
        return cartService.updateItem(id, request);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(@PathVariable Long id) {
        cartService.removeItem(id);
    }

    @PostMapping("/apply-promo")
    public CartResponse applyPromo(@Valid @RequestBody ApplyPromoRequest request) {
        return cartService.applyPromo(request);
    }
}

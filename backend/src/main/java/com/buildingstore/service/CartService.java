package com.buildingstore.service;

import com.buildingstore.dto.request.ApplyPromoRequest;
import com.buildingstore.dto.request.CartItemRequest;
import com.buildingstore.dto.request.UpdateCartItemRequest;
import com.buildingstore.dto.response.CartItemResponse;
import com.buildingstore.dto.response.CartResponse;
import com.buildingstore.entity.CartEntity;
import com.buildingstore.entity.CartItemEntity;
import com.buildingstore.entity.ProductEntity;
import com.buildingstore.entity.PromoCodeEntity;
import com.buildingstore.entity.UserEntity;
import com.buildingstore.factory.CartFactory;
import com.buildingstore.factory.CartItemFactory;
import com.buildingstore.mapper.CartResponseMapper;
import com.buildingstore.repository.CartItemRepository;
import com.buildingstore.repository.CartRepository;
import com.buildingstore.repository.ProductRepository;
import com.buildingstore.repository.PromoCodeRepository;
import com.buildingstore.repository.UserRepository;
import com.buildingstore.security.UserPrincipal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final PromoCodeRepository promoCodeRepository;
    private final UserRepository userRepository;
    private final CartFactory cartFactory;
    private final CartItemFactory cartItemFactory;
    private final CartResponseMapper cartResponseMapper;

    @Transactional
    public CartResponse getCart() {
        return toCartResponse(getOrCreateCart());
    }

    @Transactional
    public CartResponse addItem(CartItemRequest request) {
        CartEntity cart = getOrCreateCart();
        ProductEntity product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        CartItemEntity item = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                .orElseGet(() -> cartItemFactory.createCartItem(cart, product));

        int newQuantity = item.getQuantity() + request.resolvedQuantity();
        ensureStock(product, newQuantity);
        item.setQuantity(newQuantity);
        cartItemRepository.saveAndFlush(item);

        return toCartResponse(reloadCart(currentUser().id()));
    }

    @Transactional
    public CartResponse updateItem(Long itemId, UpdateCartItemRequest request) {
        CartEntity cart = getOrCreateCart();
        CartItemEntity item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));

        ensureStock(item.getProduct(), request.quantity());
        item.setQuantity(request.quantity());
        cartItemRepository.saveAndFlush(item);

        return toCartResponse(reloadCart(currentUser().id()));
    }

    @Transactional
    public void removeItem(Long itemId) {
        CartEntity cart = getOrCreateCart();
        CartItemEntity item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
        cart.removeItem(item);
        cartItemRepository.delete(item);

        if (cart.getItems().isEmpty()) {
            cart.setPromoCode(null);
        }
        cartRepository.saveAndFlush(cart);
    }

    @Transactional
    public CartResponse applyPromo(ApplyPromoRequest request) {
        CartEntity cart = getOrCreateCart();
        PromoCodeEntity promoCode = promoCodeRepository.findByCodeIgnoreCase(request.code().trim())
                .filter(PromoCodeEntity::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo code is invalid"));

        cart.setPromoCode(promoCode);
        cartRepository.saveAndFlush(cart);

        return toCartResponse(reloadCart(currentUser().id()));
    }

    private CartResponse toCartResponse(CartEntity cart) {
        List<CartItemResponse> items = cartResponseMapper.toCartItemResponses(cart);

        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        PromoCodeEntity promo = cart.getPromoCode();
        Integer discountPercentage = promo == null ? null : promo.getDiscountPercentage();
        BigDecimal discountAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        if (promo != null && promo.isActive()) {
            discountAmount = subtotal
                    .multiply(BigDecimal.valueOf(promo.getDiscountPercentage()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        return new CartResponse(
                cart.getId(),
                items,
                subtotal,
                promo == null ? null : promo.getCode(),
                discountPercentage,
                discountAmount,
                subtotal.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP)
        );
    }

    private CartEntity reloadCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));
    }

    private CartEntity getOrCreateCart() {
        Long userId = currentUser().id();
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
            CartEntity cart = cartFactory.createCart(user);
            return cartRepository.save(cart);
        });
    }

    private void ensureStock(ProductEntity product, int quantity) {
        if (quantity > product.getStockQuantity()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Requested quantity exceeds available stock (" + product.getStockQuantity() + ")"
            );
        }
    }

    private UserPrincipal currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return principal;
    }
}

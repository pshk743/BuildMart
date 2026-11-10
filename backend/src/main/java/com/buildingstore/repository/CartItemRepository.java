package com.buildingstore.repository;

import com.buildingstore.entity.CartItemEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {

    Optional<CartItemEntity> findByIdAndCartId(Long id, Long cartId);

    Optional<CartItemEntity> findByCartIdAndProductId(Long cartId, Long productId);

    void deleteByProductId(Long productId);
}

package com.buildingstore.repository;

import com.buildingstore.entity.CartEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<CartEntity, Long> {

    @EntityGraph(attributePaths = {"items", "items.product", "promoCode"})
    Optional<CartEntity> findByUserId(Long userId);
}

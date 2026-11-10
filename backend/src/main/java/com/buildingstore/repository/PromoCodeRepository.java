package com.buildingstore.repository;

import com.buildingstore.entity.PromoCodeEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromoCodeRepository extends JpaRepository<PromoCodeEntity, Long> {

    Optional<PromoCodeEntity> findByCodeIgnoreCase(String code);
}

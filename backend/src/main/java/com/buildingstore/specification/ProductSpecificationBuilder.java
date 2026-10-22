package com.buildingstore.specification;

import com.buildingstore.dto.request.ProductListRequest;
import com.buildingstore.entity.ProductEntity;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class ProductSpecificationBuilder {

    private ProductSpecificationBuilder() {
    }

    public static Specification<ProductEntity> from(ProductListRequest request) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(request.search())) {
                String term = "%" + escapeLike(request.search().toLowerCase(Locale.ROOT)) + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), term, '\\');
                Predicate descriptionMatch = cb.like(cb.lower(root.get("description")), term, '\\');
                predicates.add(cb.or(titleMatch, descriptionMatch));
            }

            if (request.minPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), request.minPrice()));
            }

            if (request.maxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), request.maxPrice()));
            }

            if (request.minRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), request.minRating()));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static String escapeLike(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}

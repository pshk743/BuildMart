package com.buildingstore.mapper;

import com.buildingstore.dto.response.ProductResponse;
import com.buildingstore.entity.ProductEntity;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ProductResponseMapper {

    public ProductResponse toProductResponse(ProductEntity product) {
        return new ProductResponse(
                product.getId(),
                product.getTitle(),
                product.getDescription(),
                product.getPrice(),
                product.getRating(),
                product.getStockQuantity(),
                product.getCategory(),
                product.getSpecifications(),
                List.copyOf(product.getImages())
        );
    }
}

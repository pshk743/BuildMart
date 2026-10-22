package com.buildingstore.factory;

import com.buildingstore.dto.request.ProductRequest;
import com.buildingstore.entity.ProductEntity;
import java.util.ArrayList;
import java.util.HashMap;
import org.springframework.stereotype.Component;

@Component
public class ProductFactory {

    public ProductEntity createProduct(ProductEntity product, ProductRequest request) {
        product.setTitle(request.title().trim());
        product.setDescription(request.description().trim());
        product.setPrice(request.price());
        product.setRating(request.rating());
        product.setStockQuantity(request.stockQuantity());
        product.setCategory(request.category() == null ? null : request.category().trim());
        product.setSpecifications(
                request.specifications() == null ? new HashMap<>() : new HashMap<>(request.specifications())
        );
        product.setImages(new ArrayList<>(request.images()));
        return product;
    }
}

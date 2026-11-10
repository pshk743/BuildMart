package com.buildingstore.service;

import com.buildingstore.cache.ProductCacheService;
import com.buildingstore.dto.request.ProductListRequest;
import com.buildingstore.dto.request.ProductRequest;
import com.buildingstore.dto.response.ProductListMetaResponse;
import com.buildingstore.dto.response.ProductListResponse;
import com.buildingstore.dto.response.ProductResponse;
import com.buildingstore.entity.ProductEntity;
import com.buildingstore.factory.ProductFactory;
import com.buildingstore.mapper.ProductResponseMapper;
import com.buildingstore.repository.CartItemRepository;
import com.buildingstore.repository.ProductRepository;
import com.buildingstore.specification.ProductSpecificationBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductCacheService productCacheService;
    private final ProductFactory productFactory;
    private final ProductResponseMapper productResponseMapper;

    @Transactional(readOnly = true)
    public ProductListResponse list(ProductListRequest request) {
        String cacheKey = request.cacheKey();

        return productCacheService.get(cacheKey).orElseGet(() -> {
            Page<ProductEntity> page = productRepository.findAll(
                    ProductSpecificationBuilder.from(request),
                    request.toPageable()
            );

            ProductListResponse response = new ProductListResponse(
                    page.getContent().stream().map(productResponseMapper::toProductResponse).toList(),
                    new ProductListMetaResponse(
                            page.getTotalElements(),
                            page.getTotalPages(),
                            request.page(),
                            request.limit()
                    )
            );
            productCacheService.put(cacheKey, response);
            return response;
        });
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        ProductEntity product = findProduct(id);
        return productResponseMapper.toProductResponse(product);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        ProductEntity product = productFactory.createProduct(new ProductEntity(), request);
        ProductEntity saved = productRepository.save(product);
        log.info("Created product {} вЂ” {}", saved.getId(), saved.getTitle());
        productCacheService.evictAll();
        return productResponseMapper.toProductResponse(saved);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        ProductEntity product = productFactory.createProduct(findProduct(id), request);
        ProductEntity saved = productRepository.save(product);
        log.info("Updated product {} вЂ” {}", saved.getId(), saved.getTitle());
        productCacheService.evictAll();
        return productResponseMapper.toProductResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        ProductEntity product = findProduct(id);
        cartItemRepository.deleteByProductId(product.getId());
        productRepository.delete(product);
        log.info("Deleted product {}", id);
        productCacheService.evictAll();
    }

    private ProductEntity findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }
}

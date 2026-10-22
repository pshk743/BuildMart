package com.buildingstore.service;

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
    private final ProductFactory productFactory;
    private final ProductResponseMapper productResponseMapper;

    @Transactional(readOnly = true)
    public ProductListResponse list(ProductListRequest request) {
        Page<ProductEntity> page = productRepository.findAll(
                ProductSpecificationBuilder.from(request),
                request.toPageable()
        );

        return new ProductListResponse(
                page.getContent().stream().map(productResponseMapper::toProductResponse).toList(),
                new ProductListMetaResponse(
                        page.getTotalElements(),
                        page.getTotalPages(),
                        request.page(),
                        request.limit()
                )
        );
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return productResponseMapper.toProductResponse(findProduct(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        ProductEntity saved = productRepository.save(productFactory.createProduct(new ProductEntity(), request));
        log.info("Created product {} — {}", saved.getId(), saved.getTitle());
        return productResponseMapper.toProductResponse(saved);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        ProductEntity saved = productRepository.save(productFactory.createProduct(findProduct(id), request));
        log.info("Updated product {} — {}", saved.getId(), saved.getTitle());
        return productResponseMapper.toProductResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        ProductEntity product = findProduct(id);
        cartItemRepository.deleteByProductId(product.getId());
        productRepository.delete(product);
        log.info("Deleted product {}", id);
    }

    private ProductEntity findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }
}

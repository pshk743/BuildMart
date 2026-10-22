package com.buildingstore.dto.response;

import java.util.List;

public record ProductListResponse(
        List<ProductResponse> items,
        ProductListMetaResponse meta
) {
}

package com.buildingstore.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ProductListMetaResponse(
        @JsonProperty("total_items") long totalItems,
        @JsonProperty("total_pages") int totalPages,
        @JsonProperty("current_page") int currentPage,
        @JsonProperty("limit") int limit
) {
}

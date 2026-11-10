package com.buildingstore.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank String description,
        @NotNull @DecimalMin("0.00") BigDecimal price,
        @NotNull @Min(0) @Max(5) Double rating,
        @NotNull @Min(0) Integer stockQuantity,
        @Size(max = 100) String category,
        Map<String, String> specifications,
        @NotEmpty @Size(min = 3) List<@NotBlank String> images
) {
}

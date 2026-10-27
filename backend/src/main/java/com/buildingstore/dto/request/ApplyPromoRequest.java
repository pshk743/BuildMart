package com.buildingstore.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ApplyPromoRequest(
        @NotBlank String code
) {
}

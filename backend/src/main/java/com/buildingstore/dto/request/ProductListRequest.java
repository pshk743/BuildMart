package com.buildingstore.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.BindParam;

public record ProductListRequest(
        @Min(1) Integer page,
        @Min(1) @Max(100) Integer limit,
        String search,
        @BindParam("min_price") @DecimalMin("0.0") BigDecimal minPrice,
        @BindParam("max_price") @DecimalMin("0.0") BigDecimal maxPrice,
        @BindParam("min_rating") @Min(0) @Max(5) Double minRating,
        @BindParam("sort_by") @Pattern(regexp = "price|title", flags = Pattern.Flag.CASE_INSENSITIVE) String sortBy,
        @Pattern(regexp = "asc|desc", flags = Pattern.Flag.CASE_INSENSITIVE) String order
) {
    public ProductListRequest {
        page = page == null ? 1 : page;
        limit = limit == null ? 12 : limit;
        search = StringUtils.hasText(search) ? search.trim() : null;
        sortBy = StringUtils.hasText(sortBy) ? sortBy.trim() : null;
        order = StringUtils.hasText(order) ? order.trim() : "asc";
    }

    public String cacheKey() {
        String raw = page + "|" + limit + "|" + nullToEmpty(search)
                + "|" + nullToEmpty(minPrice) + "|" + nullToEmpty(maxPrice)
                + "|" + nullToEmpty(minRating) + "|" + nullToEmpty(sortBy)
                + "|" + order.toLowerCase(Locale.ROOT);
        return DigestUtils.md5DigestAsHex(raw.getBytes(StandardCharsets.UTF_8));
    }

    public Pageable toPageable() {
        Sort sort = Sort.by("id").ascending();
        if (StringUtils.hasText(sortBy)) {
            String field = sortBy.toLowerCase(Locale.ROOT);
            sort = "desc".equalsIgnoreCase(order)
                    ? Sort.by(field).descending()
                    : Sort.by(field).ascending();
        }
        return PageRequest.of(page - 1, limit, sort);
    }

    private static String nullToEmpty(Object value) {
        return value == null ? "" : String.valueOf(value).trim().toLowerCase(Locale.ROOT);
    }
}

package com.buildingstore.security;

import com.buildingstore.entity.enums.Role;

public record UserPrincipal(
        Long id,
        String email,
        Role role
) {
}

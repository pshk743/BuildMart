package com.buildingstore.factory;

import com.buildingstore.dto.request.RegisterRequest;
import com.buildingstore.entity.UserEntity;
import com.buildingstore.entity.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserFactory {

    private final PasswordEncoder passwordEncoder;

    public UserEntity createCustomer(RegisterRequest request) {
        return createUser(
                request.email().trim().toLowerCase(),
                request.password(),
                Role.CUSTOMER
        );
    }

    public UserEntity createAdmin(String email, String password) {
        return createUser(email.trim().toLowerCase(), password, Role.ADMIN);
    }

    private UserEntity createUser(String email, String password, Role role) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        return user;
    }
}

package com.buildingstore.service;

import com.buildingstore.dto.request.LoginRequest;
import com.buildingstore.dto.request.RegisterRequest;
import com.buildingstore.dto.response.AuthResponse;
import com.buildingstore.entity.UserEntity;
import com.buildingstore.factory.UserFactory;
import com.buildingstore.repository.UserRepository;
import com.buildingstore.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserFactory userFactory;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            log.warn("Registration failed: email already exists - {}", email);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        UserEntity user = userFactory.createCustomer(request);
        UserEntity saved = userRepository.save(user);
        log.info("User registered: {}", email);
        return new AuthResponse(jwtUtil.generateToken(saved));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Login failed: user not found - {}", email);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Login failed: invalid password - {}", email);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        log.info("User logged in: {}", email);
        return new AuthResponse(jwtUtil.generateToken(user));
    }
}

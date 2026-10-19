package com.buildingstore.bootstrap;

import com.buildingstore.entity.UserEntity;
import com.buildingstore.factory.UserFactory;
import com.buildingstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class AdminUserSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final UserFactory userFactory;

    @Value("${app.admin.email:}")
    private String email;

    @Value("${app.admin.password:}")
    private String password;

    @Override
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            return;
        }

        UserEntity admin = userFactory.createAdmin(normalizedEmail, password);
        userRepository.save(admin);
        log.info("Admin user created: {}", normalizedEmail);
    }
}

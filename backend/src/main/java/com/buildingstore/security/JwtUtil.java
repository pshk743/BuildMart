package com.buildingstore.security;

import com.buildingstore.entity.UserEntity;
import com.buildingstore.entity.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes:1440}") long expirationMinutes
    ) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes long");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = expirationMinutes * 60_000;
    }

    public String generateToken(UserEntity user) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public UserPrincipal toPrincipal(String token) {
        Claims claims = parse(token);
        return new UserPrincipal(
                Long.valueOf(claims.getSubject()),
                claims.get("email", String.class),
                Role.valueOf(claims.get("role", String.class))
        );
    }

    public boolean isValid(String token) {
        try {
            return parse(token).getExpiration().after(new Date());
        } catch (Exception ex) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

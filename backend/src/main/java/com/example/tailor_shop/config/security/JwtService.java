package com.example.tailor_shop.config.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * JWT Service for token generation and validation.
 * 
 * Security features:
 * - Access Token: Short-lived (30 min default) for API access
 * - Refresh Token: Long-lived (7 days default) for token refresh
 * - JTI (JWT ID): Unique ID for each token, enables revocation
 * - Token Type: Distinguishes between access and refresh tokens
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration:1800000}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-expiration:604800000}") long refreshTokenExpirationMs) {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "JWT secret cannot be null or empty. Please set jwt.secret in application.yml or environment variable JWT_SECRET.");
        }
        byte[] secretBytes = secret.getBytes();
        if (secretBytes.length < 32) {
            throw new IllegalArgumentException(
                    String.format(
                            "JWT secret must be at least 32 bytes (256 bits) long. Current length: %d bytes. Please set a longer JWT_SECRET in your .env file.",
                            secretBytes.length));
        }
        try {
            this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid JWT secret. Secret must be at least 32 bytes (256 bits) for HMAC SHA-256. " +
                            "Please set a valid JWT_SECRET in your .env file. Error: " + e.getMessage(),
                    e);
        }
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    // ==================== GETTERS ====================

    public long getExpirationMs() {
        return accessTokenExpirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshTokenExpirationMs;
    }

    // ==================== TOKEN GENERATION ====================

    /**
     * Generate an access token for the given user.
     * Access tokens are short-lived and used for API authentication.
     */
    public String generateToken(UserDetails userDetails) {
        return generateAccessToken(userDetails);
    }

    /**
     * Generate an access token with roles and type claim.
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        claims.put("type", "access");
        return buildToken(claims, userDetails.getUsername(), accessTokenExpirationMs);
    }

    /**
     * Generate a refresh token for the given user.
     * Refresh tokens are long-lived and used to obtain new access tokens.
     */
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        return buildToken(claims, userDetails.getUsername(), refreshTokenExpirationMs);
    }

    // ==================== TOKEN EXTRACTION ====================

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract JTI (JWT ID) for token revocation/blacklisting.
     */
    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    /**
     * Extract token type (access or refresh).
     */
    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get("type", String.class));
    }

    /**
     * Extract expiration time (useful for blacklist TTL).
     */
    public long extractExpirationTimeMs(String token) {
        return extractExpiration(token).getTime();
    }

    // ==================== TOKEN VALIDATION ====================

    /**
     * Validate that the token is valid for the given user.
     * Does not check blacklist - that should be done separately.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    /**
     * Check if token is an access token.
     */
    public boolean isAccessToken(String token) {
        String type = extractTokenType(token);
        return "access".equals(type);
    }

    /**
     * Check if token is a refresh token.
     */
    public boolean isRefreshToken(String token) {
        String type = extractTokenType(token);
        return "refresh".equals(type);
    }

    // ==================== PRIVATE HELPERS ====================

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expirationMs) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .id(UUID.randomUUID().toString()) // JTI for revocation
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(signingKey)
                .compact();
    }
}

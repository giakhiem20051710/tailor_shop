package com.example.tailor_shop.config.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // Read CORS origins from application.yml (comma-separated)
    @Value("${cors.allowed-origins:http://localhost,http://localhost:3000,http://localhost:5173}")
    private String allowedOriginsConfig;

    public SecurityConfig(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // === CSRF: Disabled for stateless REST API ===
                .csrf(csrf -> csrf.disable())
                
                // === CORS: Use configurable origins ===
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                
                // === Session: Stateless (JWT-based) ===
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                
                // === Security Headers (IMPORTANT for production) ===
                .headers(headers -> headers
                        // Prevent MIME type sniffing
                        .contentTypeOptions(contentTypeOptions -> {})
                        // Prevent clickjacking
                        .frameOptions(frameOptions -> frameOptions.deny())
                        // XSS protection
                        .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                        // Cache control for security
                        .cacheControl(cacheControl -> {})
                )
                
                // === Authorization Rules ===
                .authorizeHttpRequests(auth -> auth
                        // Public: Auth endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Public: Health check only (not all actuator!)
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/actuator/info").permitAll()
                        // Secure other actuator endpoints
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        // Public: CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public: Catalog browsing (GET only)
                        .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/styles/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/fabrics/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/product-configurations/templates/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/image-assets/**").permitAll()
                        // Protected: Modify operations require authentication
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/image-assets/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/image-assets/**").authenticated()
                        // All other requests require authentication
                        .anyRequest().authenticated())
                
                // === Authentication ===
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter() {
        return new JwtAuthFilter(jwtService, userDetailsService);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Parse origins from config (comma-separated string)
        List<String> origins = Arrays.asList(allowedOriginsConfig.split(","));
        configuration.setAllowedOrigins(origins.stream().map(String::trim).toList());
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

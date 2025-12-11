package com.myhien.tailor.modules.auth.service.impl;

import com.myhien.tailor.config.exception.BadRequestException;
import com.myhien.tailor.config.exception.BusinessException;
import com.myhien.tailor.config.security.CustomUserDetails;
import com.myhien.tailor.config.security.JwtService;
import com.myhien.tailor.modules.auth.dto.LoginRequest;
import com.myhien.tailor.modules.auth.dto.LoginResponse;
import com.myhien.tailor.modules.auth.dto.RegisterRequest;
import com.myhien.tailor.modules.auth.service.AuthService;
import com.myhien.tailor.modules.user.domain.RoleEntity;
import com.myhien.tailor.modules.user.domain.UserEntity;
import com.myhien.tailor.modules.user.repository.RoleRepository;
import com.myhien.tailor.modules.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           JwtService jwtService,
                           UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(principal);
        String role = principal.getAuthorities().stream()
            .findFirst()
            .map(granted -> granted.getAuthority())
            .orElse("ROLE_CUSTOMER");

        return LoginResponse.of(token, principal.getUsername(), role);
    }

    @Override
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already exists");
        }

        RoleEntity defaultRole = roleRepository.findByCode("customer")
            .orElseThrow(() -> new BusinessException("ROLE_NOT_FOUND", "Role customer not found"));

        UserEntity user = new UserEntity();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setRole(defaultRole);
        user.setStatus(UserEntity.UserStatus.active);

        UserEntity saved = userRepository.save(user);

        CustomUserDetails principal = new CustomUserDetails(saved);
        String token = jwtService.generateToken(principal);
        String role = principal.getAuthorities().stream()
            .findFirst()
            .map(granted -> granted.getAuthority())
            .orElse("ROLE_CUSTOMER");

        return LoginResponse.of(token, saved.getUsername(), role);
    }
}


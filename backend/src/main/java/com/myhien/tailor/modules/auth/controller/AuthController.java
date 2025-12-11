package com.myhien.tailor.modules.auth.controller;

import com.myhien.tailor.modules.auth.dto.LoginRequest;
import com.myhien.tailor.modules.auth.dto.LoginResponse;
import com.myhien.tailor.modules.auth.dto.RegisterRequest;
import com.myhien.tailor.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody @Valid LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public LoginResponse register(@RequestBody @Valid RegisterRequest request) {
        return authService.register(request);
    }
}


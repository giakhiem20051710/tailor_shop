package com.myhien.tailor.modules.user.controller;

import com.myhien.tailor.modules.user.dto.UserRequestDTO;
import com.myhien.tailor.modules.user.dto.UserResponseDTO;
import com.myhien.tailor.modules.user.dto.ProfileUpdateRequest;
import com.myhien.tailor.modules.user.service.UserService;
import com.myhien.tailor.config.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDTO create(@RequestBody @Valid UserRequestDTO request) {
        return userService.create(request);
    }
    
    @PutMapping("/{id}")
    public UserResponseDTO update(
        @PathVariable Long id,
        @RequestBody @Valid UserRequestDTO request
    ) {
        return userService.update(id, request);
    }
    
    @GetMapping("/{id}")
    public UserResponseDTO findById(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    @GetMapping
    public Page<UserResponseDTO> findAll(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return userService.findAll(pageable);
    }

    @GetMapping("/customers")
    public Page<UserResponseDTO> findCustomers(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return userService.findCustomers(pageable);
    }

    @GetMapping("/tailors")
    public Page<UserResponseDTO> findTailors(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return userService.findTailors(pageable);
    }

    @GetMapping("/me")
    public UserResponseDTO getProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        return userService.getProfile(principal.getId());
    }

    @PutMapping("/me")
    public UserResponseDTO updateProfile(
        @AuthenticationPrincipal CustomUserDetails principal,
        @RequestBody @Valid ProfileUpdateRequest request
    ) {
        return userService.updateProfile(principal.getId(), request);
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}


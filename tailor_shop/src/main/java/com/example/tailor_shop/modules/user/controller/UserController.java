package com.example.tailor_shop.modules.user.controller;

import com.example.tailor_shop.common.CommonResponse;
import com.example.tailor_shop.common.ResponseUtil;
import com.example.tailor_shop.common.TraceIdUtil;
import com.example.tailor_shop.config.security.CustomUserDetails;
import com.example.tailor_shop.modules.user.dto.ProfileUpdateRequest;
import com.example.tailor_shop.modules.user.dto.UserRequestDTO;
import com.example.tailor_shop.modules.user.dto.UserResponseDTO;
import com.example.tailor_shop.modules.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<CommonResponse<UserResponseDTO>> create(@RequestBody @Valid UserRequestDTO request) {
        UserResponseDTO data = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommonResponse<UserResponseDTO>> update(
            @PathVariable Long id,
            @RequestBody @Valid UserRequestDTO request
    ) {
        UserResponseDTO data = userService.update(id, request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<UserResponseDTO>> findById(@PathVariable Long id) {
        UserResponseDTO data = userService.findById(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping
    public ResponseEntity<CommonResponse<Page<UserResponseDTO>>> findAll(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<UserResponseDTO> data = userService.findAll(pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/customers")
    public ResponseEntity<CommonResponse<Page<UserResponseDTO>>> findCustomers(
            @RequestParam(value = "phone", required = false) String phone,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<UserResponseDTO> data;
        if (phone != null && !phone.isBlank()) {
            data = userService.findCustomersByPhone(phone, pageable);
        } else {
            data = userService.findCustomers(pageable);
        }
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @GetMapping("/customers/by-phone")
    public ResponseEntity<CommonResponse<UserResponseDTO>> findCustomerByPhone(
            @RequestParam("phone") String phone
    ) {
        java.util.Optional<UserResponseDTO> data = userService.findCustomerByPhone(phone);
        if (data.isPresent()) {
            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data.get()));
        } else {
            return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
        }
    }

    @GetMapping("/tailors")
    public ResponseEntity<CommonResponse<Page<UserResponseDTO>>> findTailors(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<UserResponseDTO> data = userService.findTailors(pageable);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }


    @GetMapping("/me")
    public ResponseEntity<CommonResponse<UserResponseDTO>> getProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        UserResponseDTO data = userService.getProfile(principal.getId());
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @PutMapping("/me")
    public ResponseEntity<CommonResponse<UserResponseDTO>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody @Valid ProfileUpdateRequest request
    ) {
        UserResponseDTO data = userService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<CommonResponse<Void>> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.ok(ResponseUtil.success(TraceIdUtil.getOrCreateTraceId(), null));
    }
}


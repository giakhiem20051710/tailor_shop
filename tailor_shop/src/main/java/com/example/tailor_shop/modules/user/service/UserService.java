package com.example.tailor_shop.modules.user.service;

import com.example.tailor_shop.modules.user.dto.ProfileUpdateRequest;
import com.example.tailor_shop.modules.user.dto.UserRequestDTO;
import com.example.tailor_shop.modules.user.dto.UserResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserResponseDTO create(UserRequestDTO request);

    UserResponseDTO update(Long id, UserRequestDTO request);

    UserResponseDTO findById(Long id);

    Page<UserResponseDTO> findAll(Pageable pageable);

    Page<UserResponseDTO> findCustomers(Pageable pageable);

    Page<UserResponseDTO> findTailors(Pageable pageable);

    UserResponseDTO getProfile(Long userId);

    UserResponseDTO updateProfile(Long userId, ProfileUpdateRequest request);

    void delete(Long id);

}

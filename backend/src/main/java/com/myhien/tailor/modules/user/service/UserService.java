package com.myhien.tailor.modules.user.service;

import com.myhien.tailor.modules.user.dto.UserRequestDTO;
import com.myhien.tailor.modules.user.dto.UserResponseDTO;
import com.myhien.tailor.modules.user.dto.ProfileUpdateRequest;
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


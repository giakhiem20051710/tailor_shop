package com.myhien.tailor.modules.user.service.impl;

import com.myhien.tailor.config.exception.BusinessException;
import com.myhien.tailor.config.exception.ErrorCode;
import com.myhien.tailor.modules.user.domain.RoleEntity;
import com.myhien.tailor.modules.user.domain.UserEntity;
import com.myhien.tailor.modules.user.dto.UserRequestDTO;
import com.myhien.tailor.modules.user.dto.UserResponseDTO;
import com.myhien.tailor.modules.user.dto.ProfileUpdateRequest;
import com.myhien.tailor.modules.user.repository.RoleRepository;
import com.myhien.tailor.modules.user.repository.UserRepository;
import com.myhien.tailor.modules.user.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserServiceImpl(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @Override
    public UserResponseDTO create(UserRequestDTO request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessException(ErrorCode.USERNAME_EXISTS);
        }
        
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_EXISTS);
        }
        
        RoleEntity role = roleRepository.findById(request.roleId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
        
        UserEntity entity = new UserEntity();
        entity.setUsername(request.username());
        entity.setPassword(passwordEncoder.encode(request.password()));
        entity.setName(request.name());
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        entity.setRole(role);
        entity.setStatus(UserEntity.UserStatus.active);
        
        UserEntity saved = userRepository.save(entity);
        return toResponseDTO(saved);
    }
    
    @Override
    public UserResponseDTO update(Long id, UserRequestDTO request) {
        UserEntity entity = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        
        if (entity.getIsDeleted()) {
            throw new BusinessException(ErrorCode.USER_DELETED);
        }
        
        // Check username uniqueness (if changed)
        if (!entity.getUsername().equals(request.username()) && 
            userRepository.existsByUsername(request.username())) {
            throw new BusinessException(ErrorCode.USERNAME_EXISTS);
        }
        
        // Check email uniqueness (if changed)
        if (!entity.getEmail().equals(request.email()) && 
            userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_EXISTS);
        }
        
        RoleEntity role = roleRepository.findById(request.roleId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
        
        entity.setUsername(request.username());
        if (request.password() != null && !request.password().isBlank()) {
            entity.setPassword(passwordEncoder.encode(request.password()));
        }
        entity.setName(request.name());
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        entity.setRole(role);
        
        UserEntity saved = userRepository.save(entity);
        return toResponseDTO(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO findById(Long id) {
        UserEntity entity = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        
        if (entity.getIsDeleted()) {
            throw new BusinessException(ErrorCode.USER_DELETED);
        }
        
        return toResponseDTO(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> findAll(Pageable pageable) {
        return userRepository.findByIsDeletedFalse(pageable)
            .map(this::toResponseDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> findCustomers(Pageable pageable) {
        return userRepository.findByRole_CodeAndIsDeletedFalse("customer", pageable)
            .map(this::toResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> findTailors(Pageable pageable) {
        return userRepository.findByRole_CodeAndIsDeletedFalse("tailor", pageable)
            .map(this::toResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO getProfile(Long userId) {
        UserEntity entity = userRepository.findByIdAndIsDeletedFalse(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return toResponseDTO(entity);
    }

    @Override
    public UserResponseDTO updateProfile(Long userId, ProfileUpdateRequest request) {
        UserEntity entity = userRepository.findByIdAndIsDeletedFalse(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // Check email uniqueness if changed
        if (!entity.getEmail().equals(request.email()) && userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_EXISTS);
        }

        entity.setName(request.name());
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        if (request.password() != null && !request.password().isBlank()) {
            entity.setPassword(passwordEncoder.encode(request.password()));
        }

        UserEntity saved = userRepository.save(entity);
        return toResponseDTO(saved);
    }
    
    @Override
    public void delete(Long id) {
        UserEntity entity = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        
        entity.setIsDeleted(true);
        userRepository.save(entity);
    }
    
    private UserResponseDTO toResponseDTO(UserEntity entity) {
        return new UserResponseDTO(
            entity.getId(),
            entity.getUsername(),
            entity.getName(),
            entity.getEmail(),
            entity.getPhone(),
            entity.getStatus().name(),
            entity.getRole() != null ? entity.getRole().getId() : null,
            entity.getRole() != null ? entity.getRole().getCode() : null,
            entity.getRole() != null ? entity.getRole().getName() : null,
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}


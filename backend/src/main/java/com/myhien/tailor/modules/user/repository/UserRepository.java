package com.myhien.tailor.modules.user.repository;

import com.myhien.tailor.modules.user.domain.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    
    Optional<UserEntity> findByUsernameAndIsDeletedFalse(String username);
    
    Optional<UserEntity> findByEmailAndIsDeletedFalse(String email);
    
    Optional<UserEntity> findByIdAndIsDeletedFalse(Long id);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    Page<UserEntity> findByIsDeletedFalse(Pageable pageable);

    Page<UserEntity> findByRole_CodeAndIsDeletedFalse(String roleCode, Pageable pageable);
}


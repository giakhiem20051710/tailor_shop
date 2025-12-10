package com.example.tailor_shop.modules.user.repository;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsernameAndIsDeletedFalse(String username);

    Optional<UserEntity> findByEmailAndIsDeletedFalse(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<UserEntity> findByPhoneAndIsDeletedFalse(String phone);

    Page<UserEntity> findByIsDeletedFalse(Pageable pageable);
}


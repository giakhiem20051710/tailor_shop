package com.example.tailor_shop.config.security;

import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String phoneOrEmailOrUsername) throws UsernameNotFoundException {
        // Try phone -> email -> username to be flexible for admin login
        UserEntity user = userRepository.findByPhoneAndIsDeletedFalse(phoneOrEmailOrUsername)
                .or(() -> userRepository.findByEmailAndIsDeletedFalse(phoneOrEmailOrUsername))
                .or(() -> userRepository.findByUsernameAndIsDeletedFalse(phoneOrEmailOrUsername))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with phone, email, or username: " + phoneOrEmailOrUsername));
        return new CustomUserDetails(user);
    }
}


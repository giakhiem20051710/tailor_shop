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
    public UserDetails loadUserByUsername(String phoneOrEmail) throws UsernameNotFoundException {
        // Try to find by phone first (if it looks like a phone number), then by email
        UserEntity user = userRepository.findByPhoneAndIsDeletedFalse(phoneOrEmail)
                .or(() -> userRepository.findByEmailAndIsDeletedFalse(phoneOrEmail))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with phone or email: " + phoneOrEmail));
        return new CustomUserDetails(user);
    }
}


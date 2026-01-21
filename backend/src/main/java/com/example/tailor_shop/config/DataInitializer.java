package com.example.tailor_shop.config;

import com.example.tailor_shop.common.PredefinedRole;
import com.example.tailor_shop.modules.user.domain.RoleEntity;
import com.example.tailor_shop.modules.user.domain.UserEntity;
import com.example.tailor_shop.modules.user.repository.RoleRepository;
import com.example.tailor_shop.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL = "admin@myhien.com";
    private static final String ADMIN_PASSWORD = "Admin@123";

    @Bean("databaseInitializer")
    @Transactional
    public ApplicationRunner applicationRunner(RoleRepository roleRepository,
            UserRepository userRepository) {
        return args -> {
            log.info("Initializing application roles and default admin user...");

            // Cleanup: Xóa các role cũ không cần thiết (chỉ giữ lại 4 role chính)
            List<String> validRoleCodes = List.of(
                    PredefinedRole.ADMIN_ROLE,
                    PredefinedRole.STAFF_ROLE,
                    PredefinedRole.TAILOR_ROLE,
                    PredefinedRole.CUSTOMER_ROLE);

            roleRepository.findAll().forEach(role -> {
                if (!validRoleCodes.contains(role.getCode())) {
                    // Kiểm tra xem có user nào đang dùng role này không
                    boolean hasUsersWithRole = userRepository.findAll().stream()
                            .anyMatch(user -> user.getRole() != null && user.getRole().getId().equals(role.getId()));

                    if (!hasUsersWithRole) {
                        log.info("Deleting old role: {} ({})", role.getCode(), role.getName());
                        roleRepository.delete(role);
                    } else {
                        log.warn("Cannot delete role {} ({}) - users are still using it", role.getCode(),
                                role.getName());
                    }
                }
            });

            // Ensure base roles exist (matching V1__init.sql)
            RoleEntity adminRole = roleRepository.findByCode(PredefinedRole.ADMIN_ROLE)
                    .orElseGet(() -> {
                        log.info("Creating admin role...");
                        return roleRepository.save(new RoleEntity(null, PredefinedRole.ADMIN_ROLE, "Quản trị viên"));
                    });

            roleRepository.findByCode(PredefinedRole.STAFF_ROLE)
                    .orElseGet(() -> {
                        log.info("Creating staff role...");
                        return roleRepository.save(new RoleEntity(null, PredefinedRole.STAFF_ROLE, "Nhân viên"));
                    });

            roleRepository.findByCode(PredefinedRole.TAILOR_ROLE)
                    .orElseGet(() -> {
                        log.info("Creating tailor role...");
                        return roleRepository.save(new RoleEntity(null, PredefinedRole.TAILOR_ROLE, "Thợ may"));
                    });

            roleRepository.findByCode(PredefinedRole.CUSTOMER_ROLE)
                    .orElseGet(() -> {
                        log.info("Creating customer role...");
                        return roleRepository.save(new RoleEntity(null, PredefinedRole.CUSTOMER_ROLE, "Khách hàng"));
                    });

            // Seed a default admin account
            userRepository.findByEmailAndIsDeletedFalse(ADMIN_EMAIL)
                    .or(() -> userRepository.findByUsernameAndIsDeletedFalse(ADMIN_USERNAME)).orElseGet(() -> {
                        log.warn("Seeding default admin user with email: {} / username: {}", ADMIN_EMAIL,
                                ADMIN_USERNAME);
                        UserEntity admin = new UserEntity();
                        admin.setUsername(ADMIN_USERNAME);
                        admin.setEmail(ADMIN_EMAIL);
                        admin.setPhone("0900000000"); // Số điện thoại mặc định cho admin
                        admin.setName("Default Admin");
                        admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                        admin.setRole(adminRole);
                        admin.setStatus(UserEntity.UserStatus.active);
                        admin.setIsDeleted(false);
                        return userRepository.save(admin);
                    });

            // Seed a default customer account
            if (userRepository.findByEmailAndIsDeletedFalse("customer@example.com").isEmpty()
                    && !userRepository.existsByPhone("0912345678")) {
                log.info("Seeding default customer user...");
                RoleEntity customerRole = roleRepository.findByCode(PredefinedRole.CUSTOMER_ROLE)
                        .orElseThrow(() -> new RuntimeException("Customer role not found"));

                UserEntity customer = new UserEntity();
                customer.setUsername("customer");
                customer.setEmail("customer@example.com");
                customer.setPhone("0912345678");
                customer.setName("Nguyen Van A");
                customer.setPassword(passwordEncoder.encode("123456"));
                customer.setRole(customerRole);
                customer.setStatus(UserEntity.UserStatus.active);
                customer.setIsDeleted(false);
                userRepository.save(customer);
            }

            log.info("Application initialization completed.");
        };
    }
}

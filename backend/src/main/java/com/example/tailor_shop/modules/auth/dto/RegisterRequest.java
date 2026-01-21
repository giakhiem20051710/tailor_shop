package com.example.tailor_shop.modules.auth.dto;

import com.example.tailor_shop.common.PredefinedRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "^(0[35789][0-9]{8})$", message = "Số điện thoại phải là số điện thoại Việt Nam hợp lệ (10 chữ số, bắt đầu bằng 0 và tiếp theo là 3, 5, 7, 8 hoặc 9)")
    private String phone;

    @NotBlank
    @Size(min = 6, max = 100)
    private String password;

    @NotBlank
    @Size(min = 2, max = 150)
    private String name;

    @Pattern(regexp = "^(customer|staff|tailor)$", message = "Role must be one of: customer, staff, tailor")
    private String role;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role != null ? role : PredefinedRole.CUSTOMER_ROLE;
    }

    public void setRole(String role) {
        this.role = role;
    }
}


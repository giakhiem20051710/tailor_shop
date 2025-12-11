package com.myhien.tailor.modules.auth.service;

import com.myhien.tailor.modules.auth.dto.LoginRequest;
import com.myhien.tailor.modules.auth.dto.LoginResponse;
import com.myhien.tailor.modules.auth.dto.RegisterRequest;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    LoginResponse register(RegisterRequest request);
}


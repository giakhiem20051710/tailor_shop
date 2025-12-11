# 📚 Hướng dẫn Test API Authentication - Tailor Shop

## 🚀 Cài đặt

### 1. Import Collection vào Postman
1. Mở Postman
2. Click **Import** → Chọn file `Postman_Collection_TailorShop_Auth.json`
3. Collection sẽ xuất hiện trong sidebar

### 2. Đảm bảo Server đang chạy
```bash
cd tailor_shop/tailor_shop
mvn spring-boot:run
```
Server chạy tại: `http://localhost:8083`

---

## 📝 Test Cases Chi Tiết

### ✅ Test Case 1: Register - Đăng ký Customer

**Mục đích:** Tạo tài khoản customer mới

**Request:**
```
POST http://localhost:8083/api/v1/auth/register
Content-Type: application/json
```

**Body:**
```json
{
    "username": "customer01",
    "email": "customer01@example.com",
    "phone": "0912345678",
    "password": "Password@123",
    "name": "Nguyễn Văn A",
    "role": "customer"
}
```

**Lưu ý:** Field `role` là **optional**. Nếu không có, mặc định sẽ là `customer`.

**Expected Response (200 OK):**
```json
{
    "success": true,
    "traceId": "abc123...",
    "data": null,
    "message": null,
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Validation Rules:**
- ✅ `username`: 3-100 ký tự
- ✅ `email`: Format email hợp lệ
- ✅ `phone`: **Bắt buộc**, phải là số điện thoại Việt Nam hợp lệ (10 chữ số, bắt đầu bằng 0, tiếp theo là 3, 5, 7, 8 hoặc 9)
  - Format: `0[35789]xxxxxxxx` (ví dụ: `0912345678`, `0987654321`, `0901234567`)
  - **Phải là duy nhất** (không được trùng với số điện thoại đã đăng ký)
- ✅ `password`: Tối thiểu 6 ký tự
- ✅ `name`: 2-150 ký tự
- ✅ `role`: Optional, phải là một trong: `customer`, `staff`, `tailor` (không cho phép `admin`)

**Kết quả:** User được tạo với role đã chỉ định (hoặc `customer` nếu không có)

---

### ✅ Test Case 2: Register - Đăng ký Staff

**Mục đích:** Tạo tài khoản staff

**Request Body:**
```json
{
    "username": "staff01",
    "email": "staff01@myhien.com",
    "phone": "0987654321",
    "password": "Staff@123",
    "name": "Trần Thị B",
    "role": "staff"
}
```

**Expected Response:** Tương tự Test Case 1

**Lưu ý:** 
- Có thể chỉ định role khi đăng ký: `customer`, `staff`, hoặc `tailor`
- Role `admin` **không được phép** đăng ký công khai (chỉ có thể tạo bởi admin hoặc DataInitializer)

---

### ✅ Test Case 2b: Register - Đăng ký Tailor

**Mục đích:** Tạo tài khoản tailor

**Request Body:**
```json
{
    "username": "tailor01",
    "email": "tailor01@myhien.com",
    "phone": "0976543210",
    "password": "Tailor@123",
    "name": "Lê Văn C",
    "role": "tailor"
}
```

**Expected Response:** Tương tự Test Case 1

**Kết quả:** User được tạo với role `tailor`

---

### ❌ Test Case 2c: Register - Validation Error (Role admin không được phép)

**Mục đích:** Test validation - Role admin không được phép đăng ký công khai

**Request Body:**
```json
{
    "username": "testadmin",
    "email": "testadmin@example.com",
    "phone": "0912345678",
    "password": "Password@123",
    "name": "Test Admin",
    "role": "admin"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "traceId": "abc123...",
    "data": null,
    "message": "Invalid role. Allowed roles: customer, staff, tailor",
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Kết quả:** 
- ❌ Register thất bại
- ❌ Status code: 400
- ❌ Message: "Invalid role. Allowed roles: customer, staff, tailor"

**Lưu ý:** Role `admin` chỉ có thể được tạo bởi admin hoặc qua DataInitializer, không thể đăng ký công khai.

---

### ✅ Test Case 3: Login - Admin (Email)

**Mục đích:** Đăng nhập Admin bằng email

**Request:**
```
POST http://localhost:8083/api/v1/auth/login
Content-Type: application/json
```

**Body:**
```json
{
    "phoneOrEmail": "admin@myhien.com",
    "password": "Admin@123"
}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "traceId": "abc123...",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
        "tokenType": "Bearer",
        "expiresInMs": 86400000
    },
    "message": null,
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Lưu ý:** 
- Token sẽ tự động được lưu vào biến `{{jwtToken}}` (nếu có script test)
- Copy `accessToken` để dùng cho các API cần authentication

**Default Admin Account:**
- Email: `admin@myhien.com`
- Phone: `0900000000`
- Password: `Admin@123`

---

### ✅ Test Case 4: Login - Admin (Phone)

**Mục đích:** Đăng nhập Admin bằng số điện thoại

**Request Body:**
```json
{
    "phoneOrEmail": "0900000000",
    "password": "Admin@123"
}
```

**Expected Response:** Tương tự Test Case 3

**Kết quả:** Hệ thống hỗ trợ đăng nhập bằng số điện thoại hoặc email

---

### ✅ Test Case 5: Login - Customer (Phone)

**Mục đích:** Đăng nhập với tài khoản customer bằng số điện thoại

**Request Body:**
```json
{
    "phoneOrEmail": "0912345678",
    "password": "Password@123"
}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "traceId": "abc123...",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
        "tokenType": "Bearer",
        "expiresInMs": 86400000
    }
}
```

**Kết quả:** 
- ✅ Login thành công bằng số điện thoại
- ✅ Nhận được JWT token

---

### ✅ Test Case 5b: Login - Customer (Email)

**Mục đích:** Đăng nhập với tài khoản customer bằng email

**Request Body:**
```json
{
    "phoneOrEmail": "customer01@example.com",
    "password": "Password@123"
}
```

**Expected Response:** Tương tự Test Case 5

**Kết quả:** 
- ✅ Login thành công bằng email
- ✅ Nhận được JWT token

**Lưu ý:** Có thể đăng nhập bằng số điện thoại (`0912345678`) hoặc email (`customer01@example.com`)

---

### ❌ Test Case 6: Login - Sai mật khẩu

**Mục đích:** Test case login với mật khẩu sai

**Request Body:**
```json
{
    "phoneOrEmail": "admin@myhien.com",
    "password": "WrongPassword123"
}
```

**Expected Response (401 Unauthorized):**
```json
{
    "success": false,
    "traceId": "abc123...",
    "data": null,
    "message": "Invalid credentials",
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Kết quả:** 
- ❌ Login thất bại
- ❌ Status code: 401
- ❌ Message: "Invalid credentials"

**Lưu ý:** Sau nhiều lần login sai, tài khoản có thể bị khóa tạm thời (rate limiting)

---

### ❌ Test Case 7: Register - Validation Error (Email sai)

**Mục đích:** Test validation - Email không hợp lệ

**Request Body:**
```json
{
    "username": "testuser",
    "email": "invalid-email",
    "phone": "0912345678",
    "password": "Pass123",
    "name": "Test User"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "traceId": "abc123...",
    "data": null,
    "message": "Validation failed: email must be a well-formed email address",
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Kết quả:** 
- ❌ Validation failed
- ❌ Status code: 400
- ❌ Message chỉ ra lỗi validation

---

### ❌ Test Case 8: Register - Validation Error (Số điện thoại không hợp lệ)

**Mục đích:** Test validation - Số điện thoại phải là số Việt Nam hợp lệ

**Request Body:**
```json
{
    "username": "testuser",
    "email": "test@example.com",
    "phone": "123456789",
    "password": "Password@123",
    "name": "Test User"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "traceId": "abc123...",
    "data": null,
    "message": "Validation failed: Số điện thoại phải là số điện thoại Việt Nam hợp lệ (10 chữ số, bắt đầu bằng 0 và tiếp theo là 3, 5, 7, 8 hoặc 9)",
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Kết quả:** 
- ❌ Validation failed
- ❌ Status code: 400
- ❌ Message chỉ ra lỗi validation

**Các trường hợp số điện thoại không hợp lệ:**
- `123456789` - Không bắt đầu bằng 0
- `012345678` - Chỉ có 9 chữ số
- `0112345678` - Bắt đầu bằng 01 (không hợp lệ)
- `0212345678` - Bắt đầu bằng 02 (không hợp lệ)
- `+84912345678` - Có dấu + (không hợp lệ)

**Các trường hợp số điện thoại hợp lệ:**
- ✅ `0912345678` - Viettel
- ✅ `0987654321` - Viettel
- ✅ `0901234567` - MobiFone
- ✅ `0376543210` - Viettel
- ✅ `0587654321` - Vietnamobile

---

### ❌ Test Case 8b: Register - Validation Error (Số điện thoại đã tồn tại)

**Mục đích:** Test validation - Số điện thoại phải là duy nhất

**Request Body:**
```json
{
    "username": "customer02",
    "email": "customer02@example.com",
    "phone": "0912345678",
    "password": "Password@123",
    "name": "Nguyễn Văn B"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "traceId": "abc123...",
    "data": null,
    "message": "Phone number already exists",
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Kết quả:** 
- ❌ Register thất bại
- ❌ Status code: 400
- ❌ Message: "Phone number already exists"

**Lưu ý:** Số điện thoại `0912345678` đã được sử dụng bởi customer01 trong Test Case 1.

---

### ❌ Test Case 8c: Register - Validation Error (Username quá ngắn)

**Mục đích:** Test validation - Username phải từ 3-100 ký tự

**Request Body:**
```json
{
    "username": "ab",
    "email": "test@example.com",
    "phone": "0912345678",
    "password": "Password@123",
    "name": "Test User"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "traceId": "abc123...",
    "data": null,
    "message": "Validation failed: username size must be between 3 and 100",
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Kết quả:** Validation error vì username chỉ có 2 ký tự

---

### ✅ Test Case 9: Forgot Password

**Mục đích:** Yêu cầu reset password

**Request:**
```
POST http://localhost:8083/api/v1/auth/forgot-password
Content-Type: application/json
```

**Body:**
```json
{
    "email": "customer01@example.com"
}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "traceId": "abc123...",
    "data": null,
    "message": null,
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Lưu ý quan trọng:**
1. Reset token sẽ được **log ra console của server**
2. Mở console/log của Spring Boot để xem token
3. Token có format như: `Reset token for customer01@example.com: abc123xyz...`
4. Copy token đó để dùng cho Test Case 10

**Ví dụ log trong console:**
```
INFO  - Reset password token generated for customer01@example.com: abc123def456ghi789
```

---

### ✅ Test Case 10: Reset Password

**Mục đích:** Đặt lại mật khẩu mới bằng token

**Request:**
```
POST http://localhost:8083/api/v1/auth/reset-password
Content-Type: application/json
```

**Body:**
```json
{
    "token": "PASTE_TOKEN_FROM_CONSOLE_HERE",
    "newPassword": "NewPassword@123"
}
```

**Ví dụ với token thực:**
```json
{
    "token": "abc123def456ghi789",
    "newPassword": "NewPassword@123"
}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "traceId": "abc123...",
    "data": null,
    "message": null,
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Sau khi reset thành công:**
1. Token sẽ bị vô hiệu hóa (không dùng được nữa)
2. Có thể login với password mới: `NewPassword@123`
3. Password cũ không còn dùng được

**Test lại login:**
```json
{
    "usernameOrEmail": "customer01",
    "password": "NewPassword@123"
}
```

---

### ❌ Test Case 11: Reset Password - Token hết hạn

**Mục đích:** Test case với token không hợp lệ hoặc hết hạn

**Request Body:**
```json
{
    "token": "expired_or_invalid_token",
    "newPassword": "NewPassword@123"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "traceId": "abc123...",
    "data": null,
    "message": "Invalid or expired token",
    "timestamp": "2025-12-10T12:00:00Z"
}
```

**Kết quả:** 
- ❌ Reset thất bại
- ❌ Status code: 400
- ❌ Message: "Invalid or expired token"

**Lưu ý:** Token có thời hạn (mặc định 1 giờ). Sau khi hết hạn, token không còn dùng được.

---

## 🔄 Test Flow Hoàn chỉnh

### Flow 1: Register → Login
1. ✅ **Register** → Tạo tài khoản customer mới
2. ✅ **Login** → Đăng nhập và nhận JWT token
3. ✅ **Sử dụng token** → Gọi các API cần authentication

### Flow 2: Forgot Password → Reset Password → Login
1. ✅ **Forgot Password** → Yêu cầu reset password
2. 📋 **Copy token từ console** → Lấy token từ log server
3. ✅ **Reset Password** → Đặt lại mật khẩu mới
4. ✅ **Login lại** → Đăng nhập với password mới

### Flow 3: Validation Tests
1. ❌ **Register với email sai** → Test validation
2. ❌ **Register với username quá ngắn** → Test validation
3. ❌ **Login với password sai** → Test authentication error

---

## 🔍 Kiểm tra Database

Sau khi test, kiểm tra database:

```sql
-- Xem tất cả users
SELECT id, username, email, name, role_id, status, created_at 
FROM users 
WHERE is_deleted = false;

-- Xem tất cả roles
SELECT * FROM roles;

-- Xem password reset tokens
SELECT * FROM password_reset_tokens 
ORDER BY created_at DESC;

-- Xem login attempts (nếu có)
SELECT * FROM login_attempts 
ORDER BY attempt_time DESC;
```

---

## ⚠️ Lỗi thường gặp

### 1. Lỗi 404 Not Found
- **Nguyên nhân:** Server chưa chạy hoặc URL sai
- **Giải pháp:** 
  - Kiểm tra server đang chạy tại `http://localhost:8083`
  - Kiểm tra endpoint path: `/api/v1/auth/...`

### 2. Lỗi 400 Bad Request
- **Nguyên nhân:** Dữ liệu request không hợp lệ (validation failed)
- **Giải pháp:** 
  - Kiểm tra lại format của các field theo validation rules
  - Xem message trong response để biết field nào sai

### 3. Lỗi 401 Unauthorized
- **Nguyên nhân:** 
  - Token hết hạn hoặc không hợp lệ
  - Mật khẩu sai
- **Giải pháp:** 
  - Login lại để lấy token mới
  - Kiểm tra lại mật khẩu

### 4. Lỗi 500 Internal Server Error
- **Nguyên nhân:** Lỗi server (database connection, etc.)
- **Giải pháp:** 
  - Kiểm tra logs của server để xem chi tiết lỗi
  - Kiểm tra database connection
  - Kiểm tra Flyway migration đã chạy chưa

### 5. Không thấy reset token trong console
- **Nguyên nhân:** Log level không hiển thị INFO
- **Giải pháp:** 
  - Kiểm tra `application.yml` có `logging.level.root=INFO`
  - Hoặc kiểm tra database table `password_reset_tokens`

---

## 📌 Tips & Tricks

### 1. Tự động lưu JWT Token
Collection đã có script tự động lưu token vào biến `{{jwtToken}}` sau khi login thành công.

### 2. Sử dụng Environment Variables
Tạo Environment trong Postman với:
- `baseUrl`: `http://localhost:8083`
- `jwtToken`: (sẽ tự động được set sau khi login)

### 3. Test với nhiều users
Tạo nhiều requests với username/email khác nhau để test parallel.

### 4. Kiểm tra Rate Limiting
Thử login sai nhiều lần để test rate limiting/lockout feature.

---

## ✅ Checklist Test

- [ ] Register thành công với dữ liệu hợp lệ
- [ ] Register thất bại với dữ liệu không hợp lệ (validation)
- [ ] Login thành công với username
- [ ] Login thành công với email
- [ ] Login thất bại với password sai
- [ ] Forgot Password thành công
- [ ] Reset Password thành công với token hợp lệ
- [ ] Reset Password thất bại với token không hợp lệ
- [ ] Login lại sau khi reset password thành công
- [ ] JWT token được lưu tự động sau khi login

---

**Chúc bạn test thành công! 🎉**


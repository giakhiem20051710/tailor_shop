-- Flyway Migration: V3__update_phone_unique_not_null.sql
-- Cập nhật phone thành NOT NULL và UNIQUE

-- Xóa các bản ghi có phone NULL hoặc trùng lặp trước khi thêm constraint
-- (Nếu có dữ liệu test, cần xử lý thủ công)

-- Thêm UNIQUE constraint cho phone
ALTER TABLE users 
ADD CONSTRAINT uk_users_phone UNIQUE (phone);

-- Cập nhật phone thành NOT NULL
ALTER TABLE users 
MODIFY COLUMN phone VARCHAR(30) NOT NULL;

-- Thêm index cho phone để tăng tốc độ tìm kiếm
CREATE INDEX idx_users_phone ON users(phone);


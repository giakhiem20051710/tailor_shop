-- Flyway Migration: V2__cleanup_old_roles.sql
-- Xóa các role cũ không cần thiết, chỉ giữ lại: admin, staff, tailor, customer

-- Xóa các role cũ nếu không có user nào đang sử dụng
DELETE FROM roles 
WHERE code NOT IN ('admin', 'staff', 'tailor', 'customer')
  AND id NOT IN (
    SELECT DISTINCT role_id 
    FROM users 
    WHERE role_id IS NOT NULL
  );

-- Nếu vẫn còn role cũ có user đang dùng, cập nhật user sang role mới tương ứng
-- (Trường hợp này cần xử lý thủ công hoặc migrate user trước)

-- Đảm bảo 4 role chính tồn tại (nếu chưa có)
INSERT IGNORE INTO roles (code, name) VALUES
    ('admin', 'Quản trị viên'),
    ('staff', 'Nhân viên'),
    ('tailor', 'Thợ may'),
    ('customer', 'Khách hàng');


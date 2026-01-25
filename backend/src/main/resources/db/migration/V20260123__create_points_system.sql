-- Flyway Migration: V20260123__create_points_system.sql
-- Create Points/Xu system tables for gamification module

-- ==================== USER POINTS WALLET ====================
CREATE TABLE IF NOT EXISTS user_points_wallet (
    user_id BIGINT PRIMARY KEY,
    balance INT NOT NULL DEFAULT 0,           -- Số xu hiện có
    total_earned INT NOT NULL DEFAULT 0,      -- Tổng xu đã kiếm
    total_spent INT NOT NULL DEFAULT 0,       -- Tổng xu đã tiêu
    total_expired INT NOT NULL DEFAULT 0,     -- Tổng xu đã hết hạn
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== POINTS TRANSACTION HISTORY ====================
CREATE TABLE IF NOT EXISTS points_transaction (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    -- Transaction details
    amount INT NOT NULL,                      -- + cộng, - trừ
    balance_after INT NOT NULL,               -- Số dư sau giao dịch
    
    -- Type: EARN, SPEND, EXPIRED, ADMIN_ADJUST
    transaction_type VARCHAR(30) NOT NULL,
    
    -- Source: ORDER, CHECKIN, REVIEW, REFERRAL, CHALLENGE, BIRTHDAY, ADMIN
    source VARCHAR(50) NOT NULL,
    source_id BIGINT,                         -- ID của nguồn (order_id, challenge_id, etc.)
    
    description VARCHAR(255),
    
    -- Expiry tracking (for EARN transactions)
    expires_at TIMESTAMP NULL,
    is_expired BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_points_user (user_id),
    INDEX idx_points_type (transaction_type),
    INDEX idx_points_source (source),
    INDEX idx_points_expires (expires_at, is_expired),
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== DAILY CHECK-IN ====================
CREATE TABLE IF NOT EXISTS daily_checkin (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    checkin_date DATE NOT NULL,
    streak_day INT NOT NULL DEFAULT 1,        -- Ngày thứ mấy trong streak (1-7)
    points_earned INT NOT NULL,               -- Xu nhận được
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY uk_user_checkin_date (user_id, checkin_date),
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== USER CHECK-IN STREAK ====================
CREATE TABLE IF NOT EXISTS user_checkin_streak (
    user_id BIGINT PRIMARY KEY,
    
    current_streak INT NOT NULL DEFAULT 0,    -- Streak hiện tại
    longest_streak INT NOT NULL DEFAULT 0,    -- Streak dài nhất
    last_checkin_date DATE,                   -- Ngày điểm danh gần nhất
    total_checkins INT NOT NULL DEFAULT 0,    -- Tổng số lần điểm danh
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== POINTS CONFIG (Admin configurable) ====================
CREATE TABLE IF NOT EXISTS points_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== SEED: Default Points Config ====================
INSERT INTO points_config (config_key, config_value, description) VALUES
-- Tỷ lệ kiếm xu
('EARN_ORDER_SPEND', '50000', 'Số tiền chi tiêu để nhận 1 xu'),
('EARN_CHECKIN_DAY_1', '10', 'Xu check-in ngày 1'),
('EARN_CHECKIN_DAY_2', '15', 'Xu check-in ngày 2'),
('EARN_CHECKIN_DAY_3', '20', 'Xu check-in ngày 3'),
('EARN_CHECKIN_DAY_4', '25', 'Xu check-in ngày 4'),
('EARN_CHECKIN_DAY_5', '30', 'Xu check-in ngày 5'),
('EARN_CHECKIN_DAY_6', '40', 'Xu check-in ngày 6'),
('EARN_CHECKIN_DAY_7', '100', 'Xu check-in ngày 7 (streak bonus)'),
('EARN_REVIEW', '20', 'Xu viết review'),
('EARN_REFERRAL', '100', 'Xu giới thiệu bạn bè (khi bạn mua hàng)'),
('EARN_BIRTHDAY', '200', 'Xu sinh nhật'),

-- Tỷ lệ tiêu xu  
('SPEND_VALUE_PER_POINT', '500', 'Giá trị VNĐ của 1 xu'),
('SPEND_MIN_POINTS', '50', 'Số xu tối thiểu để sử dụng'),
('SPEND_MAX_PERCENT_ORDER', '20', 'Phần trăm tối đa đơn hàng có thể giảm bằng xu'),
('SPEND_MIN_ORDER_VALUE', '500000', 'Giá trị đơn hàng tối thiểu để dùng xu'),

-- Hạn sử dụng
('EXPIRY_MONTHS', '12', 'Số tháng xu hết hạn'),
('EXPIRY_REMINDER_DAYS', '30', 'Số ngày nhắc trước khi hết hạn');

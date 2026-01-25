-- Flyway Migration: V20260122__create_gamification_tables.sql
-- Create Seasonal Challenges tables for gamification module

-- ==================== SEASONAL CHALLENGES ====================
CREATE TABLE IF NOT EXISTS seasonal_challenges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Season info
    season VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    
    -- Challenge condition
    challenge_type VARCHAR(30) NOT NULL,
    condition_key VARCHAR(100),
    target_value BIGINT NOT NULL,
    
    -- Rewards
    reward_points INT,
    reward_badge_id BIGINT,
    reward_voucher_code VARCHAR(50),
    reward_voucher_value DECIMAL(15,2),
    reward_type VARCHAR(30),
    reward_description VARCHAR(255),
    
    -- Grand Prize
    is_grand_prize BOOLEAN NOT NULL DEFAULT FALSE,
    parent_challenge_id BIGINT,
    
    -- Display
    display_order INT NOT NULL DEFAULT 0,
    icon_url VARCHAR(500),
    banner_image TEXT,
    theme_color VARCHAR(20),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadata
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_challenge_season (season),
    INDEX idx_challenge_active (is_active),
    INDEX idx_challenge_time (start_date, end_date),
    INDEX idx_challenge_code (code),
    
    -- Foreign keys
    FOREIGN KEY (parent_challenge_id) REFERENCES seasonal_challenges(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==================== USER CHALLENGE PROGRESS ====================
CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    challenge_id BIGINT NOT NULL,
    
    -- Progress
    current_progress BIGINT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    
    -- Reward
    reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    claimed_at TIMESTAMP NULL,
    claimed_reward_value VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_progress_user (user_id),
    INDEX idx_progress_challenge (challenge_id),
    INDEX idx_progress_completed (is_completed),
    
    -- Constraints
    UNIQUE KEY uk_user_challenge (user_id, challenge_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES seasonal_challenges(id) ON DELETE CASCADE
);

-- ==================== SEED DATA: TẾT 2026 CHALLENGES ====================
INSERT INTO seasonal_challenges (code, name, description, season, year, start_date, end_date, 
    challenge_type, condition_key, target_value, reward_points, reward_type, reward_description,
    display_order, theme_color, is_active) VALUES

-- Challenge 1: Đơn hàng đầu xuân
('TET_2026_FIRST_ORDER', 'Đơn Hàng Đầu Xuân', 'Đặt 1 đơn hàng trong dịp Tết', 
 'TET', 2026, '2026-01-20 00:00:00', '2026-02-10 23:59:59',
 'ORDER_COUNT', NULL, 1, 200, 'POINTS', '200 xu',
 1, '#C41E3A', TRUE),

-- Challenge 2: Sưu tầm áo dài
('TET_2026_AO_DAI', 'Sưu Tầm Áo Dài', 'Mua 1 sản phẩm Áo Dài', 
 'TET', 2026, '2026-01-20 00:00:00', '2026-02-10 23:59:59',
 'PRODUCT_CATEGORY', 'category:ao-dai', 1, NULL, 'BADGE', 'Badge "Người Yêu Áo Dài"',
 2, '#C41E3A', TRUE),

-- Challenge 3: Lì xì cho bản thân  
('TET_2026_SPEND_2M', 'Lì Xì Cho Bản Thân', 'Chi tiêu 2.000.000đ trong dịp Tết',
 'TET', 2026, '2026-01-20 00:00:00', '2026-02-10 23:59:59',
 'ORDER_VALUE', NULL, 2000000, 500, 'VOUCHER', 'Voucher 15%',
 3, '#C41E3A', TRUE),

-- Challenge 4: Review chúc xuân
('TET_2026_REVIEW', 'Review Chúc Xuân', 'Viết 2 đánh giá sản phẩm',
 'TET', 2026, '2026-01-20 00:00:00', '2026-02-10 23:59:59',
 'REVIEW_COUNT', NULL, 2, 150, 'POINTS', '150 xu',
 4, '#C41E3A', TRUE);

-- Grand Prize: Hoàn thành tất cả
INSERT INTO seasonal_challenges (code, name, description, season, year, start_date, end_date, 
    challenge_type, target_value, reward_points, reward_type, reward_description,
    is_grand_prize, display_order, theme_color, icon_url, is_active) VALUES
('TET_2026_GRAND_PRIZE', 'Tết Master 2026', 'Hoàn thành tất cả thử thách Tết',
 'TET', 2026, '2026-01-20 00:00:00', '2026-02-10 23:59:59',
 'COMBO', 4, 1000, 'BADGE', 'Badge Legendary "Tết Master 2026" + 1000 xu',
 TRUE, 10, '#FFD700', '🏆', TRUE);

-- Link sub-challenges to grand prize
UPDATE seasonal_challenges 
SET parent_challenge_id = (SELECT id FROM (SELECT id FROM seasonal_challenges WHERE code = 'TET_2026_GRAND_PRIZE') AS t)
WHERE code IN ('TET_2026_FIRST_ORDER', 'TET_2026_AO_DAI', 'TET_2026_SPEND_2M', 'TET_2026_REVIEW');

-- ==================== THÊM CHALLENGES TẾT HẤP DẪN ====================
INSERT INTO seasonal_challenges (code, name, description, season, year, start_date, end_date, 
    challenge_type, condition_key, target_value, reward_points, reward_type, reward_description,
    display_order, theme_color, is_active) VALUES

-- Thêm thử thách giới thiệu bạn bè
('TET_2026_REFERRAL', 'Xuân Rộn Ràng', 'Giới thiệu 1 bạn bè đặt may', 
 'TET', 2026, '2026-01-20 00:00:00', '2026-02-10 23:59:59',
 'REFERRAL_COUNT', NULL, 1, 300, 'VOUCHER', 'Voucher 10% cho cả 2',
 5, '#C41E3A', TRUE),

-- Thêm thử thách combo gia đình
('TET_2026_FAMILY', 'Gia Đình Sum Họp', 'Đặt 3 đơn hàng cho gia đình', 
 'TET', 2026, '2026-01-20 00:00:00', '2026-02-10 23:59:59',
 'ORDER_COUNT', NULL, 3, 800, 'VOUCHER', 'Miễn phí may 1 áo dài trẻ em',
 6, '#C41E3A', TRUE),

-- Thêm thử thách VIP
('TET_2026_VIP', 'Quý Khách VIP', 'Chi tiêu 5.000.000đ', 
 'TET', 2026, '2026-01-20 00:00:00', '2026-02-10 23:59:59',
 'ORDER_VALUE', NULL, 5000000, 1500, 'VOUCHER', 'Voucher 20% + 1500 xu + Free Ship Forever',
 7, '#FFD700', TRUE);

-- ==================== SEED DATA: VALENTINE 2026 ====================
INSERT INTO seasonal_challenges (code, name, description, season, year, start_date, end_date, 
    challenge_type, condition_key, target_value, reward_points, reward_type, reward_description,
    display_order, theme_color, is_active) VALUES

('VAL_2026_COUPLE_ORDER', 'Đôi Ta Đẹp Đôi', 'Đặt 2 đơn hàng couple', 
 'VALENTINE', 2026, '2026-02-10 00:00:00', '2026-02-20 23:59:59',
 'ORDER_COUNT', 'category:couple', 2, 400, 'VOUCHER', 'Giảm 25% cho cặp đôi',
 1, '#EC4899', TRUE),

('VAL_2026_LOVE_NOTE', 'Thư Tình Yêu', 'Viết review chia sẻ câu chuyện tình', 
 'VALENTINE', 2026, '2026-02-10 00:00:00', '2026-02-20 23:59:59',
 'REVIEW_COUNT', NULL, 1, 200, 'BADGE', 'Badge \"Người Yêu Chân Chính\"',
 2, '#EC4899', TRUE),

('VAL_2026_GIFT', 'Quà Tặng Người Thương', 'Chi 1.500.000đ cho quà tặng', 
 'VALENTINE', 2026, '2026-02-10 00:00:00', '2026-02-20 23:59:59',
 'ORDER_VALUE', NULL, 1500000, 350, 'VOUCHER', 'Miễn phí thêu tên + 350 xu',
 3, '#EC4899', TRUE);

-- ==================== SEED DATA: MÙA HÈ 2026 ====================
INSERT INTO seasonal_challenges (code, name, description, season, year, start_date, end_date, 
    challenge_type, condition_key, target_value, reward_points, reward_type, reward_description,
    display_order, theme_color, is_active) VALUES

('SUMMER_2026_LINEN', 'Mát Như Gió', 'Mua 2 SP vải linen/cotton', 
 'SUMMER', 2026, '2026-06-01 00:00:00', '2026-08-31 23:59:59',
 'PRODUCT_CATEGORY', 'fabric:linen,cotton', 2, 300, 'VOUCHER', 'Giảm 30% vải mát',
 1, '#F59E0B', TRUE),

('SUMMER_2026_VACATION', 'Du Lịch Phong Cách', 'Đặt 1 đơn đồ du lịch', 
 'SUMMER', 2026, '2026-06-01 00:00:00', '2026-08-31 23:59:59',
 'ORDER_COUNT', 'category:casual', 1, 250, 'POINTS', '250 xu + Free Ship',
 2, '#F59E0B', TRUE),

('SUMMER_2026_COOL', 'Summer Cool', 'Chi 2.000.000đ mua đồ hè', 
 'SUMMER', 2026, '2026-06-01 00:00:00', '2026-08-31 23:59:59',
 'ORDER_VALUE', NULL, 2000000, 500, 'BADGE', 'Badge \"Summer Fashionista\" + 500 xu',
 3, '#F59E0B', TRUE);

-- ==================== SEED DATA: TRUNG THU 2026 ====================
INSERT INTO seasonal_challenges (code, name, description, season, year, start_date, end_date, 
    challenge_type, condition_key, target_value, reward_points, reward_type, reward_description,
    display_order, theme_color, is_active) VALUES

('MID_2026_KIDS', 'Bé Yêu Đón Trăng', 'Đặt 1 áo dài cho bé', 
 'MID_AUTUMN', 2026, '2026-09-01 00:00:00', '2026-09-30 23:59:59',
 'PRODUCT_CATEGORY', 'category:ao-dai-kids', 1, 200, 'VOUCHER', 'Tặng lồng đèn + 200 xu',
 1, '#EA580C', TRUE),

('MID_2026_FAMILY', 'Gia Đình Đoàn Viên', 'Đặt 2 đơn cho gia đình', 
 'MID_AUTUMN', 2026, '2026-09-01 00:00:00', '2026-09-30 23:59:59',
 'ORDER_COUNT', NULL, 2, 400, 'VOUCHER', 'Giảm 20% + Bánh Trung Thu',
 2, '#EA580C', TRUE);

-- ==================== SEED DATA: GIÁNG SINH 2026 ====================
INSERT INTO seasonal_challenges (code, name, description, season, year, start_date, end_date, 
    challenge_type, condition_key, target_value, reward_points, reward_type, reward_description,
    display_order, theme_color, is_active) VALUES

('XMAS_2026_PARTY', 'Dạ Tiệc Noel', 'Đặt 1 vest/đầm dự tiệc', 
 'CHRISTMAS', 2026, '2026-12-15 00:00:00', '2026-12-31 23:59:59',
 'PRODUCT_CATEGORY', 'category:vest,dam-du-tiec', 1, 300, 'VOUCHER', 'Giảm 25% + Thêu tên miễn phí',
 1, '#16A34A', TRUE),

('XMAS_2026_GIFT', 'Quà Giáng Sinh', 'Chi 3.000.000đ cho quà tặng', 
 'CHRISTMAS', 2026, '2026-12-15 00:00:00', '2026-12-31 23:59:59',
 'ORDER_VALUE', NULL, 3000000, 600, 'VOUCHER', 'Free Ship cả năm 2027 + 600 xu',
 2, '#16A34A', TRUE),

('XMAS_2026_SHARE', 'Chia Sẻ Yêu Thương', 'Giới thiệu 2 bạn bè', 
 'CHRISTMAS', 2026, '2026-12-15 00:00:00', '2026-12-31 23:59:59',
 'REFERRAL_COUNT', NULL, 2, 500, 'BADGE', 'Badge \"Santa của năm\" + 500 xu',
 3, '#16A34A', TRUE);


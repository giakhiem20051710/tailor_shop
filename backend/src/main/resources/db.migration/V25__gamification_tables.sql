-- =====================================================
-- V25: Gamification Module Tables
-- Points/Xu system, Seasonal Challenges, Check-in
-- =====================================================

-- ==================== SEASONAL CHALLENGES ====================

CREATE TABLE IF NOT EXISTS seasonal_challenges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identification
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Season Info
    season VARCHAR(20) NOT NULL COMMENT 'TET, VALENTINE, WOMEN_DAY, SUMMER, MID_AUTUMN, HALLOWEEN, CHRISTMAS, NEW_YEAR, BACK_TO_SCHOOL',
    year INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    
    -- Challenge Condition
    challenge_type VARCHAR(30) NOT NULL COMMENT 'ORDER_COUNT, ORDER_VALUE, PRODUCT_CATEGORY, FABRIC_PURCHASE, REVIEW_COUNT, REFERRAL_COUNT, CHECKIN_STREAK, COMBO',
    condition_key VARCHAR(100) COMMENT 'Additional condition like category:ao-dai',
    target_value BIGINT NOT NULL COMMENT 'Target value to achieve',
    
    -- Rewards
    reward_points INT,
    reward_badge_id BIGINT,
    reward_voucher_code VARCHAR(50),
    reward_voucher_value DECIMAL(14,2),
    reward_type VARCHAR(30) COMMENT 'POINTS, VOUCHER, BADGE, COMBO',
    reward_description VARCHAR(255),
    
    -- Combo/Grand Prize
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_challenge_season (season),
    INDEX idx_challenge_active (is_active),
    INDEX idx_challenge_time (start_date, end_date),
    INDEX idx_challenge_code (code),
    
    CONSTRAINT fk_challenge_parent FOREIGN KEY (parent_challenge_id) REFERENCES seasonal_challenges(id) ON DELETE SET NULL,
    CONSTRAINT fk_challenge_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Seasonal challenges for gamification';


-- ==================== USER CHALLENGE PROGRESS ====================

CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relationships
    user_id BIGINT NOT NULL,
    challenge_id BIGINT NOT NULL,
    
    -- Progress
    current_progress BIGINT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at DATETIME,
    
    -- Reward
    reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    claimed_at DATETIME,
    claimed_reward_value VARCHAR(255),
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_progress_user (user_id),
    INDEX idx_progress_challenge (challenge_id),
    INDEX idx_progress_completed (is_completed),
    
    CONSTRAINT uk_user_challenge UNIQUE (user_id, challenge_id),
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_challenge FOREIGN KEY (challenge_id) REFERENCES seasonal_challenges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User progress for each challenge';


-- ==================== USER POINTS WALLET ====================

CREATE TABLE IF NOT EXISTS user_points_wallet (
    user_id BIGINT PRIMARY KEY,
    
    balance INT NOT NULL DEFAULT 0 COMMENT 'Current points balance',
    total_earned INT NOT NULL DEFAULT 0 COMMENT 'Total points ever earned',
    total_spent INT NOT NULL DEFAULT 0 COMMENT 'Total points spent',
    total_expired INT NOT NULL DEFAULT 0 COMMENT 'Total points expired',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User points/xu wallet';


-- ==================== POINTS TRANSACTIONS ====================

CREATE TABLE IF NOT EXISTS points_transaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    user_id BIGINT NOT NULL,
    amount INT NOT NULL COMMENT 'Positive for earn, negative for spend',
    balance_after INT NOT NULL,
    
    transaction_type VARCHAR(30) NOT NULL COMMENT 'EARN, SPEND, EXPIRED, ADMIN_ADJUST',
    source VARCHAR(50) NOT NULL COMMENT 'ORDER_COMPLETE, CHECKIN, CHALLENGE, REVIEW, REFERRAL, BIRTHDAY, REDEMPTION, ADMIN',
    source_id BIGINT COMMENT 'Reference ID (order_id, challenge_id, etc)',
    description VARCHAR(255),
    
    expires_at DATETIME COMMENT 'When points expire',
    is_expired BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_transaction_user (user_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_source (source),
    INDEX idx_transaction_expires (expires_at, is_expired),
    
    CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Points transaction history';


-- ==================== DAILY CHECK-IN ====================

CREATE TABLE IF NOT EXISTS daily_checkin (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    user_id BIGINT NOT NULL,
    checkin_date DATE NOT NULL,
    streak_day INT NOT NULL DEFAULT 1 COMMENT 'Day 1-7 in current streak',
    points_earned INT NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_checkin_user (user_id),
    INDEX idx_checkin_date (checkin_date),
    
    CONSTRAINT uk_daily_checkin UNIQUE (user_id, checkin_date),
    CONSTRAINT fk_checkin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Daily check-in records';


-- ==================== USER CHECK-IN STREAK ====================

CREATE TABLE IF NOT EXISTS user_checkin_streak (
    user_id BIGINT PRIMARY KEY,
    
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    last_checkin_date DATE,
    total_checkins INT NOT NULL DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_streak_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User check-in streak tracking';

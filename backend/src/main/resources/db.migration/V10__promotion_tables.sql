-- Flyway Migration: V10__promotion_tables.sql
-- Tạo bảng promotions và promotion_usages cho module Promotion

CREATE TABLE promotions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type ENUM('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'INACTIVE',
    
    -- Discount configuration
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(14,2),
    max_discount_amount DECIMAL(14,2),
    
    -- Conditions
    min_order_value DECIMAL(14,2),
    applicable_product_ids JSON,
    applicable_category_ids JSON,
    applicable_user_group VARCHAR(50),
    
    -- Validity
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Usage limits
    max_usage_total INT,
    max_usage_per_user INT,
    is_public BOOLEAN DEFAULT TRUE,
    is_single_use BOOLEAN DEFAULT FALSE,
    
    -- Buy X Get Y (for type = BUY_X_GET_Y)
    buy_quantity INT,
    get_quantity INT,
    get_product_id BIGINT,
    
    -- Metadata
    image VARCHAR(500),
    banner_text VARCHAR(200),
    priority INT DEFAULT 0,
    
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_promotion_code (code),
    INDEX idx_promotion_status (status),
    INDEX idx_promotion_dates (start_date, end_date),
    INDEX idx_promotion_type (type),
    INDEX idx_promotion_public (is_public, status)
);

CREATE TABLE promotion_usages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    promotion_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT,
    invoice_id BIGINT,
    
    discount_amount DECIMAL(14,2) NOT NULL,
    original_amount DECIMAL(14,2) NOT NULL,
    final_amount DECIMAL(14,2) NOT NULL,
    
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_promotion_usage_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    CONSTRAINT fk_promotion_usage_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_promotion_usage_promotion (promotion_id),
    INDEX idx_promotion_usage_user (user_id),
    INDEX idx_promotion_usage_order (order_id),
    INDEX idx_promotion_usage_invoice (invoice_id)
);


-- =============================================
-- Flash Sale Module - Database Migration
-- Version: V21
-- Description: Tables for Flash Sale functionality
-- =============================================

-- =============================================
-- 1. FLASH SALES TABLE
-- Main table for flash sale campaigns
-- =============================================
CREATE TABLE flash_sales (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Fabric reference
    fabric_id BIGINT NOT NULL,
    fabric_name VARCHAR(255) NOT NULL,  -- Cached for faster queries
    fabric_image VARCHAR(500),           -- Cached for display
    
    -- Sale info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing
    original_price DECIMAL(14,2) NOT NULL,
    flash_price DECIMAL(14,2) NOT NULL,
    discount_percent INT GENERATED ALWAYS AS (
        ROUND((original_price - flash_price) / original_price * 100)
    ) STORED,
    
    -- Quantity management
    total_quantity DECIMAL(10,2) NOT NULL,
    sold_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Limits
    max_per_user DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    min_purchase DECIMAL(10,2) NOT NULL DEFAULT 0.50,
    
    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    
    -- Status: SCHEDULED, ACTIVE, ENDED, CANCELLED, SOLD_OUT
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    
    -- Display
    priority INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    banner_image VARCHAR(500),
    
    -- Metadata
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_flash_sale_fabric 
        FOREIGN KEY (fabric_id) REFERENCES fabrics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_flash_sale_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_flash_price 
        CHECK (flash_price > 0 AND flash_price < original_price),
    CONSTRAINT chk_quantity 
        CHECK (total_quantity > 0 AND sold_quantity >= 0 AND reserved_quantity >= 0),
    CONSTRAINT chk_time 
        CHECK (end_time > start_time),
    
    -- Indexes
    INDEX idx_flash_sale_status (status),
    INDEX idx_flash_sale_time (start_time, end_time),
    INDEX idx_flash_sale_status_time (status, start_time, end_time),
    INDEX idx_flash_sale_fabric (fabric_id),
    INDEX idx_flash_sale_featured (is_featured, priority DESC)
);

-- =============================================
-- 2. FLASH SALE ORDERS TABLE
-- Orders placed during flash sales
-- =============================================
CREATE TABLE flash_sale_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- References
    flash_sale_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reservation_id BIGINT,
    
    -- Order details
    order_code VARCHAR(50) NOT NULL UNIQUE,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL,
    discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    
    -- Status: PENDING, PAID, CANCELLED, EXPIRED, REFUNDED
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    -- Payment info
    payment_method VARCHAR(50),
    payment_deadline TIMESTAMP,
    paid_at TIMESTAMP,
    
    -- Shipping info (optional, can be set later)
    shipping_address TEXT,
    shipping_phone VARCHAR(20),
    shipping_name VARCHAR(100),
    
    -- Notes
    customer_note TEXT,
    admin_note TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_flash_order_sale 
        FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE RESTRICT,
    CONSTRAINT fk_flash_order_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_quantity 
        CHECK (quantity > 0),
    CONSTRAINT chk_order_amount 
        CHECK (total_amount >= 0),
    
    -- Indexes
    INDEX idx_flash_order_user (user_id),
    INDEX idx_flash_order_sale (flash_sale_id),
    INDEX idx_flash_order_status (status),
    INDEX idx_flash_order_user_sale (user_id, flash_sale_id),
    INDEX idx_flash_order_code (order_code)
);

-- =============================================
-- 3. FLASH SALE RESERVATIONS TABLE
-- Temporary stock reservations (expires after 10 minutes)
-- =============================================
CREATE TABLE flash_sale_reservations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- References
    flash_sale_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    
    -- Reservation details
    quantity DECIMAL(10,2) NOT NULL,
    
    -- Status: ACTIVE, CONVERTED, EXPIRED, CANCELLED
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    
    -- Timing
    expires_at TIMESTAMP NOT NULL,
    converted_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_reservation_sale 
        FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_reservation_quantity 
        CHECK (quantity > 0),
    
    -- Indexes
    INDEX idx_reservation_status_expires (status, expires_at),
    INDEX idx_reservation_user_sale (user_id, flash_sale_id),
    INDEX idx_reservation_sale (flash_sale_id)
);

-- =============================================
-- 4. FLASH SALE USER STATS TABLE
-- Track user purchase history for limits
-- =============================================
CREATE TABLE flash_sale_user_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    flash_sale_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    
    -- Stats
    total_purchased DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_orders INT NOT NULL DEFAULT 0,
    last_purchase_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_user_stats_sale 
        FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_stats_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY uk_user_sale (user_id, flash_sale_id),
    
    -- Indexes
    INDEX idx_user_stats_sale (flash_sale_id)
);

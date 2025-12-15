-- Fabric Management Module Tables
-- Giống Shopee: quản lý vải, inventory, và hold/visit requests

CREATE TABLE IF NOT EXISTS fabrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Fabric code/SKU',
    name VARCHAR(255) NOT NULL COMMENT 'Fabric name',
    slug VARCHAR(255) COMMENT 'SEO-friendly URL',
    description TEXT COMMENT 'Fabric description',
    category VARCHAR(100) COMMENT 'Category: COTTON, SILK, WOOL, POLYESTER, etc.',
    material VARCHAR(100) COMMENT 'Material composition',
    color VARCHAR(100) COMMENT 'Primary color',
    pattern VARCHAR(100) COMMENT 'Pattern: SOLID, STRIPED, CHECKED, FLORAL, etc.',
    width DECIMAL(5,2) COMMENT 'Fabric width in cm',
    weight DECIMAL(5,2) COMMENT 'Fabric weight in g/m²',
    price_per_meter DECIMAL(14,2) COMMENT 'Price per meter',
    image VARCHAR(500) COMMENT 'Main image URL',
    gallery JSON COMMENT 'Additional images (JSON array)',
    origin VARCHAR(100) COMMENT 'Country of origin',
    care_instructions TEXT COMMENT 'Care instructions',
    is_available BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Available for purchase',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Featured fabric',
    display_order INT DEFAULT 0 COMMENT 'Display order',
    view_count INT NOT NULL DEFAULT 0 COMMENT 'Number of views',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT COMMENT 'User who created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fabrics_code (code),
    INDEX idx_fabrics_category (category),
    INDEX idx_fabrics_color (color),
    INDEX idx_fabrics_pattern (pattern),
    INDEX idx_fabrics_available (is_available),
    INDEX idx_fabrics_featured (is_featured),
    INDEX idx_fabrics_created (created_at),
    CONSTRAINT fk_fabrics_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Fabric Inventory - Track stock levels
CREATE TABLE IF NOT EXISTS fabric_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fabric_id BIGINT NOT NULL,
    location VARCHAR(100) COMMENT 'Storage location',
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Available quantity in meters',
    reserved_quantity DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Reserved quantity',
    min_stock_level DECIMAL(10,2) DEFAULT 0 COMMENT 'Minimum stock level alert',
    max_stock_level DECIMAL(10,2) COMMENT 'Maximum stock level',
    unit VARCHAR(20) DEFAULT 'METER' COMMENT 'Unit: METER, YARD, etc.',
    last_restocked_at TIMESTAMP NULL COMMENT 'Last restock date',
    notes TEXT COMMENT 'Inventory notes',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fabric_inventory_fabric FOREIGN KEY (fabric_id) REFERENCES fabrics(id) ON DELETE CASCADE,
    INDEX idx_fabric_inventory_fabric (fabric_id),
    INDEX idx_fabric_inventory_location (location)
);

-- Fabric Hold/Visit Requests - Customer requests to hold or visit fabric
CREATE TABLE IF NOT EXISTS fabric_hold_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fabric_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL COMMENT 'Customer who requested',
    type VARCHAR(20) NOT NULL COMMENT 'HOLD or VISIT',
    quantity DECIMAL(10,2) COMMENT 'Quantity to hold (for HOLD type)',
    requested_date DATE COMMENT 'Requested visit date (for VISIT type)',
    requested_time TIME COMMENT 'Requested visit time (for VISIT type)',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED',
    expiry_date DATE COMMENT 'Hold expiry date (for HOLD type)',
    notes TEXT COMMENT 'Customer notes',
    staff_notes TEXT COMMENT 'Staff notes',
    handled_by BIGINT COMMENT 'Staff who handled',
    handled_at TIMESTAMP NULL COMMENT 'When handled',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fabric_hold_requests_fabric FOREIGN KEY (fabric_id) REFERENCES fabrics(id),
    CONSTRAINT fk_fabric_hold_requests_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_fabric_hold_requests_handled_by FOREIGN KEY (handled_by) REFERENCES users(id),
    INDEX idx_fabric_hold_requests_fabric (fabric_id),
    INDEX idx_fabric_hold_requests_user (user_id),
    INDEX idx_fabric_hold_requests_status (status),
    INDEX idx_fabric_hold_requests_type (type),
    INDEX idx_fabric_hold_requests_date (requested_date),
    CONSTRAINT chk_fabric_hold_requests_type CHECK (type IN ('HOLD', 'VISIT')),
    CONSTRAINT chk_fabric_hold_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'))
);


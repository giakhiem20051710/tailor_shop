-- Cart Module - Tách riêng để tái sử dụng cho nhiều loại sản phẩm
-- Hỗ trợ: Product, Fabric, Service, etc.

-- Drop old cart_items table nếu đã tồn tại (từ V13)
DROP TABLE IF EXISTS cart_items;

-- Tạo lại cart_items table với thiết kế generic
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'Customer',
    item_type VARCHAR(50) NOT NULL COMMENT 'PRODUCT, FABRIC, SERVICE, etc.',
    item_id BIGINT NOT NULL COMMENT 'ID của sản phẩm (product_id, fabric_id, service_id, etc.)',
    quantity DECIMAL(10,2) NOT NULL COMMENT 'Quantity',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_cart_user_item (user_id, item_type, item_id),
    INDEX idx_cart_items_user (user_id),
    INDEX idx_cart_items_type_id (item_type, item_id)
);


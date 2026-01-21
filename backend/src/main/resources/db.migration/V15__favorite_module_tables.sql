-- Favorite Module - Tách riêng để tái sử dụng cho nhiều loại sản phẩm
-- Hỗ trợ: Product, Fabric, Service, etc.

-- Drop old favorites table nếu đã tồn tại (từ V8)
DROP TABLE IF EXISTS favorites;

-- Tạo lại favorites table với thiết kế generic
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'Customer',
    item_type VARCHAR(50) NOT NULL COMMENT 'PRODUCT, FABRIC, SERVICE, etc.',
    item_id BIGINT NOT NULL COMMENT 'ID của sản phẩm (product_id, fabric_id, service_id, etc.)',
    item_key VARCHAR(100) COMMENT 'Key của sản phẩm (product_key, fabric_code, etc.) - để backward compatibility',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_favorite_user_item (user_id, item_type, item_id),
    INDEX idx_favorites_user (user_id),
    INDEX idx_favorites_type_id (item_type, item_id),
    INDEX idx_favorites_key (item_key)
);


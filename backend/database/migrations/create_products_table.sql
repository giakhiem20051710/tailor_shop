-- Migration script để tạo bảng products
-- Chạy script này trong database tailor_shop

CREATE TABLE IF NOT EXISTS products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique key cho product (ví dụ: ao-dai-do-500k)',
  name VARCHAR(200) NOT NULL COMMENT 'Tên sản phẩm',
  slug VARCHAR(200) NULL COMMENT 'URL-friendly slug',
  description TEXT NULL COMMENT 'Mô tả chi tiết sản phẩm',
  tag VARCHAR(100) NULL COMMENT 'Tag phân loại (ví dụ: Bộ sưu tập, Mới)',
  price DECIMAL(14, 2) NULL COMMENT 'Giá sản phẩm',
  price_range VARCHAR(100) NULL COMMENT 'Khoảng giá (ví dụ: 1.000.000 - 5.000.000)',
  image VARCHAR(500) NULL COMMENT 'URL ảnh chính',
  gallery JSON NULL COMMENT 'Mảng JSON chứa các URL ảnh gallery',
  occasion VARCHAR(80) NULL COMMENT 'Dịp sử dụng (ví dụ: Công sở, Tiệc cưới)',
  category VARCHAR(80) NULL COMMENT 'Danh mục (ví dụ: ao-dai, vest, dam)',
  budget VARCHAR(50) NULL COMMENT 'Mức giá (ví dụ: Luxury, Economy)',
  `type` VARCHAR(50) NULL COMMENT 'Loại sản phẩm (ví dụ: collection, newArrival)',
  rating DECIMAL(3, 2) NULL COMMENT 'Đánh giá (0.00 - 5.00)',
  sold INT NOT NULL DEFAULT 0 COMMENT 'Số lượng đã bán',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',

  INDEX idx_products_key (`key`),
  INDEX idx_products_category (category),
  INDEX idx_products_type (`type`),
  INDEX idx_products_is_deleted (is_deleted),
  INDEX idx_products_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng lưu thông tin sản phẩm';


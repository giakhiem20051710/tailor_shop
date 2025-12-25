-- Tạo bảng image_assets để quản lý metadata của ảnh trên S3
CREATE TABLE IF NOT EXISTS image_assets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  s3_key VARCHAR(255) NOT NULL,              -- "templates/ao-dai-do-1.jpg"
  url VARCHAR(500) NULL,                     -- full S3 URL (optional)
  category VARCHAR(50) NOT NULL,             -- "template", "fabric", "style"
  type VARCHAR(50) NOT NULL,                 -- "ao_dai", "quan_tay", "vest", ...
  gender VARCHAR(10) DEFAULT 'unisex',       -- "male", "female", "unisex"
  tags JSON NULL,                            -- ["traditional", "red", "tet"]
  product_template_id BIGINT NULL,           -- FK tới product_templates.id
  fabric_id BIGINT NULL,                     -- FK tới fabrics.id (nếu là ảnh vải)
  style_id BIGINT NULL,                      -- FK tới styles.id (nếu là ảnh style)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_image_assets_template
    FOREIGN KEY (product_template_id)
    REFERENCES product_templates (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_image_assets_fabric
    FOREIGN KEY (fabric_id)
    REFERENCES fabrics (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_image_assets_style
    FOREIGN KEY (style_id)
    REFERENCES styles (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  INDEX idx_image_assets_category (category),
  INDEX idx_image_assets_type (type),
  INDEX idx_image_assets_gender (gender),
  INDEX idx_image_assets_template_id (product_template_id),
  INDEX idx_image_assets_fabric_id (fabric_id),
  INDEX idx_image_assets_style_id (style_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


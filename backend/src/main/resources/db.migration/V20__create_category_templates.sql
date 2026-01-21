-- V20__create_category_templates.sql
-- Create category_templates table and seed initial data

CREATE TABLE IF NOT EXISTS category_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Clean code like "vest", "ao_dai"',
    category_name VARCHAR(200) NOT NULL COMMENT 'Display name like "Vest Nam"',
    
    tailoring_time VARCHAR(100) NULL,
    fitting_count VARCHAR(50) NULL,
    warranty VARCHAR(200) NULL,
    silhouette VARCHAR(200) NULL,
    materials JSON NULL,
    colors JSON NULL,
    length_info VARCHAR(200) NULL,
    lining VARCHAR(200) NULL,
    accessories VARCHAR(500) NULL,
    occasions JSON NULL,
    customer_styles JSON NULL,
    care_instructions JSON NULL,
    
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Data: Vest Nam
INSERT INTO category_templates (category_code, category_name, tailoring_time, fitting_count, warranty, silhouette, materials, colors, occasions, care_instructions)
VALUES (
    'vest', 
    'Vest Nam', 
    '7-14 ngày', 
    '2 lần (Fit & Finish)', 
    'Trọn đời đường may, chỉnh sửa miễn phí 1 năm', 
    'Classic Fit / Slim Fit tùy chọn',
    '["Wool blend (70% wool, 30% poly)", "100% Cotton Ý", "Linen cao cấp"]',
    '["Đen", "Xanh Navy", "Xám than", "Kẻ sọc"]',
    '["Công sở", "Đám cưới", "Sự kiện quan trọng"]',
    '["Giặt hấp (Dry clean only)", "Treo móc gỗ vai to"]'
);

-- Seed Data: Áo Dài
INSERT INTO category_templates (category_code, category_name, tailoring_time, fitting_count, warranty, silhouette, materials, colors, occasions, care_instructions)
VALUES (
    'ao_dai', 
    'Áo Dài', 
    '5-10 ngày', 
    '1-2 lần', 
    'Chỉnh sửa eo/ngực miễn phí', 
    'Chiết eo cao, tà rộng bay bổng',
    '["Lụa Tơ Tằm Hà Đông", "Gấm Thượng Hải", "Voan Nhật"]',
    '["Trắng nữ sinh", "Đỏ đô", "Hồng pastel", "Vàng mỡ gà"]',
    '["Dự tiệc", "Lễ tết", "Đám hỏi", "Chụp ảnh"]',
    '["Giặt tay nhẹ nhàng", "Ủi hơi nước mặt trái", "Không vắt xoắn"]'
);

-- Seed Data: Váy (Default)
INSERT INTO category_templates (category_code, category_name, tailoring_time, fitting_count, warranty, silhouette, materials, colors, occasions, care_instructions)
VALUES (
    'vay', 
    'Váy & Đầm', 
    '5-7 ngày', 
    '1 lần', 
    'Chỉnh sửa form 3 tháng', 
    'A-line, Mermaid hoặc Suông',
    '["Taffeta", "Organza", "Silk", "Velvet"]',
    '["Đen", "Trắng", "Be", "Đỏ"]',
    '["Dạo phố", "Tiệc cocktail", "Công sở"]',
    '["Giặt máy túi lưới", "Phơi trong bóng râm"]'
);

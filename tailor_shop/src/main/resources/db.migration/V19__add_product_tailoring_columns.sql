-- V19__add_product_tailoring_columns.sql
-- Add tailoring specification columns to products table

ALTER TABLE products
    ADD COLUMN tailoring_time VARCHAR(100) NULL COMMENT 'Thời gian may (e.g., "7-14 ngày")',
    ADD COLUMN fitting_count VARCHAR(50) NULL COMMENT 'Số lần thử đồ (e.g., "1-2 lần")',
    ADD COLUMN warranty VARCHAR(200) NULL COMMENT 'Bảo hành (e.g., "Chỉnh sửa miễn phí 1 lần")',
    ADD COLUMN silhouette VARCHAR(200) NULL COMMENT 'Form dáng (e.g., "Body fit, tôn eo")',
    ADD COLUMN materials JSON NULL COMMENT 'Chất liệu gợi ý (JSON array)',
    ADD COLUMN colors JSON NULL COMMENT 'Màu sắc có sẵn (JSON array)',
    ADD COLUMN length_info VARCHAR(200) NULL COMMENT 'Độ dài (e.g., "Qua gối / maxi tùy chọn")',
    ADD COLUMN lining VARCHAR(200) NULL COMMENT 'Lót trong (e.g., "Có, chống hằn & thoáng")',
    ADD COLUMN accessories VARCHAR(500) NULL COMMENT 'Phụ kiện (e.g., "Belt, hoa cài, khăn choàng")',
    ADD COLUMN occasions JSON NULL COMMENT 'Dịp sử dụng (JSON array)',
    ADD COLUMN customer_styles JSON NULL COMMENT 'Phong cách khách hàng (JSON array)',
    ADD COLUMN care_instructions JSON NULL COMMENT 'Hướng dẫn bảo quản (JSON array)';

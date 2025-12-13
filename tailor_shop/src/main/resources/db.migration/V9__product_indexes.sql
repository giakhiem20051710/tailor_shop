-- Flyway Migration: V9__product_indexes.sql
-- Thêm indexes cho bảng products để tối ưu performance cho filter và search

-- Indexes cho filter columns
CREATE INDEX IF NOT EXISTS idx_product_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_product_occasion ON products(occasion);
CREATE INDEX IF NOT EXISTS idx_product_tag ON products(tag);
CREATE INDEX IF NOT EXISTS idx_product_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_product_sold ON products(sold);

-- Composite index cho list query với filter
CREATE INDEX IF NOT EXISTS idx_product_category_occasion_deleted 
    ON products(category, occasion, is_deleted);

-- Index cho full-text search (MySQL 5.7+)
-- Note: FULLTEXT index chỉ hoạt động với MyISAM hoặc InnoDB với innodb_ft_min_token_size
-- Nếu không support, có thể bỏ qua và dùng LIKE query
-- CREATE FULLTEXT INDEX idx_product_search ON products(name, description);

-- Index cho styles
CREATE INDEX IF NOT EXISTS idx_style_category ON styles(category);


-- Fabric Enhancement Features Migration
-- Add reviews support, tags, technical details (stretch, season), and sold count

-- 1. Add new columns to fabrics table
ALTER TABLE fabrics
    ADD COLUMN stretch VARCHAR(20) COMMENT 'Stretch level: NONE, LOW, MEDIUM, HIGH' AFTER pattern,
    ADD COLUMN season VARCHAR(20) COMMENT 'Suitable season: SPRING, SUMMER, AUTUMN, WINTER, ALL_SEASON' AFTER stretch,
    ADD COLUMN sold_count INT NOT NULL DEFAULT 0 COMMENT 'Total meters sold' AFTER view_count,
    ADD COLUMN rating_avg DECIMAL(2,1) DEFAULT 0.0 COMMENT 'Average rating (1.0-5.0)' AFTER sold_count,
    ADD COLUMN rating_count INT NOT NULL DEFAULT 0 COMMENT 'Number of ratings' AFTER rating_avg,
    ADD COLUMN tags JSON COMMENT 'Tags/keywords for search' AFTER gallery;

-- 2. Add fabric_id column to reviews table for fabric reviews
ALTER TABLE reviews
    ADD COLUMN fabric_id BIGINT COMMENT 'For fabric reviews' AFTER image_asset_id;

-- 3. Add foreign key constraint for fabric reviews
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_fabric FOREIGN KEY (fabric_id) REFERENCES fabrics(id);

-- 4. Update review type constraint to include FABRIC
ALTER TABLE reviews
    DROP CONSTRAINT chk_reviews_type;
    
ALTER TABLE reviews
    ADD CONSTRAINT chk_reviews_type CHECK (type IN ('PRODUCT', 'ORDER', 'IMAGE_ASSET', 'FABRIC'));

-- 5. Add indexes for new columns
ALTER TABLE fabrics
    ADD INDEX idx_fabrics_stretch (stretch),
    ADD INDEX idx_fabrics_season (season),
    ADD INDEX idx_fabrics_sold_count (sold_count),
    ADD INDEX idx_fabrics_rating_avg (rating_avg);

ALTER TABLE reviews
    ADD INDEX idx_reviews_fabric (fabric_id);

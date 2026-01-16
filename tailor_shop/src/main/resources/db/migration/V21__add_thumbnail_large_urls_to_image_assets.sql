-- Add thumbnail_url and large_url columns to image_assets table
ALTER TABLE image_assets
ADD COLUMN thumbnail_url VARCHAR(500) NULL COMMENT 'URL của thumbnail (300x300px)',
ADD COLUMN large_url VARCHAR(500) NULL COMMENT 'URL của large version (1200px width)';

-- Add indexes for better query performance
CREATE INDEX idx_image_assets_thumbnail_url ON image_assets(thumbnail_url);
CREATE INDEX idx_image_assets_large_url ON image_assets(large_url);


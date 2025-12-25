-- Migration: Create bulk upload jobs tables
-- Created: 2024

CREATE TABLE bulk_upload_jobs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id VARCHAR(36) UNIQUE NOT NULL, -- UUID
  status VARCHAR(20) NOT NULL, -- PENDING, READY, PROCESSING, COMPLETED, FAILED, CANCELLED
  total_files INT NOT NULL,
  processed_files INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  expires_at DATETIME NULL, -- Cleanup orphaned jobs after 24h
  
  INDEX idx_job_id (job_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bulk_upload_job_files (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL,
  s3_url VARCHAR(500) NOT NULL,
  s3_key VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  checksum VARCHAR(64) NULL, -- MD5 or SHA256
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
  product_id BIGINT NULL,
  image_asset_id BIGINT NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_job_id (job_id),
  INDEX idx_status (status),
  INDEX idx_checksum (checksum),
  INDEX idx_product_id (product_id),
  INDEX idx_image_asset_id (image_asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table để store checksums của images đã upload (cho de-duplication)
CREATE TABLE image_checksums (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  checksum VARCHAR(64) UNIQUE NOT NULL, -- MD5 or SHA256
  image_asset_id BIGINT NULL,
  product_id BIGINT NULL,
  s3_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_checksum (checksum),
  INDEX idx_image_asset_id (image_asset_id),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (image_asset_id) REFERENCES image_assets(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


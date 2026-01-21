-- Migration: Create bulk upload jobs tables
-- Version: V18
-- Description: Tạo các bảng để quản lý bulk upload jobs và image checksums

CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'UUID của job',
  status VARCHAR(20) NOT NULL COMMENT 'PENDING, READY, PROCESSING, COMPLETED, FAILED, CANCELLED',
  total_files INT NOT NULL COMMENT 'Tổng số files trong job',
  processed_files INT DEFAULT 0 COMMENT 'Số files đã xử lý',
  success_count INT DEFAULT 0 COMMENT 'Số files thành công',
  failed_count INT DEFAULT 0 COMMENT 'Số files thất bại',
  error_message TEXT NULL COMMENT 'Error message nếu job failed',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL COMMENT 'Thời gian hoàn thành',
  expires_at DATETIME NULL COMMENT 'Thời gian hết hạn (cleanup orphaned jobs sau 24h)',
  
  INDEX idx_job_id (job_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng track bulk upload jobs';

CREATE TABLE IF NOT EXISTS bulk_upload_job_files (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL COMMENT 'FK tới bulk_upload_jobs.job_id',
  s3_url VARCHAR(500) NOT NULL COMMENT 'URL của file trên S3',
  s3_key VARCHAR(255) NOT NULL COMMENT 'S3 key của file',
  file_name VARCHAR(255) NOT NULL COMMENT 'Tên file gốc',
  checksum VARCHAR(64) NULL COMMENT 'MD5 or SHA256 checksum',
  status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING, SUCCESS, FAILED, DUPLICATE',
  product_id BIGINT NULL COMMENT 'ID của Product đã tạo (nếu thành công)',
  image_asset_id BIGINT NULL COMMENT 'ID của ImageAsset đã tạo (nếu thành công)',
  error_message TEXT NULL COMMENT 'Error message nếu failed',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_job_id (job_id),
  INDEX idx_status (status),
  INDEX idx_checksum (checksum),
  INDEX idx_product_id (product_id),
  INDEX idx_image_asset_id (image_asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng track từng file trong bulk upload job';

-- Table để store checksums của images đã upload (cho de-duplication)
CREATE TABLE IF NOT EXISTS image_checksums (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  checksum VARCHAR(64) UNIQUE NOT NULL COMMENT 'MD5 or SHA256 checksum',
  image_asset_id BIGINT NULL COMMENT 'FK tới image_assets.id',
  product_id BIGINT NULL COMMENT 'FK tới products.id',
  s3_url VARCHAR(500) NULL COMMENT 'S3 URL của image',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_checksum (checksum),
  INDEX idx_image_asset_id (image_asset_id),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (image_asset_id) REFERENCES image_assets(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng lưu checksums để phát hiện duplicate images';


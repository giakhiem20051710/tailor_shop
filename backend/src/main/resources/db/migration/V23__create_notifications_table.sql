-- Flyway migration: Create notifications table for real-time notification system
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'ORDER, FLASH_SALE, PAYMENT, PROMOTION, REVIEW, SYSTEM',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    icon VARCHAR(10),
    link VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notif_user_created (user_id, created_at DESC),
    INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

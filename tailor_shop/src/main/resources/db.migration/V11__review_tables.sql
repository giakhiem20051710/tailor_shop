-- Review Module Tables
-- Supports both Product Review and Order Review (like Shopee)

CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(20) NOT NULL COMMENT 'PRODUCT or ORDER',
    product_id BIGINT COMMENT 'For product reviews',
    order_id BIGINT COMMENT 'For order reviews',
    user_id BIGINT NOT NULL COMMENT 'Reviewer (customer)',
    rating INT NOT NULL COMMENT '1-5 stars',
    title VARCHAR(255) COMMENT 'Review title',
    comment TEXT COMMENT 'Review text',
    helpful_count INT NOT NULL DEFAULT 0 COMMENT 'Number of helpful votes',
    reply_text TEXT COMMENT 'Shop reply to review',
    replied_by BIGINT COMMENT 'User who replied (staff/admin)',
    replied_at TIMESTAMP NULL COMMENT 'When shop replied',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED, HIDDEN',
    is_verified_purchase BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Only verified buyers can review',
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Hide reviewer name',
    moderation_note TEXT COMMENT 'Admin note for moderation',
    moderated_by BIGINT COMMENT 'Admin who moderated',
    moderated_at TIMESTAMP NULL COMMENT 'When moderated',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reviews_type (type),
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_order (order_id),
    INDEX idx_reviews_user (user_id),
    INDEX idx_reviews_status (status),
    INDEX idx_reviews_rating (rating),
    INDEX idx_reviews_created (created_at),
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_reviews_replied_by FOREIGN KEY (replied_by) REFERENCES users(id),
    CONSTRAINT fk_reviews_moderated_by FOREIGN KEY (moderated_by) REFERENCES users(id),
    CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT chk_reviews_type CHECK (type IN ('PRODUCT', 'ORDER'))
);

-- Review Images (multiple images per review, like Shopee)
CREATE TABLE IF NOT EXISTS review_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL COMMENT 'S3 URL or file path',
    image_order INT NOT NULL DEFAULT 0 COMMENT 'Display order',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_images_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    INDEX idx_review_images_review (review_id),
    INDEX idx_review_images_order (review_id, image_order)
);

-- Review Helpful Votes (track who voted helpful, like Shopee)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL COMMENT 'User who voted helpful',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_helpful_votes_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_helpful_votes_user FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_review_helpful_votes (review_id, user_id) COMMENT 'One vote per user per review',
    INDEX idx_review_helpful_votes_review (review_id),
    INDEX idx_review_helpful_votes_user (user_id)
);


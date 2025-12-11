-- Order module schema (orders, items, timeline, payments, attachments)

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL,
    customer_id BIGINT NOT NULL,
    tailor_id BIGINT,
    total DECIMAL(14,2) NOT NULL DEFAULT 0,
    deposit_amount DECIMAL(14,2) DEFAULT 0,
    note TEXT,
    appointment_date DATE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_order_tailor FOREIGN KEY (tailor_id) REFERENCES users(id),
    INDEX idx_order_customer (customer_id),
    INDEX idx_order_tailor (tailor_id),
    INDEX idx_order_status_updated (status, updated_at)
);

CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT,
    fabric_id BIGINT,
    quantity INT NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL,
    product_name VARCHAR(200),
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_item_order (order_id)
);

CREATE TABLE order_timelines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    note TEXT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_timeline_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_timeline_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_timeline_order_created (order_id, created_at)
);

CREATE TABLE order_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    method VARCHAR(50),
    status VARCHAR(50),
    txn_ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_payment_order (order_id)
);

CREATE TABLE order_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    url VARCHAR(500) NOT NULL,
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attachment_order FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_attachment_order (order_id)
);


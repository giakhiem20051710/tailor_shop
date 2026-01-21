-- Fabric Order and Cart Tables
-- Giống FPT Shop: Cart -> Checkout -> Order -> Invoice -> Payment

CREATE TABLE IF NOT EXISTS fabric_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Order code',
    customer_id BIGINT NOT NULL COMMENT 'Customer',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Subtotal before discount',
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Discount from promo',
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Tax amount',
    shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Shipping fee',
    total DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Final total',
    promotion_id BIGINT COMMENT 'Applied promotion',
    promotion_code VARCHAR(50) COMMENT 'Applied promo code',
    shipping_address TEXT COMMENT 'Shipping address',
    shipping_phone VARCHAR(20) COMMENT 'Shipping phone',
    shipping_name VARCHAR(255) COMMENT 'Shipping name',
    payment_method VARCHAR(50) COMMENT 'COD, BANK_TRANSFER, CREDIT_CARD, E_WALLET',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, PAID, FAILED, REFUNDED',
    invoice_id BIGINT COMMENT 'Linked invoice',
    notes TEXT COMMENT 'Order notes',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fabric_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_fabric_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    CONSTRAINT fk_fabric_orders_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    INDEX idx_fabric_orders_code (code),
    INDEX idx_fabric_orders_customer (customer_id),
    INDEX idx_fabric_orders_status (status),
    INDEX idx_fabric_orders_payment_status (payment_status),
    INDEX idx_fabric_orders_created (created_at)
);

CREATE TABLE IF NOT EXISTS fabric_order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    fabric_id BIGINT NOT NULL,
    fabric_name VARCHAR(255) NOT NULL COMMENT 'Snapshot of fabric name',
    fabric_code VARCHAR(50) NOT NULL COMMENT 'Snapshot of fabric code',
    quantity DECIMAL(10,2) NOT NULL COMMENT 'Quantity in meters',
    price_per_meter DECIMAL(14,2) NOT NULL COMMENT 'Price at time of order',
    subtotal DECIMAL(15,2) NOT NULL COMMENT 'quantity * price_per_meter',
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Item discount',
    total DECIMAL(15,2) NOT NULL COMMENT 'Final amount for this item',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fabric_order_items_order FOREIGN KEY (order_id) REFERENCES fabric_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_fabric_order_items_fabric FOREIGN KEY (fabric_id) REFERENCES fabrics(id),
    INDEX idx_fabric_order_items_order (order_id),
    INDEX idx_fabric_order_items_fabric (fabric_id)
);

-- Shopping Cart (in-memory hoặc có thể lưu DB)
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'Customer',
    fabric_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL COMMENT 'Quantity in meters',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_fabric FOREIGN KEY (fabric_id) REFERENCES fabrics(id),
    UNIQUE KEY uk_cart_user_fabric (user_id, fabric_id),
    INDEX idx_cart_items_user (user_id),
    INDEX idx_cart_items_fabric (fabric_id)
);


-- Flyway Migration: V1__init.sql
-- Tạo toàn bộ database schema cho Tailor Shop

CREATE TABLE roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL
);

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  phone VARCHAR(30),
  status ENUM('active','inactive') DEFAULT 'active',
  role_id BIGINT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_user_role (role_id)
);

CREATE TABLE fabrics (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  price_per_meter DECIMAL(14,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'đ/m',
  quantity INT DEFAULT 0,
  image VARCHAR(500),
  status ENUM('active','inactive') DEFAULT 'active',
  properties JSON,
  specs JSON,
  suggestions JSON,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fabric_status (status)
);

CREATE TABLE fabric_stock_movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fabric_id BIGINT NOT NULL,
  delta INT NOT NULL,
  reason VARCHAR(80),
  ref_type VARCHAR(50),
  ref_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fsm_fabric FOREIGN KEY (fabric_id) REFERENCES fabrics(id),
  INDEX idx_fsm_fabric (fabric_id),
  INDEX idx_fsm_ref (ref_type, ref_id)
);

CREATE TABLE fabric_holds (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fabric_id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  type ENUM('hold') NOT NULL DEFAULT 'hold',
  status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  expires_at DATETIME,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_hold_fabric FOREIGN KEY (fabric_id) REFERENCES fabrics(id),
  CONSTRAINT fk_hold_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  INDEX idx_hold_fabric_status (fabric_id, status),
  INDEX idx_hold_customer (customer_id)
);

CREATE TABLE fabric_visits (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fabric_id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  type ENUM('visit') NOT NULL DEFAULT 'visit',
  visit_date DATE,
  visit_time TIME,
  status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_visit_fabric FOREIGN KEY (fabric_id) REFERENCES fabrics(id),
  CONSTRAINT fk_visit_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  INDEX idx_visit_fabric_date (fabric_id, visit_date),
  INDEX idx_visit_customer (customer_id)
);

CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200),
  description TEXT,
  tag VARCHAR(100),
  price DECIMAL(14,2),
  price_range VARCHAR(100),
  image VARCHAR(500),
  gallery JSON,
  occasion VARCHAR(80),
  category VARCHAR(80),
  budget VARCHAR(50),
  type VARCHAR(50),
  rating DECIMAL(3,2),
  sold INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_slug (slug)
);

CREATE TABLE styles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80),
  image VARCHAR(500),
  description TEXT,
  price DECIMAL(14,2),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE favorites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  product_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fav_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_fav_product FOREIGN KEY (product_key) REFERENCES products(`key`),
  UNIQUE (customer_id, product_key),
  INDEX idx_fav_customer (customer_id)
);

CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL,
  assigned_tailor_id BIGINT,
  name VARCHAR(150),
  phone VARCHAR(30),
  email VARCHAR(180),
  address VARCHAR(255),
  product_name VARCHAR(200),
  product_type VARCHAR(100),
  description TEXT,
  budget DECIMAL(14,2),
  total DECIMAL(14,2),
  deposit DECIMAL(14,2),
  status ENUM('PENDING','MEASURING','FABRIC_SELECTION','CUTTING','SEWING','FITTING','DONE','CANCELLED') DEFAULT 'PENDING',
  receive_date DATE,
  due_date DATE,
  appointment_type ENUM('pickup','delivery','fitting'),
  appointment_date DATE,
  appointment_time TIME,
  promo_code VARCHAR(50),
  notes TEXT,
  correction_notes TEXT,
  sample_images JSON,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_order_tailor FOREIGN KEY (assigned_tailor_id) REFERENCES users(id),
  INDEX idx_order_customer (customer_id),
  INDEX idx_order_tailor (assigned_tailor_id),
  INDEX idx_order_status (status),
  INDEX idx_order_due (due_date)
);

CREATE TABLE measurements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  shoulder DECIMAL(5,2),
  sleeve DECIMAL(5,2),
  pants_length DECIMAL(5,2),
  shirt_length DECIMAL(5,2),
  neck DECIMAL(5,2),
  waistband DECIMAL(5,2),
  inseam DECIMAL(5,2),
  thigh DECIMAL(5,2),
  metrics JSON,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_measure_order FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_measure_order (order_id)
);

CREATE TABLE appointments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  tailor_id BIGINT,
  type ENUM('fitting','pickup','delivery') NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
  notes VARCHAR(255),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appt_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_appt_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_appt_tailor FOREIGN KEY (tailor_id) REFERENCES users(id),
  INDEX idx_appt_order_date (order_id, appointment_date),
  INDEX idx_appt_customer (customer_id),
  INDEX idx_appt_tailor (tailor_id)
);

CREATE TABLE reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  order_id BIGINT NULL,
  product_key VARCHAR(100) NULL,
  rating INT,
  comment TEXT,
  fabric_keys JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_review_product FOREIGN KEY (product_key) REFERENCES products(`key`),
  INDEX idx_review_product (product_key),
  INDEX idx_review_order (order_id)
);

CREATE TABLE invoices (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  order_id BIGINT NULL,
  customer_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  product VARCHAR(200),
  due_date DATE,
  total DECIMAL(14,2) NOT NULL,
  note VARCHAR(255),
  status ENUM('pending','processing','paid') DEFAULT 'pending',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_order FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_invoice_order (order_id),
  INDEX idx_invoice_status (status)
);

CREATE TABLE transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  invoice_id BIGINT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  method ENUM('BANK','MOMO','CASH','VNPAY','ZALOPAY','CARD') NOT NULL,
  reference VARCHAR(120),
  note VARCHAR(255),
  state ENUM('pending','success','failed') DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  INDEX idx_tx_invoice (invoice_id),
  INDEX idx_tx_state (state)
);

CREATE TABLE promotions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200),
  description TEXT,
  discount_value DECIMAL(14,2),
  discount_type ENUM('PERCENT','AMOUNT') DEFAULT 'AMOUNT',
  start_date DATE,
  end_date DATE,
  category VARCHAR(80),
  segment VARCHAR(80),
  min_bill DECIMAL(14,2),
  channel VARCHAR(80),
  badge VARCHAR(80),
  occasion_key VARCHAR(80),
  promo_type ENUM('seasonal','bundle','campaign','personal'),
  image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_promo_active (is_active, start_date, end_date)
);

CREATE TABLE order_promotions (
  order_id BIGINT NOT NULL,
  promotion_id BIGINT NOT NULL,
  PRIMARY KEY (order_id, promotion_id),
  CONSTRAINT fk_op_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_op_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id)
);

CREATE TABLE loyalty_profiles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL UNIQUE,
  points INT DEFAULT 0,
  total_spent DECIMAL(16,2) DEFAULT 0,
  tier ENUM('silver','gold','platinum') DEFAULT 'silver',
  history JSON,
  last_updated TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_loyalty_customer FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE referrals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  total_referrals INT DEFAULT 0,
  successful_referrals INT DEFAULT 0,
  reward_history JSON,
  last_updated TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ref_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  INDEX idx_ref_code (code)
);

CREATE TABLE working_slots (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tailor_id BIGINT,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  capacity INT DEFAULT 1,
  booked_count INT DEFAULT 0,
  status ENUM('available','blocked') DEFAULT 'available',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_slot_tailor FOREIGN KEY (tailor_id) REFERENCES users(id),
  INDEX idx_slot_date_tailor (slot_date, tailor_id),
  INDEX idx_slot_status (status)
);

CREATE TABLE audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_id BIGINT,
  payload JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_actor (actor_id)
);

-- Insert default roles
INSERT INTO roles (code, name) VALUES 
('admin', 'Quản trị viên'),
('staff', 'Nhân viên'),
('tailor', 'Thợ may'),
('customer', 'Khách hàng');


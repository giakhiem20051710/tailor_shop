-- Flyway Migration: V6__appointment_working_slots.sql
-- Thêm bảng working_slots và cập nhật appointments nếu cần

-- Bảng appointments đã có trong V1__init.sql, chỉ cần thêm working_slots

CREATE TABLE IF NOT EXISTS working_slots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tailor_id BIGINT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start_time TIME,
    break_end_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ws_tailor FOREIGN KEY (tailor_id) REFERENCES users(id),
    INDEX idx_ws_tailor_day (tailor_id, day_of_week),
    INDEX idx_ws_tailor_active (tailor_id, is_active)
);


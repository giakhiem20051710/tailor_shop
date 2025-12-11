# 📚 Flyway Migration - V1__init.sql Giải Thích

## 🎯 V1__init.sql Là Gì?

`V1__init.sql` là file **database migration** đầu tiên, dùng để tạo toàn bộ database schema cho project.

---

## 🔍 Flyway Là Gì?

**Flyway** = Tool quản lý database version control (giống Git cho database)

### Tại sao cần Flyway?

**❌ Không dùng Flyway:**
```sql
-- Dev tự tạo database bằng tay
CREATE TABLE users (...);
CREATE TABLE orders (...);
-- → Mỗi người có database khác nhau
-- → Production database không giống dev
-- → Khó deploy, dễ lỗi
```

**✅ Dùng Flyway:**
```sql
-- Tất cả migration trong code
V1__init.sql      → Tạo schema ban đầu
V2__add_index.sql → Thêm index
V3__add_column.sql → Thêm cột mới
-- → Database version được track
-- → Tự động chạy khi deploy
-- → Đồng bộ giữa dev/staging/production
```

---

## 📁 Cấu Trúc File

### Naming Convention
```
V{version}__{description}.sql

V1__init.sql
  ↑  ↑
  │  └─ Mô tả: init = khởi tạo
  └─ Version: 1 = migration đầu tiên
```

### Thư mục
```
src/main/resources/
└─ db/
   └─ migration/
      ├─ V1__init.sql          ← Tạo schema ban đầu
      ├─ V2__add_user_email.sql ← Thêm cột email
      └─ V3__add_index.sql      ← Thêm index
```

---

## 🚀 Cách Hoạt Động

### 1. Khi Start Application

```yaml
# application.yml
spring:
  flyway:
    enabled: true                    # Bật Flyway
    locations: classpath:db/migration # Tìm file trong thư mục này
    baseline-on-migrate: true        # Tự động baseline nếu DB mới
```

**Flow:**
```
1. Spring Boot start
2. Flyway kiểm tra database
3. Tìm file migration chưa chạy
4. Chạy V1__init.sql (nếu chưa chạy)
5. Ghi lại trong bảng flyway_schema_history
6. Tiếp tục với V2, V3... nếu có
```

### 2. Bảng flyway_schema_history

Flyway tự động tạo bảng này để track:

```sql
CREATE TABLE flyway_schema_history (
    installed_rank INT,
    version VARCHAR(50),      -- "1"
    description VARCHAR(200), -- "init"
    type VARCHAR(20),         -- "SQL"
    script VARCHAR(1000),    -- "V1__init.sql"
    checksum INT,
    installed_by VARCHAR(100),
    installed_on TIMESTAMP,
    execution_time INT,
    success BOOLEAN
);
```

**Ví dụ data:**
```
version | description | script        | success
--------|-------------|---------------|--------
1       | init        | V1__init.sql  | true
2       | add index   | V2__add_index | true
```

---

## 📝 V1__init.sql Làm Gì?

### Nội dung chính:

1. **Tạo tất cả bảng** (18 bảng)
   - `roles`, `users`
   - `orders`, `measurements`, `appointments`
   - `fabrics`, `fabric_holds`, `fabric_visits`
   - `products`, `styles`, `favorites`, `reviews`
   - `invoices`, `transactions`
   - `promotions`, `order_promotions`
   - `loyalty_profiles`, `referrals`
   - `working_slots`, `audit_log`

2. **Tạo Foreign Keys**
   ```sql
   CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id)
   ```

3. **Tạo Indexes**
   ```sql
   INDEX idx_order_customer (customer_id)
   INDEX idx_order_status (status)
   ```

4. **Insert Default Data**
   ```sql
   INSERT INTO roles (code, name) VALUES 
   ('admin', 'Quản trị viên'),
   ('staff', 'Nhân viên'),
   ('tailor', 'Thợ may'),
   ('customer', 'Khách hàng');
   ```

---

## 🔄 Workflow Thực Tế

### Scenario 1: Database Mới

```bash
# 1. Tạo database trống
CREATE DATABASE tailor;

# 2. Start application
mvn spring-boot:run

# 3. Flyway tự động:
#    - Tìm V1__init.sql
#    - Chạy tất cả CREATE TABLE
#    - Insert default data
#    - Ghi vào flyway_schema_history
```

### Scenario 2: Thêm Migration Mới

```sql
-- Tạo file mới: V2__add_user_avatar.sql
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
```

```bash
# Start application
# Flyway tự động:
#    - Kiểm tra flyway_schema_history
#    - Thấy V1 đã chạy, V2 chưa chạy
#    - Chạy V2__add_user_avatar.sql
#    - Ghi vào flyway_schema_history
```

### Scenario 3: Database Đã Có Data

```bash
# Database đã có schema (tạo bằng tay)
# Start application
# Flyway:
#    - Thấy database đã có bảng
#    - baseline-on-migrate: true
#    - Đánh dấu V1 đã chạy (không chạy lại)
#    - Chỉ chạy V2, V3... nếu có
```

---

## ✅ Lợi Ích

### 1. Version Control
```bash
# Database schema được track như code
git log db/migration/
# → Biết được ai thêm cột gì, khi nào
```

### 2. Đồng Bộ Môi Trường
```bash
# Dev, Staging, Production đều giống nhau
# Chỉ cần chạy migration
```

### 3. Tự Động Hóa
```bash
# Không cần chạy SQL bằng tay
# Tự động khi deploy
```

### 4. Rollback (nếu cần)
```bash
# Có thể tạo migration ngược lại
V4__remove_column.sql
```

---

## 📋 Best Practices

### 1. Naming Convention
```
✅ V1__init.sql
✅ V2__add_user_email.sql
✅ V3__add_order_index.sql

❌ V1_init.sql          (thiếu __)
❌ 1_init.sql           (thiếu V)
❌ V1__init             (thiếu .sql)
```

### 2. Không Sửa File Cũ
```
❌ Sửa V1__init.sql (đã chạy rồi)
✅ Tạo V2__alter_table.sql (migration mới)
```

### 3. Mỗi Migration Một Mục Đích
```
✅ V2__add_user_email.sql
✅ V3__add_user_phone.sql

❌ V2__add_user_email_and_phone.sql (nên tách)
```

### 4. Test Trước Khi Deploy
```bash
# Test trên local trước
mvn flyway:migrate

# Kiểm tra kết quả
SELECT * FROM flyway_schema_history;
```

---

## 🛠️ Commands Hữu Ích

### Xem Migration Status
```bash
mvn flyway:info
```

### Chạy Migration Thủ Công
```bash
mvn flyway:migrate
```

### Validate Migration
```bash
mvn flyway:validate
```

### Repair (nếu lỗi)
```bash
mvn flyway:repair
```

---

## 🎯 Tóm Tắt

| Câu hỏi | Trả lời |
|---------|---------|
| **V1__init.sql là gì?** | File migration đầu tiên, tạo toàn bộ database schema |
| **Tại sao cần?** | Quản lý database version, đồng bộ giữa các môi trường |
| **Khi nào chạy?** | Tự động khi start application (nếu chưa chạy) |
| **Có thể sửa không?** | ❌ Không sửa file đã chạy, tạo migration mới |
| **Làm sao thêm migration?** | Tạo file V2__description.sql, V3__description.sql... |

---

## 📚 Tài Liệu Tham Khảo

- [Flyway Documentation](https://flywaydb.org/documentation/)
- [Spring Boot + Flyway](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization.migration-tool.flyway)

---

## ✅ Checklist

- [ ] Hiểu Flyway là gì
- [ ] Hiểu V1__init.sql làm gì
- [ ] Biết cách tạo migration mới
- [ ] Biết không được sửa file cũ
- [ ] Biết cách test migration


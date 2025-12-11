# 🔄 Hướng dẫn Reset Database

## Vấn đề: Database không xóa dữ liệu khi restart

Khi sử dụng `ddl-auto: create`, Hibernate chỉ **DROP và CREATE tables** khi khởi động, nhưng:
- MySQL có thể không drop được nếu có **foreign key constraints**
- Dữ liệu cũ có thể vẫn còn nếu table không được drop thành công

## ✅ Giải pháp

### Cách 1: Dùng `create-drop` (Development)

**Cấu hình trong `application.yml`:**
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: create-drop  # DROP schema khi shutdown, CREATE khi startup
```

**Ưu điểm:**
- Tự động xóa toàn bộ schema khi shutdown ứng dụng
- Tạo lại schema khi startup

**Nhược điểm:**
- **KHÔNG phù hợp cho Production** (mất dữ liệu khi restart)
- Chỉ dùng cho development

---

### Cách 2: Xóa database và tạo lại thủ công

**Bước 1: Xóa database**
```sql
DROP DATABASE IF EXISTS tailor_shop;
CREATE DATABASE tailor_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Bước 2: Restart ứng dụng**
- Hibernate sẽ tự động tạo lại schema với `ddl-auto: create`

---

### Cách 3: Dùng Flyway với clean (Khuyến nghị cho Production)

**Cấu hình trong `application.yml`:**
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none  # Tắt Hibernate DDL
  flyway:
    enabled: true
    clean-on-validation-error: true  # Clean database nếu migration fail
    locations: classpath:db/migration
```

**Ưu điểm:**
- Quản lý schema versioning tốt
- An toàn cho production
- Có thể rollback migrations

**Nhược điểm:**
- Cần viết migration scripts
- Phức tạp hơn cho development

---

### Cách 4: Script SQL để xóa dữ liệu

**Tạo file `db/cleanup.sql`:**
```sql
-- Xóa dữ liệu từ tất cả tables (giữ lại schema)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE password_reset_tokens;
TRUNCATE TABLE audit_log;
TRUNCATE TABLE working_slots;
TRUNCATE TABLE referrals;
TRUNCATE TABLE loyalty_profiles;
TRUNCATE TABLE order_promotions;
TRUNCATE TABLE promotions;
TRUNCATE TABLE transactions;
TRUNCATE TABLE invoices;
TRUNCATE TABLE reviews;
TRUNCATE TABLE appointments;
TRUNCATE TABLE measurements;
TRUNCATE TABLE orders;
TRUNCATE TABLE favorites;
TRUNCATE TABLE styles;
TRUNCATE TABLE products;
TRUNCATE TABLE fabric_visits;
TRUNCATE TABLE fabric_holds;
TRUNCATE TABLE fabric_stock_movements;
TRUNCATE TABLE fabrics;
TRUNCATE TABLE users;
-- Giữ lại roles vì có default data

SET FOREIGN_KEY_CHECKS = 1;
```

**Chạy script:**
```bash
mysql -u root -p tailor_shop < db/cleanup.sql
```

---

## 🎯 Khuyến nghị

### Development Environment:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: create-drop  # Tự động xóa khi shutdown
  flyway:
    enabled: false
```

### Production Environment:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none  # Tắt Hibernate DDL
  flyway:
    enabled: true
    clean-on-validation-error: false  # KHÔNG clean trong production
```

---

## 🔍 Kiểm tra Database hiện tại

**Xem tất cả tables:**
```sql
SHOW TABLES;
```

**Xem dữ liệu trong users:**
```sql
SELECT * FROM users;
```

**Xem dữ liệu trong roles:**
```sql
SELECT * FROM roles;
```

**Xóa toàn bộ dữ liệu users (giữ lại roles):**
```sql
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM users;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## ⚠️ Lưu ý

1. **KHÔNG dùng `create-drop` trong Production** - sẽ mất dữ liệu khi restart
2. **Backup database trước khi xóa** nếu có dữ liệu quan trọng
3. **Flyway là cách tốt nhất** để quản lý schema trong production
4. **`ddl-auto: create`** chỉ phù hợp cho development khi muốn test từ đầu

---

## 🚀 Quick Reset (Development)

**Nếu muốn reset nhanh trong development:**

1. **Dừng ứng dụng**
2. **Xóa database:**
   ```sql
   DROP DATABASE IF EXISTS tailor_shop;
   CREATE DATABASE tailor_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. **Đổi `ddl-auto: create-drop`** trong `application.yml`
4. **Start lại ứng dụng** - Schema sẽ được tạo lại từ đầu


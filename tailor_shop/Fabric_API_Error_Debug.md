# Hướng dẫn Debug Lỗi 500 - Fabric API

## Lỗi hiện tại
```
GET /api/v1/fabrics?page=0&size=18
Status: 500 Internal Server Error
```

## Các bước debug

### 1. Kiểm tra Log Server

Xem log của Spring Boot application để tìm exception cụ thể:

```bash
# Nếu chạy bằng Maven
tail -f logs/spring-boot.log

# Hoặc xem console output khi chạy application
```

Tìm các dòng log có:
- `[TraceId: ...] Error listing fabrics:`
- `[TraceId: ...] Error converting fabric entity to response:`
- `Exception`, `Error`, `Stack trace`

### 2. Các nguyên nhân có thể

#### A. Database Connection Issues
- **Kiểm tra**: Database có đang chạy không?
- **Kiểm tra**: Connection string trong `application.properties` đúng chưa?
- **Kiểm tra**: Database có table `fabric` và `fabric_inventory` chưa?

#### B. Table chưa được tạo
- **Kiểm tra**: Chạy migration hoặc tạo table thủ công
- **SQL để tạo table**:
```sql
-- Kiểm tra table có tồn tại không
SHOW TABLES LIKE 'fabric%';

-- Nếu chưa có, cần chạy migration hoặc tạo table
```

#### C. Query Issues
- **Kiểm tra**: Repository query có đúng syntax không?
- **Kiểm tra**: Có data trong database không?

#### D. Null Pointer Exception
- **Đã fix**: Đã thêm null check trong `toResponse()` method
- **Kiểm tra**: Xem log có `NullPointerException` không?

### 3. Test trực tiếp với Database

```sql
-- Kiểm tra có data không
SELECT COUNT(*) FROM fabric WHERE is_deleted = false;

-- Kiểm tra query repository
SELECT f.* FROM fabric f 
WHERE f.is_deleted = false 
LIMIT 10;
```

### 4. Test API trực tiếp

Sử dụng Postman hoặc curl:

```bash
curl -X GET "http://localhost:8083/api/v1/fabrics?page=0&size=18" \
  -H "Content-Type: application/json"
```

### 5. Kiểm tra Application Properties

Đảm bảo các config sau đúng:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/tailor_shop
spring.datasource.username=your_username
spring.datasource.password=your_password

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

### 6. Enable SQL Logging

Thêm vào `application.properties`:

```properties
# Log SQL queries
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

### 7. Common Fixes

#### Fix 1: Kiểm tra Entity có đúng không
```java
// Đảm bảo FabricEntity có @Entity annotation
// Đảm bảo các field mapping đúng
```

#### Fix 2: Kiểm tra Repository Query
```java
// Query trong FabricRepository.searchFabrics() có đúng syntax không?
// Có thể test query trực tiếp trong database
```

#### Fix 3: Kiểm tra Inventory Repository
```java
// Các method calculateTotalQuantityByFabricId() có trả về null không?
// Đã thêm null check trong code
```

### 8. Temporary Workaround

Nếu cần test nhanh, có thể comment out phần inventory:

```java
// Tạm thời set giá trị mặc định
BigDecimal totalQuantity = BigDecimal.ZERO;
BigDecimal totalReserved = BigDecimal.ZERO;
BigDecimal availableQuantity = BigDecimal.ZERO;
Boolean isLowStock = false;
```

### 9. Kiểm tra Dependencies

Đảm bảo các dependencies sau có trong `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
```

### 10. Restart Application

Sau khi fix, restart application:

```bash
# Stop application
# Start lại
mvn spring-boot:run
# hoặc
./mvnw spring-boot:run
```

## Log Format để tìm lỗi

Sau khi restart, tìm trong log:

```
[TraceId: xxx] Error listing fabrics: <error message>
```

Hoặc:

```
Exception in thread "main" java.lang.XXXException: <message>
    at com.example.tailor_shop.modules.fabric.service.impl.FabricServiceImpl.list(FabricServiceImpl.java:XX)
```

## Next Steps

1. **Xem log server** để tìm exception cụ thể
2. **Kiểm tra database** có table và data không
3. **Test query trực tiếp** trong database
4. **Kiểm tra application.properties** config đúng chưa
5. **Restart application** sau khi fix

## Contact

Nếu vẫn không tìm được nguyên nhân, cung cấp:
- Full stack trace từ log
- Database schema (SHOW CREATE TABLE fabric;)
- Application properties (ẩn password)
- Version của Spring Boot và MySQL


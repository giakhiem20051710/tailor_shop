# Fabric Management Module - Giải Thích Chi Tiết

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc & Cấu Trúc](#kiến-trúc--cấu-trúc)
3. [Data Model](#data-model)
4. [DTOs](#dtos)
5. [Service Logic](#service-logic)
6. [Controller Endpoints](#controller-endpoints)
7. [Tính Năng Giống Shopee](#tính-năng-giống-shopee)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)

---

## 🎯 Tổng Quan

Module Fabric Management quản lý vải, tồn kho và yêu cầu giữ/xem vải, được thiết kế theo chuẩn Shopee với các tính năng:

- ✅ Fabric Catalog với filter đầy đủ
- ✅ Multiple images (gallery)
- ✅ Inventory Management với low stock alert
- ✅ Hold Requests (giữ vải với expiry date)
- ✅ Visit Requests (đặt lịch đến xem)
- ✅ Auto-reserve/release quantity
- ✅ View count tracking
- ✅ Featured fabrics
- ✅ SEO-friendly slugs

### Phân Quyền

| Role | Quyền |
|------|-------|
| **PUBLIC** | Xem danh sách và chi tiết vải |
| **CUSTOMER** | Xem vải; Tạo hold/visit requests; Cancel own requests |
| **STAFF/ADMIN** | Tất cả quyền của Customer; CRUD fabrics; Quản lý inventory; Duyệt hold/visit requests |

---

## 🏗️ Kiến Trúc & Cấu Trúc

### Module Structure

```
modules/fabric/
├── domain/
│   ├── FabricEntity.java              # Entity chính
│   ├── FabricInventoryEntity.java     # Quản lý tồn kho
│   ├── FabricHoldRequestEntity.java   # Yêu cầu giữ/xem
│   ├── FabricCategory.java            # Enum: COTTON, SILK, WOOL, etc.
│   ├── FabricPattern.java             # Enum: SOLID, STRIPED, CHECKED, etc.
│   ├── FabricHoldRequestType.java    # Enum: HOLD, VISIT
│   └── FabricHoldRequestStatus.java  # Enum: PENDING, APPROVED, etc.
├── dto/
│   ├── FabricRequest.java             # Tạo/cập nhật fabric
│   ├── FabricResponse.java            # Response với đầy đủ thông tin
│   ├── FabricFilterRequest.java       # Filter fabrics
│   ├── FabricInventoryRequest.java    # Cập nhật inventory
│   ├── FabricInventoryResponse.java   # Inventory response
│   ├── FabricHoldRequestRequest.java  # Tạo hold/visit request
│   ├── FabricHoldRequestResponse.java # Hold request response
│   └── UpdateHoldRequestStatusRequest.java # Cập nhật status
├── repository/
│   ├── FabricRepository.java
│   ├── FabricInventoryRepository.java
│   └── FabricHoldRequestRepository.java
├── service/
│   ├── FabricService.java
│   └── impl/
│       └── FabricServiceImpl.java
└── controller/
    └── FabricController.java
```

### Database Schema

```sql
-- Bảng chính: fabrics
CREATE TABLE fabrics (
    id BIGINT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,      -- Fabric code/SKU
    name VARCHAR(255) NOT NULL,             -- Fabric name
    slug VARCHAR(255),                      -- SEO-friendly URL
    description TEXT,
    category VARCHAR(100),                  -- COTTON, SILK, WOOL, etc.
    material VARCHAR(100),                  -- Material composition
    color VARCHAR(100),                     -- Primary color
    pattern VARCHAR(100),                   -- SOLID, STRIPED, etc.
    width DECIMAL(5,2),                     -- Width in cm
    weight DECIMAL(5,2),                    -- Weight in g/m²
    price_per_meter DECIMAL(14,2),         -- Price per meter
    image VARCHAR(500),                     -- Main image
    gallery JSON,                           -- Additional images
    origin VARCHAR(100),                    -- Country of origin
    care_instructions TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    view_count INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Bảng tồn kho: fabric_inventory
CREATE TABLE fabric_inventory (
    id BIGINT PRIMARY KEY,
    fabric_id BIGINT NOT NULL,
    location VARCHAR(100),                  -- Storage location
    quantity DECIMAL(10,2) DEFAULT 0,      -- Available quantity
    reserved_quantity DECIMAL(10,2) DEFAULT 0, -- Reserved quantity
    min_stock_level DECIMAL(10,2),         -- Min stock alert
    max_stock_level DECIMAL(10,2),         -- Max stock level
    unit VARCHAR(20) DEFAULT 'METER',      -- METER, YARD, etc.
    last_restocked_at TIMESTAMP,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Bảng yêu cầu: fabric_hold_requests
CREATE TABLE fabric_hold_requests (
    id BIGINT PRIMARY KEY,
    fabric_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,               -- Customer
    type VARCHAR(20) NOT NULL,             -- HOLD or VISIT
    quantity DECIMAL(10,2),                -- For HOLD type
    requested_date DATE,                   -- For VISIT type
    requested_time TIME,                   -- For VISIT type
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, APPROVED, etc.
    expiry_date DATE,                      -- For HOLD type
    notes TEXT,
    staff_notes TEXT,
    handled_by BIGINT,                     -- Staff who handled
    handled_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 📊 Data Model

### FabricEntity

**Mục đích**: Entity chính cho quản lý vải

**Các trường quan trọng**:

```java
- code: String (unique, SKU)
- name: String
- slug: String (SEO-friendly)
- category: FabricCategory (COTTON, SILK, WOOL, etc.)
- material: String
- color: String
- pattern: FabricPattern (SOLID, STRIPED, CHECKED, etc.)
- width: BigDecimal (cm)
- weight: BigDecimal (g/m²)
- pricePerMeter: BigDecimal
- image: String (main image URL)
- gallery: String (JSON array of image URLs)
- origin: String (country of origin)
- careInstructions: String
- isAvailable: Boolean
- isFeatured: Boolean
- displayOrder: Integer
- viewCount: Integer
```

**Relationships**:
- `@ManyToOne` với `UserEntity` (createdBy)
- `@OneToMany` với `FabricInventoryEntity` (nhiều inventory entries)
- `@OneToMany` với `FabricHoldRequestEntity` (nhiều requests)

### FabricInventoryEntity

**Mục đích**: Quản lý tồn kho vải theo location

**Các trường**:
```java
- fabric: FabricEntity
- location: String (storage location)
- quantity: BigDecimal (total quantity)
- reservedQuantity: BigDecimal (reserved quantity)
- availableQuantity: BigDecimal (calculated: quantity - reserved)
- minStockLevel: BigDecimal (alert threshold)
- maxStockLevel: BigDecimal
- unit: String (METER, YARD, etc.)
- isLowStock(): Boolean (calculated method)
```

**Business Logic**:
- `getAvailableQuantity()`: Tính available = quantity - reserved
- `isLowStock()`: Check nếu available <= minStockLevel

### FabricHoldRequestEntity

**Mục đích**: Yêu cầu giữ vải hoặc đặt lịch đến xem

**Các trường**:
```java
- fabric: FabricEntity
- user: UserEntity (customer)
- type: FabricHoldRequestType (HOLD or VISIT)
- quantity: BigDecimal (for HOLD type)
- requestedDate: LocalDate (for VISIT type)
- requestedTime: LocalTime (for VISIT type)
- status: FabricHoldRequestStatus (PENDING, APPROVED, etc.)
- expiryDate: LocalDate (for HOLD type, default 7 days)
- notes: String (customer notes)
- staffNotes: String (staff notes)
```

---

## 📦 DTOs

### FabricRequest

**Mục đích**: DTO cho tạo/cập nhật fabric

```java
{
    "code": "FAB-001",
    "name": "Cotton Fabric Premium",
    "slug": "cotton-fabric-premium",
    "description": "High quality cotton fabric...",
    "category": "COTTON",
    "material": "100% Cotton",
    "color": "White",
    "pattern": "SOLID",
    "width": 150.00,
    "weight": 200.00,
    "pricePerMeter": 50000.00,
    "image": "https://s3.amazonaws.com/fabric1.jpg",
    "gallery": [
        "https://s3.amazonaws.com/fabric1-1.jpg",
        "https://s3.amazonaws.com/fabric1-2.jpg"
    ],
    "origin": "Vietnam",
    "careInstructions": "Machine wash cold",
    "isAvailable": true,
    "isFeatured": false,
    "displayOrder": 0
}
```

**Validation**:
- `code`: Required, max 50 chars, unique
- `name`: Required, max 255 chars
- `pricePerMeter`: Required, positive
- `gallery`: Max 9 images

### FabricResponse

**Mục đích**: Response với đầy đủ thông tin fabric

```java
{
    "id": 1,
    "code": "FAB-001",
    "name": "Cotton Fabric Premium",
    "slug": "cotton-fabric-premium",
    "description": "High quality cotton fabric...",
    "category": "COTTON",
    "material": "100% Cotton",
    "color": "White",
    "pattern": "SOLID",
    "width": 150.00,
    "weight": 200.00,
    "pricePerMeter": 50000.00,
    "image": "https://s3.amazonaws.com/fabric1.jpg",
    "gallery": ["https://s3.amazonaws.com/fabric1-1.jpg"],
    "origin": "Vietnam",
    "careInstructions": "Machine wash cold",
    "isAvailable": true,
    "isFeatured": false,
    "displayOrder": 0,
    "viewCount": 150,
    "totalQuantity": 1000.00,        // Total inventory
    "availableQuantity": 850.00,     // Available (total - reserved)
    "isLowStock": false,             // Low stock alert
    "createdById": 1,
    "createdByName": "Admin",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
}
```

### FabricFilterRequest

**Mục đích**: Filter fabrics

```java
{
    "category": "COTTON",
    "color": "White",
    "pattern": "SOLID",
    "material": "Cotton",
    "origin": "Vietnam",
    "isAvailable": true,
    "isFeatured": false,
    "isLowStock": false,
    "minPrice": 30000.00,
    "maxPrice": 100000.00,
    "keyword": "cotton"
}
```

### FabricHoldRequestRequest

**Mục đích**: Tạo hold/visit request

**For HOLD type**:
```java
{
    "fabricId": 1,
    "type": "HOLD",
    "quantity": 5.00,
    "expiryDate": "2024-01-20",  // Optional, default 7 days
    "notes": "Please hold this fabric for me"
}
```

**For VISIT type**:
```java
{
    "fabricId": 1,
    "type": "VISIT",
    "requestedDate": "2024-01-18",
    "requestedTime": "14:00:00",
    "notes": "I want to see this fabric in person"
}
```

---

## 🔧 Service Logic

### create()

**Mục đích**: Tạo fabric mới

**Business Logic**:
1. Validate code không tồn tại
2. Generate slug nếu không có (từ name)
3. Check slug unique
4. Create entity
5. Save

**Validation**:
- Code phải unique
- Slug phải unique (auto-generate nếu conflict)

### updateInventory()

**Mục đích**: Cập nhật inventory

**Business Logic**:
1. Find hoặc create inventory entry theo location
2. Update quantity, reservedQuantity, minStockLevel, maxStockLevel
3. Update lastRestockedAt nếu quantity tăng
4. Save

**Features**:
- Multiple locations support
- Auto-update lastRestockedAt
- Track reserved quantity

### createHoldRequest()

**Mục đích**: Tạo hold/visit request

**Business Logic**:

**For HOLD type**:
1. Validate fabric available
2. Validate quantity > 0
3. Check available quantity >= requested quantity
4. Set expiry date (default 7 days)
5. Create request với status PENDING

**For VISIT type**:
1. Validate fabric available
2. Validate requestedDate không trong quá khứ
3. Create request với status PENDING

**Validation**:
- HOLD: quantity required, available quantity check
- VISIT: requestedDate required, không được trong quá khứ

### updateHoldRequestStatus()

**Mục đích**: Duyệt hold request (staff/admin)

**Business Logic**:
1. Validate status transition
2. Update status, staffNotes, handledBy, handledAt
3. **Nếu APPROVE HOLD request**: Reserve quantity trong inventory
4. Save

**Status Transitions**:
- PENDING → APPROVED, REJECTED, CANCELLED
- APPROVED → COMPLETED, CANCELLED
- Không thể update COMPLETED hoặc CANCELLED

**Auto-reserve**: Khi approve HOLD request, tự động reserve quantity

### cancelHoldRequest()

**Mục đích**: Hủy hold request (customer)

**Business Logic**:
1. Check ownership (chỉ owner mới cancel được)
2. Check status (không thể cancel COMPLETED hoặc CANCELLED)
3. **Nếu APPROVED HOLD request**: Release reserved quantity
4. Update status = CANCELLED
5. Save

**Auto-release**: Khi cancel APPROVED HOLD request, tự động release reserved quantity

### toResponse()

**Mục đích**: Convert entity to response với inventory info

**Business Logic**:
1. Calculate totalQuantity từ tất cả inventory entries
2. Calculate totalReservedQuantity
3. Calculate availableQuantity = totalQuantity - totalReserved
4. Check low stock (available <= minStockLevel)
5. Parse gallery JSON
6. Build response

---

## 🌐 Controller Endpoints

### Public Endpoints

#### GET `/api/v1/fabrics`

**Mục đích**: List fabrics với filter

**Query Parameters**:
```
?category=COTTON
&color=White
&pattern=SOLID
&material=Cotton
&origin=Vietnam
&isAvailable=true
&isFeatured=false
&isLowStock=false
&minPrice=30000
&maxPrice=100000
&keyword=cotton
&page=0
&size=20
&sort=displayOrder,asc
```

**Response**:
```json
{
    "success": true,
    "data": {
        "content": [...],
        "totalElements": 150,
        "totalPages": 8,
        "size": 20,
        "number": 0
    }
}
```

#### GET `/api/v1/fabrics/{id}`

**Mục đích**: Get fabric detail by ID (auto-increment view count)

**Response**: `FabricResponse`

#### GET `/api/v1/fabrics/code/{code}`

**Mục đích**: Get fabric detail by code

**Response**: `FabricResponse`

#### GET `/api/v1/fabrics/slug/{slug}`

**Mục đích**: Get fabric detail by slug (SEO-friendly)

**Response**: `FabricResponse`

### Admin/Staff Endpoints

#### POST `/api/v1/fabrics`

**Mục đích**: Create fabric

**Request Body**: `FabricRequest`

**Response**: `FabricResponse`

**Example**:
```json
POST /api/v1/fabrics
{
    "code": "FAB-001",
    "name": "Cotton Fabric Premium",
    "description": "High quality cotton fabric",
    "category": "COTTON",
    "color": "White",
    "pattern": "SOLID",
    "pricePerMeter": 50000.00,
    "image": "https://s3.amazonaws.com/fabric1.jpg",
    "gallery": ["https://s3.amazonaws.com/fabric1-1.jpg"],
    "isAvailable": true
}
```

#### PUT `/api/v1/fabrics/{id}`

**Mục đích**: Update fabric

**Request Body**: `FabricRequest`

**Response**: `FabricResponse`

#### DELETE `/api/v1/fabrics/{id}`

**Mục đích**: Delete fabric (soft delete)

**Response**: `{ "success": true, "data": null }`

#### GET `/api/v1/fabrics/{id}/inventory`

**Mục đích**: Get fabric inventory

**Response**: `Page<FabricInventoryResponse>`

#### PUT `/api/v1/fabrics/{id}/inventory`

**Mục đích**: Update fabric inventory

**Request Body**: `FabricInventoryRequest`

**Response**: `FabricInventoryResponse`

**Example**:
```json
PUT /api/v1/fabrics/1/inventory
{
    "location": "Warehouse A",
    "quantity": 1000.00,
    "reservedQuantity": 150.00,
    "minStockLevel": 100.00,
    "maxStockLevel": 2000.00,
    "unit": "METER",
    "notes": "Main warehouse"
}
```

### Customer Endpoints

#### POST `/api/v1/fabrics/hold-requests`

**Mục đích**: Create hold/visit request

**Request Body**: `FabricHoldRequestRequest`

**Response**: `FabricHoldRequestResponse`

**Example - HOLD**:
```json
POST /api/v1/fabrics/hold-requests
{
    "fabricId": 1,
    "type": "HOLD",
    "quantity": 5.00,
    "expiryDate": "2024-01-20",
    "notes": "Please hold this fabric for me"
}
```

**Example - VISIT**:
```json
POST /api/v1/fabrics/hold-requests
{
    "fabricId": 1,
    "type": "VISIT",
    "requestedDate": "2024-01-18",
    "requestedTime": "14:00:00",
    "notes": "I want to see this fabric in person"
}
```

#### GET `/api/v1/fabrics/hold-requests`

**Mục đích**: List hold/visit requests

**Query Parameters**:
```
?fabricId=1
&userId=5
&page=0
&size=20
&sort=createdAt,desc
```

**Note**: Customer chỉ thấy own requests, Staff/Admin thấy tất cả

**Response**: `Page<FabricHoldRequestResponse>`

#### GET `/api/v1/fabrics/hold-requests/{id}`

**Mục đích**: Get hold request detail

**Response**: `FabricHoldRequestResponse`

**Note**: Customer chỉ xem được own requests

#### DELETE `/api/v1/fabrics/hold-requests/{id}`

**Mục đích**: Cancel hold request (customer only)

**Response**: `{ "success": true, "data": null }`

### Staff/Admin Endpoints

#### PATCH `/api/v1/fabrics/hold-requests/{id}/status`

**Mục đích**: Update hold request status (approve/reject/complete)

**Request Body**: `UpdateHoldRequestStatusRequest`

**Response**: `FabricHoldRequestResponse`

**Example**:
```json
PATCH /api/v1/fabrics/hold-requests/1/status
{
    "status": "APPROVED",
    "staffNotes": "Approved, fabric will be held until 2024-01-20"
}
```

**Actions**:
- `APPROVED`: Duyệt request (auto-reserve quantity nếu HOLD)
- `REJECTED`: Từ chối request
- `COMPLETED`: Hoàn thành request
- `CANCELLED`: Hủy request

---

## 🛒 Tính Năng Giống Shopee

### 1. Fabric Catalog

- **Filter đầy đủ**: Category, color, pattern, material, origin, price range
- **Search**: Tìm kiếm theo keyword (name, description, code)
- **Sort**: Display order, price, view count
- **Featured**: Hiển thị featured fabrics nổi bật

### 2. Multiple Images

- **Gallery**: Tối đa 9 ảnh
- **Main image**: Ảnh chính
- **JSON storage**: Gallery lưu dạng JSON array

### 3. Inventory Management

- **Multiple locations**: Quản lý tồn kho theo nhiều location
- **Reserved quantity**: Track số lượng đã reserve
- **Available quantity**: Tự động tính = quantity - reserved
- **Low stock alert**: Cảnh báo khi stock thấp
- **Min/Max stock level**: Thiết lập ngưỡng min/max

### 4. Hold Requests

- **Giữ vải**: Customer có thể yêu cầu giữ vải
- **Expiry date**: Tự động set 7 ngày nếu không chỉ định
- **Auto-reserve**: Tự động reserve quantity khi approve
- **Auto-release**: Tự động release khi cancel

### 5. Visit Requests

- **Đặt lịch**: Customer đặt lịch đến xem vải
- **Date/Time**: Chọn ngày và giờ
- **Validation**: Không cho đặt lịch trong quá khứ

### 6. View Count

- **Auto-increment**: Tự động tăng view count khi xem detail
- **Tracking**: Track số lượt xem

### 7. SEO-Friendly

- **Slug**: URL thân thiện SEO
- **Auto-generate**: Tự động generate slug từ name
- **Unique**: Đảm bảo slug unique

---

## 💡 Usage Examples

### Example 1: Admin tạo Fabric

```bash
# 1. Login as admin
POST /api/v1/auth/login
{
    "username": "admin",
    "password": "password"
}

# 2. Create fabric
POST /api/v1/fabrics
{
    "code": "FAB-001",
    "name": "Cotton Fabric Premium",
    "description": "High quality cotton fabric",
    "category": "COTTON",
    "color": "White",
    "pattern": "SOLID",
    "width": 150.00,
    "weight": 200.00,
    "pricePerMeter": 50000.00,
    "image": "https://s3.amazonaws.com/fabric1.jpg",
    "gallery": [
        "https://s3.amazonaws.com/fabric1-1.jpg",
        "https://s3.amazonaws.com/fabric1-2.jpg"
    ],
    "origin": "Vietnam",
    "careInstructions": "Machine wash cold",
    "isAvailable": true,
    "isFeatured": false
}

# 3. Update inventory
PUT /api/v1/fabrics/1/inventory
{
    "location": "Warehouse A",
    "quantity": 1000.00,
    "reservedQuantity": 0.00,
    "minStockLevel": 100.00,
    "maxStockLevel": 2000.00,
    "unit": "METER"
}
```

### Example 2: Customer tạo Hold Request

```bash
# 1. Login as customer
POST /api/v1/auth/login
{
    "username": "customer1",
    "password": "password"
}

# 2. View fabric detail
GET /api/v1/fabrics/1

# 3. Create hold request
POST /api/v1/fabrics/hold-requests
{
    "fabricId": 1,
    "type": "HOLD",
    "quantity": 5.00,
    "expiryDate": "2024-01-20",
    "notes": "Please hold this fabric for me"
}

# 4. Request được tạo với status PENDING
# Staff sẽ approve sau
```

### Example 3: Staff duyệt Hold Request

```bash
# 1. Login as staff
POST /api/v1/auth/login
{
    "username": "staff1",
    "password": "password"
}

# 2. List pending requests
GET /api/v1/fabrics/hold-requests?status=PENDING

# 3. Approve request
PATCH /api/v1/fabrics/hold-requests/1/status
{
    "status": "APPROVED",
    "staffNotes": "Approved, fabric will be held until 2024-01-20"
}

# 4. Quantity tự động được reserve
# Available quantity giảm đi 5.00 meters
```

### Example 4: Customer tạo Visit Request

```bash
# 1. Create visit request
POST /api/v1/fabrics/hold-requests
{
    "fabricId": 1,
    "type": "VISIT",
    "requestedDate": "2024-01-18",
    "requestedTime": "14:00:00",
    "notes": "I want to see this fabric in person"
}

# 2. Request được tạo với status PENDING
# Staff sẽ approve và confirm lịch hẹn
```

### Example 5: Customer cancel Hold Request

```bash
# 1. Cancel own request
DELETE /api/v1/fabrics/hold-requests/1

# 2. Nếu request đã APPROVED:
#    - Status = CANCELLED
#    - Reserved quantity tự động được release
#    - Available quantity tăng lại
```

### Example 6: List Fabrics với Filter

```bash
# List available cotton fabrics
GET /api/v1/fabrics?category=COTTON&isAvailable=true&page=0&size=20

# List featured fabrics
GET /api/v1/fabrics?isFeatured=true

# List low stock fabrics
GET /api/v1/fabrics?isLowStock=true

# Search fabrics
GET /api/v1/fabrics?keyword=cotton&minPrice=30000&maxPrice=100000
```

### Example 7: Get Inventory

```bash
# Get fabric inventory
GET /api/v1/fabrics/1/inventory

Response:
{
    "content": [
        {
            "id": 1,
            "fabricId": 1,
            "fabricName": "Cotton Fabric Premium",
            "location": "Warehouse A",
            "quantity": 1000.00,
            "reservedQuantity": 150.00,
            "availableQuantity": 850.00,
            "minStockLevel": 100.00,
            "isLowStock": false,
            "unit": "METER"
        }
    ]
}
```

---

## ✅ Best Practices

### 1. Validation

- ✅ **Code**: Phải unique
- ✅ **Slug**: Phải unique (auto-generate nếu conflict)
- ✅ **Price**: Phải positive
- ✅ **Quantity**: Phải positive
- ✅ **Hold request**: Quantity không được vượt available
- ✅ **Visit request**: Date không được trong quá khứ

### 2. Security

- ✅ **RBAC**: Sử dụng `@PreAuthorize` cho mọi endpoint
- ✅ **Ownership check**: Customer chỉ cancel được own requests
- ✅ **Status check**: Validate status transitions

### 3. Performance

- ✅ **Lazy loading**: Sử dụng `FetchType.LAZY` cho relationships
- ✅ **Indexes**: Index trên các trường thường query (category, color, pattern, code, slug)
- ✅ **Pagination**: Luôn sử dụng pagination cho list endpoints

### 4. Business Logic

- ✅ **Auto-reserve**: Tự động reserve quantity khi approve HOLD request
- ✅ **Auto-release**: Tự động release quantity khi cancel APPROVED HOLD request
- ✅ **Low stock alert**: Tự động check và flag low stock
- ✅ **View count**: Tự động increment khi xem detail

### 5. Data Integrity

- ✅ **Soft delete**: Sử dụng `isDeleted` thay vì hard delete
- ✅ **Foreign keys**: Đảm bảo referential integrity
- ✅ **Unique constraints**: Code và slug phải unique

### 6. User Experience

- ✅ **Auto-generate slug**: Tự động generate từ name
- ✅ **Default expiry**: HOLD request mặc định 7 ngày
- ✅ **Multiple locations**: Hỗ trợ nhiều kho
- ✅ **Low stock alert**: Cảnh báo khi stock thấp

---

## 🔄 Workflow

### Hold Request Workflow

```
1. Customer tạo HOLD request
   POST /api/v1/fabrics/hold-requests
   - Type: HOLD
   - Quantity: 5.00
   - Status: PENDING
   ↓
2. Staff approve request
   PATCH /api/v1/fabrics/hold-requests/{id}/status
   - Status: APPROVED
   - Quantity tự động được reserve
   - Available quantity giảm
   ↓
3. Customer sử dụng hoặc cancel
   - Nếu sử dụng: Staff update status = COMPLETED
   - Nếu cancel: Customer cancel → Auto-release quantity
```

### Visit Request Workflow

```
1. Customer tạo VISIT request
   POST /api/v1/fabrics/hold-requests
   - Type: VISIT
   - RequestedDate: 2024-01-18
   - RequestedTime: 14:00:00
   - Status: PENDING
   ↓
2. Staff approve request
   PATCH /api/v1/fabrics/hold-requests/{id}/status
   - Status: APPROVED
   - Staff confirm lịch hẹn
   ↓
3. Customer đến xem
   - Staff update status = COMPLETED
```

---

## 📝 Notes

### TODO

1. **Expiry auto-check**: Có thể thêm scheduled job để auto-expire HOLD requests
2. **Notification**: Implement notification service cho hold/visit requests
3. **Analytics**: Track fabric popularity, most viewed, etc.
4. **Bulk operations**: Hỗ trợ bulk update inventory

### Limitations

1. **Single currency**: Chỉ hỗ trợ một loại tiền tệ
2. **Single unit**: Mặc định METER, có thể mở rộng
3. **No expiry auto-check**: HOLD requests không tự động expire (cần manual check)

---

## 🎉 Kết Luận

Module Fabric Management được thiết kế theo chuẩn Shopee với đầy đủ tính năng:

- ✅ Fabric Catalog với filter đầy đủ
- ✅ Inventory Management với low stock alert
- ✅ Hold/Visit Requests với auto-reserve/release
- ✅ View count tracking
- ✅ SEO-friendly slugs

Module sẵn sàng sử dụng trong production!


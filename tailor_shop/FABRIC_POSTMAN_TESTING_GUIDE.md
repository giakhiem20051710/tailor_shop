# Fabric Management Module - Hướng Dẫn Test Postman Chi Tiết

## 📋 Mục Lục

1. [Setup](#setup)
2. [Authentication](#authentication)
3. [Test Public Endpoints](#test-public-endpoints)
4. [Test Admin/Staff Endpoints](#test-adminstaff-endpoints)
5. [Test Customer Endpoints](#test-customer-endpoints)
6. [Test Hold/Visit Requests](#test-holdvisit-requests)
7. [Test Inventory Management](#test-inventory-management)
8. [Important Test Cases](#important-test-cases)
9. [Error Cases](#error-cases)
10. [Testing Checklist](#testing-checklist)

---

## 🔧 Setup

### 1. Import Collection

1. Mở Postman
2. Click **Import**
3. Chọn file `Fabric.postman_collection.json` (sẽ tạo sau)
4. Click **Import**

### 2. Setup Environment Variables

Tạo environment variables:

```
baseUrl: http://localhost:8080
adminToken: (sẽ lấy sau khi login)
staffToken: (sẽ lấy sau khi login)
customerToken: (sẽ lấy sau khi login)
fabricId: (sẽ lấy sau khi tạo fabric)
holdRequestId: (sẽ lấy sau khi tạo hold request)
```

### 3. Base URL

Tất cả requests sử dụng: `{{baseUrl}}/api/v1/fabrics`

---

## 🔐 Authentication

### Step 1: Login as Admin

**Request**:
```
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "username": "admin",
            "role": "ADMIN"
        }
    }
}
```

**Action**: Copy `token` và set vào `adminToken` variable

### Step 2: Login as Staff

**Request**:
```
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json

{
    "username": "staff1",
    "password": "staff123"
}
```

**Action**: Copy `token` và set vào `staffToken` variable

### Step 3: Login as Customer

**Request**:
```
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json

{
    "username": "customer1",
    "password": "customer123"
}
```

**Action**: Copy `token` và set vào `customerToken` variable

---

## 🌐 Test Public Endpoints

### Test 1: List Fabrics (No Auth)

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics?page=0&size=20&sort=displayOrder,asc
```

**Expected Response**: `200 OK`
```json
{
    "success": true,
    "data": {
        "content": [],
        "totalElements": 0,
        "totalPages": 0,
        "size": 20,
        "number": 0
    }
}
```

### Test 2: List Fabrics với Filter

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics?category=COTTON&color=White&isAvailable=true&page=0&size=20
```

**Query Parameters**:
- `category`: COTTON, SILK, WOOL, etc.
- `color`: White, Black, Red, etc.
- `pattern`: SOLID, STRIPED, CHECKED, etc.
- `material`: Cotton, Silk, etc.
- `origin`: Vietnam, China, etc.
- `isAvailable`: true/false
- `isFeatured`: true/false
- `isLowStock`: true/false
- `minPrice`: 30000
- `maxPrice`: 100000
- `keyword`: cotton

**Expected Response**: `200 OK` với filtered results

### Test 3: Get Fabric Detail by ID

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics/1
```

**Expected Response**: `200 OK`
```json
{
    "success": true,
    "data": {
        "id": 1,
        "code": "FAB-001",
        "name": "Cotton Fabric Premium",
        "category": "COTTON",
        "pricePerMeter": 50000.00,
        "totalQuantity": 1000.00,
        "availableQuantity": 850.00,
        "isLowStock": false,
        "viewCount": 1
    }
}
```

**Note**: View count tự động tăng sau request này

### Test 4: Get Fabric Detail by Code

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics/code/FAB-001
```

**Expected Response**: `200 OK` với fabric detail

### Test 5: Get Fabric Detail by Slug

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics/slug/cotton-fabric-premium
```

**Expected Response**: `200 OK` với fabric detail

---

## 👨‍💼 Test Admin/Staff Endpoints

### Test 6: Create Fabric (Admin)

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
    "code": "FAB-001",
    "name": "Cotton Fabric Premium",
    "slug": "cotton-fabric-premium",
    "description": "High quality cotton fabric, perfect for shirts and dresses",
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
    "careInstructions": "Machine wash cold, tumble dry low",
    "isAvailable": true,
    "isFeatured": false,
    "displayOrder": 0
}
```

**Expected Response**: `200 OK`
```json
{
    "success": true,
    "data": {
        "id": 1,
        "code": "FAB-001",
        "name": "Cotton Fabric Premium",
        "slug": "cotton-fabric-premium",
        "totalQuantity": 0.00,
        "availableQuantity": 0.00
    }
}
```

**Action**: Copy `id` và set vào `fabricId` variable

### Test 7: Update Fabric (Admin)

**Request**:
```
PUT {{baseUrl}}/api/v1/fabrics/{{fabricId}}
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
    "code": "FAB-001",
    "name": "Cotton Fabric Premium (Updated)",
    "description": "Updated description",
    "category": "COTTON",
    "pricePerMeter": 55000.00,
    "isFeatured": true
}
```

**Expected Response**: `200 OK` với updated fabric

### Test 8: Update Inventory (Admin)

**Request**:
```
PUT {{baseUrl}}/api/v1/fabrics/{{fabricId}}/inventory
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
    "location": "Warehouse A",
    "quantity": 1000.00,
    "reservedQuantity": 0.00,
    "minStockLevel": 100.00,
    "maxStockLevel": 2000.00,
    "unit": "METER",
    "notes": "Main warehouse stock"
}
```

**Expected Response**: `200 OK`
```json
{
    "success": true,
    "data": {
        "id": 1,
        "fabricId": 1,
        "location": "Warehouse A",
        "quantity": 1000.00,
        "reservedQuantity": 0.00,
        "availableQuantity": 1000.00,
        "minStockLevel": 100.00,
        "isLowStock": false
    }
}
```

### Test 9: Get Inventory (Admin)

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics/{{fabricId}}/inventory?page=0&size=20
Authorization: Bearer {{adminToken}}
```

**Expected Response**: `200 OK` với inventory list

### Test 10: Delete Fabric (Admin)

**Request**:
```
DELETE {{baseUrl}}/api/v1/fabrics/{{fabricId}}
Authorization: Bearer {{adminToken}}
```

**Expected Response**: `200 OK`
```json
{
    "success": true,
    "data": null
}
```

**Note**: Soft delete, fabric vẫn tồn tại trong DB nhưng `isDeleted = true`

---

## 👤 Test Customer Endpoints

### Test 11: Create Hold Request (Customer)

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics/hold-requests
Authorization: Bearer {{customerToken}}
Content-Type: application/json

{
    "fabricId": 1,
    "type": "HOLD",
    "quantity": 5.00,
    "expiryDate": "2024-01-20",
    "notes": "Please hold this fabric for me, I will come to pick it up"
}
```

**Expected Response**: `200 OK`
```json
{
    "success": true,
    "data": {
        "id": 1,
        "fabricId": 1,
        "type": "HOLD",
        "quantity": 5.00,
        "status": "PENDING",
        "expiryDate": "2024-01-20"
    }
}
```

**Action**: Copy `id` và set vào `holdRequestId` variable

### Test 12: Create Visit Request (Customer)

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics/hold-requests
Authorization: Bearer {{customerToken}}
Content-Type: application/json

{
    "fabricId": 1,
    "type": "VISIT",
    "requestedDate": "2024-01-18",
    "requestedTime": "14:00:00",
    "notes": "I want to see this fabric in person before purchasing"
}
```

**Expected Response**: `200 OK` với VISIT request

### Test 13: List Own Hold Requests (Customer)

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics/hold-requests?page=0&size=20&sort=createdAt,desc
Authorization: Bearer {{customerToken}}
```

**Expected Response**: `200 OK` với chỉ own requests

**Note**: Customer chỉ thấy requests của mình

### Test 14: Get Hold Request Detail (Customer)

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics/hold-requests/{{holdRequestId}}
Authorization: Bearer {{customerToken}}
```

**Expected Response**: `200 OK` với request detail

### Test 15: Cancel Hold Request (Customer)

**Request**:
```
DELETE {{baseUrl}}/api/v1/fabrics/hold-requests/{{holdRequestId}}
Authorization: Bearer {{customerToken}}
```

**Expected Response**: `200 OK`
```json
{
    "success": true,
    "data": null
}
```

**Note**: Nếu request đã APPROVED, quantity sẽ tự động được release

---

## 👨‍💼 Test Staff/Admin Endpoints

### Test 16: List All Hold Requests (Staff)

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics/hold-requests?page=0&size=20&sort=createdAt,desc
Authorization: Bearer {{staffToken}}
```

**Expected Response**: `200 OK` với tất cả requests

**Note**: Staff/Admin thấy tất cả requests

### Test 17: Approve Hold Request (Staff)

**Request**:
```
PATCH {{baseUrl}}/api/v1/fabrics/hold-requests/{{holdRequestId}}/status
Authorization: Bearer {{staffToken}}
Content-Type: application/json

{
    "status": "APPROVED",
    "staffNotes": "Approved, fabric will be held until 2024-01-20"
}
```

**Expected Response**: `200 OK`
```json
{
    "success": true,
    "data": {
        "id": 1,
        "status": "APPROVED",
        "handledById": 2,
        "handledByName": "Staff User",
        "handledAt": "2024-01-15T10:30:00Z"
    }
}
```

**Important**: 
- Status = APPROVED
- Quantity tự động được reserve
- Available quantity giảm đi 5.00 meters

### Test 18: Reject Hold Request (Staff)

**Request**:
```
PATCH {{baseUrl}}/api/v1/fabrics/hold-requests/{{holdRequestId}}/status
Authorization: Bearer {{staffToken}}
Content-Type: application/json

{
    "status": "REJECTED",
    "staffNotes": "Insufficient stock available"
}
```

**Expected Response**: `200 OK` với status = REJECTED

### Test 19: Complete Hold Request (Staff)

**Request**:
```
PATCH {{baseUrl}}/api/v1/fabrics/hold-requests/{{holdRequestId}}/status
Authorization: Bearer {{staffToken}}
Content-Type: application/json

{
    "status": "COMPLETED",
    "staffNotes": "Customer picked up the fabric"
}
```

**Expected Response**: `200 OK` với status = COMPLETED

---

## 🔄 Test Hold/Visit Requests Flow

### Complete Flow: Hold Request

**Step 1**: Customer tạo HOLD request
```
POST /api/v1/fabrics/hold-requests
{
    "fabricId": 1,
    "type": "HOLD",
    "quantity": 5.00
}
```
→ Status: PENDING

**Step 2**: Check inventory trước khi approve
```
GET /api/v1/fabrics/1/inventory
```
→ Available: 1000.00

**Step 3**: Staff approve request
```
PATCH /api/v1/fabrics/hold-requests/1/status
{
    "status": "APPROVED"
}
```
→ Status: APPROVED
→ Reserved: 5.00
→ Available: 995.00 (tự động giảm)

**Step 4**: Check inventory sau khi approve
```
GET /api/v1/fabrics/1/inventory
```
→ Available: 995.00 (đã giảm 5.00)

**Step 5**: Customer cancel request
```
DELETE /api/v1/fabrics/hold-requests/1
```
→ Status: CANCELLED
→ Reserved: 0.00 (tự động release)
→ Available: 1000.00 (tự động tăng lại)

### Complete Flow: Visit Request

**Step 1**: Customer tạo VISIT request
```
POST /api/v1/fabrics/hold-requests
{
    "fabricId": 1,
    "type": "VISIT",
    "requestedDate": "2024-01-18",
    "requestedTime": "14:00:00"
}
```
→ Status: PENDING

**Step 2**: Staff approve request
```
PATCH /api/v1/fabrics/hold-requests/1/status
{
    "status": "APPROVED",
    "staffNotes": "Confirmed, see you at 14:00 on 2024-01-18"
}
```
→ Status: APPROVED

**Step 3**: Staff complete sau khi customer đến
```
PATCH /api/v1/fabrics/hold-requests/1/status
{
    "status": "COMPLETED"
}
```
→ Status: COMPLETED

---

## 📦 Test Inventory Management

### Test 20: Multiple Locations

**Request 1**: Create inventory tại Warehouse A
```
PUT {{baseUrl}}/api/v1/fabrics/1/inventory
Authorization: Bearer {{adminToken}}
{
    "location": "Warehouse A",
    "quantity": 500.00,
    "minStockLevel": 50.00
}
```

**Request 2**: Create inventory tại Warehouse B
```
PUT {{baseUrl}}/api/v1/fabrics/1/inventory
Authorization: Bearer {{adminToken}}
{
    "location": "Warehouse B",
    "quantity": 300.00,
    "minStockLevel": 30.00
}
```

**Request 3**: Get all inventory
```
GET {{baseUrl}}/api/v1/fabrics/1/inventory
```
→ Should return 2 entries (Warehouse A và B)

### Test 21: Low Stock Alert

**Request 1**: Set inventory với low stock
```
PUT {{baseUrl}}/api/v1/fabrics/1/inventory
Authorization: Bearer {{adminToken}}
{
    "location": "Warehouse A",
    "quantity": 100.00,
    "reservedQuantity": 50.00,
    "minStockLevel": 100.00
}
```
→ Available: 50.00
→ isLowStock: true (vì 50.00 <= 100.00)

**Request 2**: Check fabric response
```
GET {{baseUrl}}/api/v1/fabrics/1
```
→ isLowStock: true

**Request 3**: Filter low stock fabrics
```
GET {{baseUrl}}/api/v1/fabrics?isLowStock=true
```
→ Should return fabrics with low stock

### Test 22: Restock Inventory

**Request 1**: Get current inventory
```
GET {{baseUrl}}/api/v1/fabrics/1/inventory
```
→ Quantity: 100.00

**Request 2**: Restock (increase quantity)
```
PUT {{baseUrl}}/api/v1/fabrics/1/inventory
Authorization: Bearer {{adminToken}}
{
    "location": "Warehouse A",
    "quantity": 500.00,
    "minStockLevel": 100.00
}
```
→ Quantity: 500.00
→ lastRestockedAt: (tự động update vì quantity tăng)

---

## ⚠️ Important Test Cases

### Test Case 1: Hold Request - Insufficient Quantity

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics/hold-requests
Authorization: Bearer {{customerToken}}
{
    "fabricId": 1,
    "type": "HOLD",
    "quantity": 2000.00  // Vượt quá available (1000.00)
}
```

**Expected Response**: `400 Bad Request`
```json
{
    "success": false,
    "message": "Insufficient quantity. Available: 1000.00",
    "traceId": "..."
}
```

### Test Case 2: Visit Request - Past Date

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics/hold-requests
Authorization: Bearer {{customerToken}}
{
    "fabricId": 1,
    "type": "VISIT",
    "requestedDate": "2023-01-01"  // Quá khứ
}
```

**Expected Response**: `400 Bad Request`
```json
{
    "success": false,
    "message": "Requested date cannot be in the past",
    "traceId": "..."
}
```

### Test Case 3: Hold Request - Missing Quantity

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics/hold-requests
Authorization: Bearer {{customerToken}}
{
    "fabricId": 1,
    "type": "HOLD"
    // Missing quantity
}
```

**Expected Response**: `400 Bad Request`
```json
{
    "success": false,
    "message": "Quantity is required for HOLD request",
    "traceId": "..."
}
```

### Test Case 4: Visit Request - Missing Date

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics/hold-requests
Authorization: Bearer {{customerToken}}
{
    "fabricId": 1,
    "type": "VISIT"
    // Missing requestedDate
}
```

**Expected Response**: `400 Bad Request`
```json
{
    "success": false,
    "message": "Requested date is required for VISIT request",
    "traceId": "..."
}
```

### Test Case 5: Cancel - Not Owner

**Request**:
```
DELETE {{baseUrl}}/api/v1/fabrics/hold-requests/1
Authorization: Bearer {{customerToken}}  // Different customer
```

**Expected Response**: `400 Bad Request`
```json
{
    "success": false,
    "message": "You can only cancel your own requests",
    "traceId": "..."
}
```

### Test Case 6: Update Status - Invalid Transition

**Request**:
```
PATCH {{baseUrl}}/api/v1/fabrics/hold-requests/1/status
Authorization: Bearer {{staffToken}}
{
    "status": "APPROVED"  // Request đã COMPLETED
}
```

**Expected Response**: `400 Bad Request`
```json
{
    "success": false,
    "message": "Cannot update completed or cancelled request",
    "traceId": "..."
}
```

### Test Case 7: Duplicate Code

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics
Authorization: Bearer {{adminToken}}
{
    "code": "FAB-001",  // Đã tồn tại
    "name": "Another Fabric"
}
```

**Expected Response**: `400 Bad Request`
```json
{
    "success": false,
    "message": "Fabric code already exists",
    "traceId": "..."
}
```

---

## ❌ Error Cases

### 1. Unauthorized (No Token)

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics
// No Authorization header
```

**Expected Response**: `401 Unauthorized`

### 2. Forbidden (Wrong Role)

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics
Authorization: Bearer {{customerToken}}  // Customer không có quyền
```

**Expected Response**: `403 Forbidden`

### 3. Not Found

**Request**:
```
GET {{baseUrl}}/api/v1/fabrics/99999
```

**Expected Response**: `404 Not Found`
```json
{
    "success": false,
    "message": "Fabric not found",
    "traceId": "..."
}
```

### 4. Validation Error

**Request**:
```
POST {{baseUrl}}/api/v1/fabrics
Authorization: Bearer {{adminToken}}
{
    "code": "",  // Empty
    "name": "",  // Empty
    "pricePerMeter": -100  // Negative
}
```

**Expected Response**: `400 Bad Request` với validation errors

---

## ✅ Testing Checklist

### Public Endpoints
- [ ] List fabrics (no auth)
- [ ] List fabrics với filter (category, color, pattern, price)
- [ ] List fabrics với keyword search
- [ ] Get fabric detail by ID
- [ ] Get fabric detail by code
- [ ] Get fabric detail by slug
- [ ] View count tự động tăng

### Admin/Staff Endpoints
- [ ] Create fabric
- [ ] Update fabric
- [ ] Delete fabric (soft delete)
- [ ] Create inventory
- [ ] Update inventory
- [ ] Get inventory list
- [ ] Multiple locations
- [ ] Low stock alert

### Customer Endpoints
- [ ] Create HOLD request
- [ ] Create VISIT request
- [ ] List own hold requests
- [ ] Get hold request detail
- [ ] Cancel own hold request
- [ ] Không thể cancel request của người khác

### Staff/Admin - Hold Requests
- [ ] List all hold requests
- [ ] Approve HOLD request (auto-reserve quantity)
- [ ] Reject hold request
- [ ] Complete hold request
- [ ] Update status với staff notes

### Business Logic
- [ ] HOLD request: Auto-reserve quantity khi approve
- [ ] HOLD request: Auto-release quantity khi cancel
- [ ] HOLD request: Default expiry 7 days
- [ ] VISIT request: Validate date không trong quá khứ
- [ ] Inventory: Calculate available quantity
- [ ] Inventory: Low stock alert
- [ ] Inventory: Auto-update lastRestockedAt

### Error Cases
- [ ] Unauthorized (no token)
- [ ] Forbidden (wrong role)
- [ ] Not found
- [ ] Validation errors
- [ ] Duplicate code
- [ ] Insufficient quantity
- [ ] Invalid status transition

---

## 📝 Notes

### Tips

1. **Save Variables**: Luôn save `fabricId` và `holdRequestId` sau khi tạo
2. **Check Inventory**: Luôn check inventory trước và sau khi approve/cancel
3. **View Count**: Mỗi lần get detail, view count tăng 1
4. **Auto-reserve**: Quantity tự động reserve khi approve HOLD request
5. **Auto-release**: Quantity tự động release khi cancel APPROVED HOLD request

### Common Issues

1. **401 Unauthorized**: Check token có đúng không, có expired không
2. **403 Forbidden**: Check role có đúng quyền không
3. **400 Bad Request**: Check validation errors trong response
4. **404 Not Found**: Check ID có đúng không, có bị soft delete không

---

## 🎉 Kết Luận

Sau khi test xong tất cả các cases trên, bạn đã verify được:

- ✅ Tất cả endpoints hoạt động đúng
- ✅ Business logic đúng (auto-reserve/release)
- ✅ Validation đúng
- ✅ RBAC đúng
- ✅ Error handling đúng

Module Fabric Management sẵn sàng production!


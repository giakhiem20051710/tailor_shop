# Hướng Dẫn Test Postman - Promotion Module

Hướng dẫn chi tiết từng bước để test module Promotion bằng Postman.

---

## 📋 Chuẩn Bị

### 1. Import Collection vào Postman

1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file `postman/Promotion.postman_collection.json`
4. Click **Import**

### 2. Setup Variables

Sau khi import, vào **Variables** tab và set các giá trị:

| Variable | Giá trị mẫu | Mô tả |
|----------|-------------|-------|
| `base_url` | `http://localhost:8080` | URL của backend |
| `token` | (để trống, sẽ set sau) | Bearer token sau khi login |
| `promotionId` | `1` | ID của promotion để test |
| `promotionCode` | `GIAM20` | Code của promotion để test |
| `userId` | `1` | ID của user để test |

---

## 🔐 Bước 1: Login để lấy Token

### Request: Auth - Login

**Method**: `POST`  
**URL**: `{{base_url}}/api/v1/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "username": "customer1",
  "password": "password"
}
```

**Response mẫu** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "expiresIn": 3600
}
```

**Cách lấy token**:
1. Copy giá trị `token` từ response
2. Vào **Variables** tab trong Postman
3. Paste vào biến `{{token}}`
4. Save

**Lưu ý**: 
- Nếu không có user `customer1`, tạo user mới hoặc dùng user có sẵn
- Token có thời hạn, nếu hết hạn cần login lại

---

## 📋 Bước 2: Xem Danh Sách Mã Đang Active (Public)

### Request: List Active Public Promotions

**Method**: `GET`  
**URL**: `{{base_url}}/api/v1/promotions/active`

**Headers**: (Không cần, đây là public endpoint)

**Query Parameters**:
- `page`: `0` (trang đầu tiên)
- `size`: `20` (20 items mỗi trang)

**Full URL**:
```
GET http://localhost:8080/api/v1/promotions/active?page=0&size=20
```

**Response mẫu** (200 OK):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "code": "GIAM20",
        "name": "Giảm 20% cho đơn hàng từ 500k",
        "description": "Áp dụng cho tất cả sản phẩm",
        "type": "PERCENTAGE",
        "status": "ACTIVE",
        "discountPercentage": 20.00,
        "maxDiscountAmount": 100000,
        "minOrderValue": 500000,
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "isPublic": true,
        "isSingleUse": false,
        "maxUsagePerUser": 3,
        "priority": 10,
        "totalUsageCount": 0,
        "isEligible": true,
        "isUsed": false
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "page": 0,
    "size": 20
  },
  "traceId": "abc123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Kiểm tra**:
- ✅ Status code = 200
- ✅ `success = true`
- ✅ `content` là array không rỗng (nếu có promotion)
- ✅ Mỗi promotion có đầy đủ thông tin

**Nếu không có promotion**:
- Response sẽ có `content: []` và `totalElements: 0`
- Đây là bình thường nếu chưa tạo promotion nào

---

## 🛠️ Bước 3: Tạo Promotion (Admin/Staff)

**Lưu ý**: Cần login với tài khoản ADMIN hoặc STAFF

### Request: Create Promotion - Percentage

**Method**: `POST`  
**URL**: `{{base_url}}/api/v1/promotions`

**Headers**:
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "code": "GIAM20",
  "name": "Giảm 20% cho đơn hàng từ 500k",
  "description": "Áp dụng cho tất cả sản phẩm, tối đa 100k",
  "type": "PERCENTAGE",
  "discountPercentage": 20.00,
  "maxDiscountAmount": 100000,
  "minOrderValue": 500000,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "maxUsageTotal": 1000,
  "maxUsagePerUser": 3,
  "isPublic": true,
  "isSingleUse": false,
  "priority": 10,
  "image": "https://s3.example.com/promo.jpg",
  "bannerText": "Giảm ngay 20%"
}
```

**Response mẫu** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "GIAM20",
    "name": "Giảm 20% cho đơn hàng từ 500k",
    "type": "PERCENTAGE",
    "status": "INACTIVE",
    "discountPercentage": 20.00,
    "maxDiscountAmount": 100000,
    "minOrderValue": 500000,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "isPublic": true,
    "isSingleUse": false,
    "priority": 10
  },
  "traceId": "abc123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Kiểm tra**:
- ✅ Status code = 201 Created
- ✅ `success = true`
- ✅ `status = "INACTIVE"` (mặc định chưa kích hoạt)
- ✅ Lưu `id` từ response để dùng cho các request sau

**Lưu ý**:
- Promotion mới tạo có `status = INACTIVE`
- Cần activate để sử dụng
- Nếu code đã tồn tại → Lỗi 400: "Promotion code already exists"

---

## ✅ Bước 4: Kích Hoạt Promotion

### Request: Activate Promotion

**Method**: `PATCH`  
**URL**: `{{base_url}}/api/v1/promotions/{{promotionId}}/activate`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Response mẫu** (200 OK):
```json
{
  "success": true,
  "data": null,
  "traceId": "abc123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Kiểm tra**:
- ✅ Status code = 200
- ✅ `success = true`

**Sau khi activate**:
- Gọi lại `GET /api/v1/promotions/active` → Promotion sẽ xuất hiện
- `status` chuyển thành `ACTIVE`

**Lỗi có thể gặp**:
- 404: Promotion not found
- 400: "Promotion dates are not valid for activation" (nếu dates không hợp lệ)
- 400: "Promotion is already active"

---

## 🛒 Bước 5: Test Tự Động Đề Xuất Mã (Shopee Style)

### Request: Get Available For Cart

**Method**: `GET` hoặc `POST`  
**URL**: `{{base_url}}/api/v1/promotions/available-for-cart`

**Headers**:
```
Authorization: Bearer {{token}}  (nếu dùng GET với query params, có thể không cần)
```

**Cách 1: Dùng GET với Query Parameters**
```
GET http://localhost:8080/api/v1/promotions/available-for-cart?orderAmount=600000&productIds=1,2,3&categoryIds=shirt,pants
```

**Cách 2: Dùng POST với Body** (Khuyến nghị)

**Body** (raw JSON):
```json
{
  "orderAmount": 600000,
  "productIds": [1, 2, 3],
  "categoryIds": ["shirt", "pants"]
}
```

**Response mẫu** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "promotionId": 1,
      "code": "GIAM20",
      "name": "Giảm 20% cho đơn hàng từ 500k",
      "type": "PERCENTAGE",
      "originalAmount": 600000,
      "discountAmount": 100000,
      "finalAmount": 500000,
      "message": "Giảm 100,000đ",
      "isEligible": true,
      "priority": 10
    },
    {
      "promotionId": 2,
      "code": "GIAM50K",
      "name": "Giảm 50k cho đơn từ 500k",
      "type": "FIXED_AMOUNT",
      "originalAmount": 600000,
      "discountAmount": 50000,
      "finalAmount": 550000,
      "message": "Giảm 50,000đ",
      "isEligible": true,
      "priority": 5
    }
  ],
  "traceId": "abc123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Kiểm tra**:
- ✅ Status code = 200
- ✅ `data` là array
- ✅ Mã được sắp xếp: giảm nhiều nhất → ít nhất
- ✅ Tất cả mã có `isEligible = true`
- ✅ `discountAmount` được tính đúng

**Test case 1: Đơn hàng đủ điều kiện**
- `orderAmount = 600000` (>= minOrderValue = 500000)
- → Có mã trong response

**Test case 2: Đơn hàng chưa đủ điều kiện**
- `orderAmount = 300000` (< minOrderValue = 500000)
- → Không có mã nào trong response (hoặc có nhưng `isEligible = false`)

---

## 🤖 Bước 6: Test Tự Động Apply Mã Tốt Nhất

### Request: Auto Apply Best Promo

**Method**: `POST`  
**URL**: `{{base_url}}/api/v1/promotions/auto-apply`

**Headers**:
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "orderAmount": 600000,
  "productIds": [1, 2, 3],
  "categoryIds": ["shirt", "pants"]
}
```

**Response mẫu** (200 OK):
```json
{
  "success": true,
  "data": {
    "promotionId": 1,
    "code": "GIAM20",
    "name": "Giảm 20% cho đơn hàng từ 500k",
    "type": "PERCENTAGE",
    "originalAmount": 600000,
    "discountAmount": 100000,
    "finalAmount": 500000,
    "message": "Đã tự động áp dụng mã GIAM20, giảm 100,000đ"
  },
  "traceId": "abc123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Kiểm tra**:
- ✅ Status code = 200
- ✅ `code` là mã giảm nhiều tiền nhất
- ✅ `discountAmount` được tính đúng
- ✅ `finalAmount = originalAmount - discountAmount`

**Test case 1: Có mã đủ điều kiện**
- → Trả về mã tốt nhất

**Test case 2: Không có mã đủ điều kiện**
- → Lỗi 404: "No applicable promotion found"

**Test case 3: Đã dùng hết số lần**
- → Lỗi 400: "You have reached maximum usage limit for this promotion"

---

## ✍️ Bước 7: Test Nhập Mã Thủ Công

### Request: Apply Promo Code

**Method**: `POST`  
**URL**: `{{base_url}}/api/v1/promotions/apply`

**Headers**:
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "code": "GIAM20",
  "orderAmount": 600000,
  "productIds": [1, 2, 3],
  "categoryIds": ["shirt"]
}
```

**Response mẫu** (200 OK):
```json
{
  "success": true,
  "data": {
    "promotionId": 1,
    "code": "GIAM20",
    "name": "Giảm 20% cho đơn hàng từ 500k",
    "type": "PERCENTAGE",
    "originalAmount": 600000,
    "discountAmount": 100000,
    "finalAmount": 500000,
    "message": "Applied promotion: Giảm 20% cho đơn hàng từ 500k"
  },
  "traceId": "abc123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Kiểm tra**:
- ✅ Status code = 200
- ✅ `discountAmount` được tính đúng
- ✅ `finalAmount` = 500000 (600000 - 100000)

**Test case 1: Mã hợp lệ**
- → Trả về discount amount

**Test case 2: Mã không tồn tại**
- Code: `KHONGTONTAI`
- → Lỗi 404: "Promotion code not found"

**Test case 3: Mã chưa được kích hoạt**
- → Lỗi 400: "Promotion is not active"

**Test case 4: Chưa đạt min order value**
- `orderAmount = 300000` (< 500000)
- → Lỗi 400: "Minimum order value is 500000"

**Test case 5: Đã dùng hết số lần**
- → Lỗi 400: "Promotion can only be used once per user"

---

## 📊 Bước 8: Test Xem Lịch Sử Sử Dụng

### Request: List My Usages

**Method**: `GET`  
**URL**: `{{base_url}}/api/v1/promotions/my-usages`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Query Parameters**:
- `page`: `0`
- `size`: `20`

**Full URL**:
```
GET http://localhost:8080/api/v1/promotions/my-usages?page=0&size=20
```

**Response mẫu** (200 OK):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "promotionId": 1,
        "promotionCode": "GIAM20",
        "promotionName": "Giảm 20% cho đơn hàng từ 500k",
        "orderId": 10,
        "invoiceId": 5,
        "discountAmount": 100000,
        "originalAmount": 600000,
        "finalAmount": 500000,
        "usedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "totalElements": 1,
    "totalPages": 1
  },
  "traceId": "abc123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Kiểm tra**:
- ✅ Status code = 200
- ✅ Chỉ hiển thị lịch sử của user hiện tại
- ✅ Sắp xếp theo `usedAt` (mới nhất trước)

**Lưu ý**: 
- Nếu chưa dùng mã nào → `content: []` và `totalElements: 0`
- Cần có order/invoice đã apply mã thì mới có data

---

## 🔍 Bước 9: Test Xem Chi Tiết Promotion

### Request: Promotion Detail by Code

**Method**: `GET`  
**URL**: `{{base_url}}/api/v1/promotions/code/{{promotionCode}}`

**Headers**: (Không cần, public endpoint)

**Full URL**:
```
GET http://localhost:8080/api/v1/promotions/code/GIAM20
```

**Response mẫu** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "GIAM20",
    "name": "Giảm 20% cho đơn hàng từ 500k",
    "description": "Áp dụng cho tất cả sản phẩm",
    "type": "PERCENTAGE",
    "status": "ACTIVE",
    "discountPercentage": 20.00,
    "maxDiscountAmount": 100000,
    "minOrderValue": 500000,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "isPublic": true,
    "isSingleUse": false,
    "maxUsagePerUser": 3,
    "totalUsageCount": 5,
    "isEligible": true,
    "isUsed": false
  },
  "traceId": "abc123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Kiểm tra**:
- ✅ Status code = 200
- ✅ Có đầy đủ thông tin promotion
- ✅ `isEligible` và `isUsed` (nếu đã đăng nhập)

**Test case: Mã không tồn tại**
- Code: `KHONGTONTAI`
- → Lỗi 404: "Promotion not found"

---

## 🧪 Test Cases Tổng Hợp

### Test Case 1: Flow Hoàn Chỉnh

1. **Login** → Lấy token
2. **Tạo promotion** (Admin/Staff) → Lưu `promotionId`
3. **Activate promotion** → Status = ACTIVE
4. **Xem danh sách active** → Promotion xuất hiện
5. **Get available for cart** → Có mã trong response
6. **Auto apply** → Chọn mã tốt nhất
7. **Apply mã thủ công** → Validate và tính discount
8. **Xem lịch sử** → Có record (sau khi tạo order/invoice)

### Test Case 2: Error Handling

1. **Mã không tồn tại**
   - Code: `INVALID123`
   - → 404 Not Found

2. **Mã chưa kích hoạt**
   - Tạo promotion nhưng chưa activate
   - → 400: "Promotion is not active"

3. **Chưa đạt min order value**
   - `orderAmount = 300000` (< 500000)
   - → 400: "Minimum order value is 500000"

4. **Đã dùng hết số lần**
   - Dùng mã `isSingleUse = true` 2 lần
   - → 400: "Promotion can only be used once per user"

5. **Mã đã hết hạn**
   - `endDate` đã qua
   - → 400: "Promotion is not valid for current date"

### Test Case 3: Multiple Promotions

1. **Tạo nhiều promotion**:
   - GIAM20: Giảm 20%, max 100k
   - GIAM50K: Giảm 50k
   - GIAM30: Giảm 30%, max 150k

2. **Test với orderAmount = 600000**:
   - GIAM30: 600000 * 30% = 180k → max 150k = **150k**
   - GIAM20: 600000 * 20% = 120k → max 100k = **100k**
   - GIAM50K: **50k**

3. **Auto apply** → Chọn GIAM30 (giảm nhiều nhất: 150k)

---

## 📝 Checklist Test

### ✅ Public Endpoints
- [ ] GET /api/v1/promotions/active
- [ ] GET /api/v1/promotions/{id}
- [ ] GET /api/v1/promotions/code/{code}
- [ ] GET /api/v1/promotions/suggestions

### ✅ Customer Endpoints
- [ ] GET /api/v1/promotions/available-for-cart
- [ ] POST /api/v1/promotions/auto-apply
- [ ] POST /api/v1/promotions/apply
- [ ] GET /api/v1/promotions/my-usages

### ✅ Admin/Staff Endpoints
- [ ] POST /api/v1/promotions (create)
- [ ] PUT /api/v1/promotions/{id} (update)
- [ ] DELETE /api/v1/promotions/{id} (delete)
- [ ] PATCH /api/v1/promotions/{id}/activate
- [ ] PATCH /api/v1/promotions/{id}/deactivate
- [ ] GET /api/v1/promotions/{id}/usages

### ✅ Error Cases
- [ ] Mã không tồn tại (404)
- [ ] Mã chưa kích hoạt (400)
- [ ] Chưa đạt min order value (400)
- [ ] Đã dùng hết số lần (400)
- [ ] Mã đã hết hạn (400)
- [ ] Code trùng khi tạo (400)
- [ ] Unauthorized (401)
- [ ] Forbidden (403)

---

## 💡 Tips & Tricks

### 1. Sử dụng Environment Variables
- Tạo Environment trong Postman
- Set `base_url`, `token` trong environment
- Dễ dàng switch giữa dev/staging/prod

### 2. Sử dụng Pre-request Script
- Tự động lấy token trước mỗi request
- Không cần copy/paste token thủ công

### 3. Sử dụng Tests Tab
- Tự động validate response
- Check status code, response structure
- Save response data vào variables

### 4. Sử dụng Collection Runner
- Chạy tất cả requests trong collection
- Test toàn bộ flow tự động

---

## 🐛 Troubleshooting

### Lỗi 401 Unauthorized
- **Nguyên nhân**: Token hết hạn hoặc không có token
- **Giải pháp**: Login lại và update token

### Lỗi 403 Forbidden
- **Nguyên nhân**: Không đủ quyền (ví dụ: CUSTOMER gọi endpoint ADMIN)
- **Giải pháp**: Login với tài khoản đúng role

### Lỗi 404 Not Found
- **Nguyên nhân**: Promotion không tồn tại hoặc đã bị xóa
- **Giải pháp**: Kiểm tra `promotionId` hoặc `promotionCode`

### Response rỗng
- **Nguyên nhân**: Chưa có promotion nào hoặc không đủ điều kiện
- **Giải pháp**: Tạo promotion và activate trước

---

**Tài liệu này hướng dẫn đầy đủ cách test module Promotion bằng Postman. Làm theo từng bước để đảm bảo tất cả tính năng hoạt động đúng!**


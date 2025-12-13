# Hướng Dẫn Lấy Mã Giảm Giá Cho Khách Hàng

Tài liệu này hướng dẫn **khách hàng** cách lấy và sử dụng mã giảm giá trong hệ thống Tailor Shop, tương tự như Shopee.

---

## 🎯 Các Cách Lấy Mã Giảm Giá

### 1. Xem Danh Sách Mã Đang Active (Công Khai)

**Cách đơn giản nhất**: Xem tất cả mã giảm giá đang diễn ra.

**API**: `GET /api/v1/promotions/active`

**Không cần đăng nhập** - Ai cũng có thể xem

**Ví dụ sử dụng**:
```
GET /api/v1/promotions/active?page=0&size=20
```

**Response**:
```json
{
  "content": [
    {
      "id": 1,
      "code": "GIAM20",
      "name": "Giảm 20% cho đơn hàng từ 500k",
      "type": "PERCENTAGE",
      "discountPercentage": 20.00,
      "maxDiscountAmount": 100000,
      "minOrderValue": 500000,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "isEligible": true,
      "isUsed": false,
      "bannerText": "Giảm ngay 20%"
    },
    {
      "id": 2,
      "code": "GIAM50K",
      "name": "Giảm 50k cho đơn từ 500k",
      "type": "FIXED_AMOUNT",
      "discountAmount": 50000,
      "minOrderValue": 500000,
      "isEligible": true
    }
  ]
}
```

**Cách dùng**:
1. Frontend gọi API này khi vào trang "Khuyến mãi"
2. Hiển thị danh sách mã cho khách hàng chọn
3. Khách hàng copy mã và nhập khi thanh toán

---

### 2. Tự Động Đề Xuất Mã Khi Vào Giỏ Hàng (Shopee Style)

**Tính năng giống Shopee**: Khi khách hàng vào giỏ hàng, hệ thống tự động hiển thị các mã có thể dùng.

**API**: `GET /api/v1/promotions/available-for-cart`

**Cần đăng nhập** (để kiểm tra eligibility)

**Request**:
```
GET /api/v1/promotions/available-for-cart?orderAmount=600000&productIds=1,2,3&categoryIds=shirt,pants
```

**Hoặc dùng POST với body**:
```
POST /api/v1/promotions/available-for-cart
{
  "orderAmount": 600000,
  "productIds": [1, 2, 3],
  "categoryIds": ["shirt", "pants"]
}
```

**Response**:
```json
{
  "content": [
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
  ]
}
```

**Cách dùng**:
1. Khi khách hàng vào giỏ hàng, frontend tự động gọi API này
2. Truyền `orderAmount` (tổng tiền giỏ hàng), `productIds`, `categoryIds`
3. Hệ thống trả về danh sách mã **đã được sắp xếp** theo discount amount (giảm nhiều nhất trước)
4. Frontend hiển thị: "Bạn có thể dùng mã GIAM20 để giảm 100,000đ"
5. Khách hàng click để apply mã

**Lưu ý**:
- Chỉ trả về mã mà khách hàng **đủ điều kiện** (`isEligible = true`)
- Đã được sắp xếp: mã giảm nhiều nhất → ít nhất
- Hiển thị rõ số tiền sẽ được giảm

---

### 3. Tự Động Apply Mã Tốt Nhất (Auto Apply)

**Tính năng giống Shopee**: Khách hàng bật "Tự động chọn mã tốt nhất", hệ thống tự động chọn mã giảm nhiều tiền nhất.

**API**: `POST /api/v1/promotions/auto-apply`

**Cần đăng nhập** (CUSTOMER role)

**Request**:
```
POST /api/v1/promotions/auto-apply
{
  "orderAmount": 600000,
  "productIds": [1, 2, 3],
  "categoryIds": ["shirt", "pants"]
}
```

**Response**:
```json
{
  "promotionId": 1,
  "code": "GIAM20",
  "name": "Giảm 20% cho đơn hàng từ 500k",
  "type": "PERCENTAGE",
  "originalAmount": 600000,
  "discountAmount": 100000,
  "finalAmount": 500000,
  "message": "Đã tự động áp dụng mã GIAM20, giảm 100,000đ"
}
```

**Cách dùng**:
1. Frontend có toggle "Tự động chọn mã tốt nhất"
2. Khi khách hàng bật toggle, gọi API này
3. Hệ thống tự động chọn mã giảm nhiều tiền nhất
4. Frontend hiển thị: "Đã áp dụng mã GIAM20, giảm 100,000đ"
5. Tự động cập nhật tổng tiền: 600,000đ → 500,000đ

**Lưu ý**:
- API này **validate usage limits** trước khi return
- Nếu không có mã nào đủ điều kiện → Lỗi 404
- Nếu khách hàng đã dùng hết số lần → Lỗi 400

---

### 4. Xem Tất Cả Mã Có Thể Dùng (Kể Cả Chưa Đủ Điều Kiện)

**API**: `GET /api/v1/promotions/suggestions`

**Khác với `available-for-cart`**: API này trả về **tất cả mã**, kể cả mã khách hàng chưa đủ điều kiện (để hiển thị "Cần mua thêm X để dùng mã này")

**Request**:
```
GET /api/v1/promotions/suggestions?orderAmount=300000&productIds=1,2
```

**Response**:
```json
{
  "content": [
    {
      "code": "GIAM20",
      "name": "Giảm 20% cho đơn hàng từ 500k",
      "discountAmount": 60000,
      "finalAmount": 240000,
      "message": "Giảm 60,000đ",
      "isEligible": false  // ← Chưa đủ điều kiện (cần 500k, hiện tại chỉ 300k)
    },
    {
      "code": "GIAM50K",
      "name": "Giảm 50k cho đơn từ 500k",
      "discountAmount": 50000,
      "finalAmount": 250000,
      "message": "Giảm 50,000đ",
      "isEligible": false  // ← Chưa đủ điều kiện
    }
  ]
}
```

**Cách dùng**:
- Hiển thị tất cả mã, nhưng disable các mã `isEligible = false`
- Hiển thị message: "Cần mua thêm 200,000đ để dùng mã này"
- Khuyến khích khách hàng mua thêm để đủ điều kiện

---

### 5. Nhập Mã Thủ Công (Như Shopee)

**API**: `POST /api/v1/promotions/apply`

**Cách dùng**: Khách hàng nhập mã vào ô input, frontend gọi API để validate và tính discount.

**Request**:
```
POST /api/v1/promotions/apply
{
  "code": "GIAM20",
  "orderAmount": 600000,
  "productIds": [1, 2, 3],
  "categoryIds": ["shirt"]
}
```

**Response**:
```json
{
  "promotionId": 1,
  "code": "GIAM20",
  "name": "Giảm 20% cho đơn hàng từ 500k",
  "type": "PERCENTAGE",
  "originalAmount": 600000,
  "discountAmount": 100000,
  "finalAmount": 500000,
  "message": "Applied promotion: Giảm 20% cho đơn hàng từ 500k"
}
```

**Lưu ý**:
- API này **chỉ validate và tính toán**, không lưu vào database
- Sau khi có response, frontend cần lưu `promotionId` vào order/invoice khi tạo đơn hàng
- Nếu mã không hợp lệ → Lỗi 400 với thông báo cụ thể

---

## 📱 Quy Trình Thực Tế (Frontend Flow)

### Scenario 1: Khách hàng vào giỏ hàng

```
1. User vào giỏ hàng
   ↓
2. Frontend gọi: GET /api/v1/promotions/available-for-cart
   Body: { orderAmount: 600000, productIds: [1,2,3] }
   ↓
3. Backend trả về danh sách mã có thể dùng
   ↓
4. Frontend hiển thị:
   - "Bạn có thể dùng mã GIAM20 để giảm 100,000đ"
   - "Bạn có thể dùng mã GIAM50K để giảm 50,000đ"
   ↓
5. User click "Áp dụng mã GIAM20"
   ↓
6. Frontend gọi: POST /api/v1/promotions/apply
   Body: { code: "GIAM20", orderAmount: 600000, ... }
   ↓
7. Backend trả về discount amount
   ↓
8. Frontend cập nhật UI: Tổng tiền = 500,000đ (đã giảm 100,000đ)
```

### Scenario 2: Khách hàng bật "Tự động chọn mã tốt nhất"

```
1. User bật toggle "Tự động chọn mã tốt nhất"
   ↓
2. Frontend gọi: POST /api/v1/promotions/auto-apply
   Body: { orderAmount: 600000, productIds: [1,2,3] }
   ↓
3. Backend tự động chọn mã tốt nhất (GIAM20)
   ↓
4. Frontend hiển thị: "Đã tự động áp dụng mã GIAM20, giảm 100,000đ"
   ↓
5. Tự động cập nhật tổng tiền
```

### Scenario 3: Khách hàng nhập mã thủ công

```
1. User nhập mã "GIAM20" vào ô input
   ↓
2. Frontend gọi: POST /api/v1/promotions/apply
   Body: { code: "GIAM20", orderAmount: 600000, ... }
   ↓
3. Backend validate và tính discount
   ↓
4. Nếu hợp lệ:
   - Frontend hiển thị: "Mã hợp lệ! Giảm 100,000đ"
   - Cập nhật tổng tiền
   
   Nếu không hợp lệ:
   - Frontend hiển thị: "Mã không hợp lệ" + message từ backend
```

---

## 🎨 UI/UX Gợi Ý (Giống Shopee)

### 1. Trang Khuyến Mãi
```
┌─────────────────────────────────────┐
│  🎁 Khuyến Mãi Đang Diễn Ra        │
├─────────────────────────────────────┤
│  [GIAM20] Giảm 20%                  │
│  Áp dụng cho đơn từ 500k            │
│  Giảm tối đa 100k                   │
│  [Sao chép mã]                      │
├─────────────────────────────────────┤
│  [GIAM50K] Giảm 50k                 │
│  Áp dụng cho đơn từ 500k            │
│  [Sao chép mã]                      │
└─────────────────────────────────────┘
```

### 2. Trong Giỏ Hàng
```
┌─────────────────────────────────────┐
│  Giỏ Hàng                           │
├─────────────────────────────────────┤
│  Sản phẩm 1: 200,000đ               │
│  Sản phẩm 2: 400,000đ               │
│  ─────────────────────────────      │
│  Tổng tiền: 600,000đ                │
├─────────────────────────────────────┤
│  💰 Mã Giảm Giá                     │
│  ┌─────────────────────────────┐   │
│  │ [GIAM20] Giảm 100,000đ      │   │
│  │ [Áp dụng]                   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ [GIAM50K] Giảm 50,000đ       │   │
│  │ [Áp dụng]                   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ [Nhập mã khác...]           │   │
│  └─────────────────────────────┘   │
│  ☑ Tự động chọn mã tốt nhất        │
├─────────────────────────────────────┤
│  Tổng sau giảm: 500,000đ            │
│  [Thanh toán]                       │
└─────────────────────────────────────┘
```

### 3. Khi Nhập Mã
```
┌─────────────────────────────────────┐
│  Nhập Mã Giảm Giá                   │
├─────────────────────────────────────┤
│  [GIAM20        ] [Áp dụng]         │
├─────────────────────────────────────┤
│  ✅ Mã hợp lệ!                      │
│  Giảm 100,000đ                      │
│  Tổng tiền: 500,000đ                │
└─────────────────────────────────────┘
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Thứ Tự Ưu Tiên
- Hệ thống tự động sắp xếp mã theo **discount amount** (giảm nhiều nhất trước)
- Nếu discount bằng nhau → sắp xếp theo **priority** (số cao hơn trước)

### 2. Eligibility Check
- `isEligible = true`: Khách hàng đủ điều kiện, có thể dùng ngay
- `isEligible = false`: Chưa đủ điều kiện (ví dụ: chưa đạt min order value, đã dùng hết số lần)

### 3. Usage Limits
- Một số mã chỉ dùng được 1 lần/user (`isSingleUse = true`)
- Một số mã có giới hạn số lần/user (`maxUsagePerUser`)
- Hệ thống tự động kiểm tra khi apply mã

### 4. Validation
- API `apply` và `auto-apply` **validate đầy đủ** trước khi return
- Nếu không hợp lệ → Lỗi 400 với message cụ thể
- Frontend nên hiển thị message này cho user

---

## 🔗 Tóm Tắt API Cho Customer

| API | Method | Mô tả | Cần đăng nhập |
|-----|--------|-------|---------------|
| `/api/v1/promotions/active` | GET | Xem danh sách mã đang active | ❌ |
| `/api/v1/promotions/available-for-cart` | GET/POST | Xem mã có thể dùng cho giỏ hàng | ✅ |
| `/api/v1/promotions/suggestions` | GET/POST | Xem tất cả mã (kể cả chưa đủ điều kiện) | ❌ |
| `/api/v1/promotions/auto-apply` | POST | Tự động chọn mã tốt nhất | ✅ |
| `/api/v1/promotions/apply` | POST | Nhập mã thủ công | ✅ |
| `/api/v1/promotions/my-usages` | GET | Xem lịch sử sử dụng mã của mình | ✅ |

---

**Tài liệu này hướng dẫn đầy đủ cách khách hàng lấy và sử dụng mã giảm giá. Frontend có thể implement theo các scenario trên để tạo trải nghiệm giống Shopee.**


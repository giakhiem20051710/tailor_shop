# Promotion Module - Hướng Dẫn Sử Dụng

Tài liệu này giải thích cách sử dụng module **Khuyến mãi & Mã giảm giá** của hệ thống Tailor Shop. Module này giúp bạn quản lý các chương trình khuyến mãi, tạo mã giảm giá, và áp dụng mã khi đặt hàng.

---

## 📋 Module này làm gì?

Module Promotion cung cấp hệ thống quản lý khuyến mãi chuyên nghiệp, tương tự như Shopee:

1. **Quản lý Khuyến mãi (Promotions)**: Tạo và quản lý các chương trình khuyến mãi với nhiều loại giảm giá
2. **Mã giảm giá (Promo Code)**: Tạo mã code để khách hàng nhập khi thanh toán
3. **Theo dõi sử dụng (Usage Tracking)**: Xem ai đã sử dụng mã nào, khi nào

---

## 🎯 Tính năng chính

### 1. Các loại khuyến mãi

#### 1.1. Giảm theo phần trăm (PERCENTAGE)
- Giảm X% trên tổng đơn hàng
- Có thể giới hạn số tiền giảm tối đa
- **Ví dụ**: Giảm 20%, tối đa 100,000đ

#### 1.2. Giảm số tiền cố định (FIXED_AMOUNT)
- Giảm một số tiền cố định
- **Ví dụ**: Giảm 50,000đ cho đơn hàng từ 500,000đ

#### 1.3. Miễn phí vận chuyển (FREE_SHIPPING)
- Miễn phí phí ship cho đơn hàng
- **Ví dụ**: Miễn phí ship cho đơn từ 300,000đ

#### 1.4. Mua X tặng Y (BUY_X_GET_Y)
- Mua X sản phẩm, tặng Y sản phẩm
- **Ví dụ**: Mua 2 tặng 1

---

## 🔐 Quyền truy cập

### Khách hàng (CUSTOMER)
- ✅ Xem danh sách khuyến mãi đang active
- ✅ Xem chi tiết khuyến mãi
- ✅ Áp dụng mã giảm giá khi đặt hàng
- ✅ Xem lịch sử sử dụng mã của mình

### Nhân viên/Admin (STAFF/ADMIN)
- ✅ Tất cả quyền của Customer
- ✅ Tạo khuyến mãi mới
- ✅ Sửa/xóa khuyến mãi
- ✅ Kích hoạt/tắt khuyến mãi
- ✅ Xem lịch sử sử dụng của tất cả khách hàng

---

## 📝 Hướng dẫn sử dụng

### 1. Xem danh sách khuyến mãi đang active (Public)

**Mục đích**: Xem tất cả các khuyến mãi đang diễn ra, ai cũng có thể xem.

**API**: `GET /api/v1/promotions/active`

**Ai được dùng**: Tất cả mọi người (không cần đăng nhập)

**Cách sử dụng**:
```
GET /api/v1/promotions/active?page=0&size=20
```

**Response mẫu**:
```json
{
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
      "image": "https://s3.../promo.jpg",
      "bannerText": "Giảm ngay 20%",
      "priority": 10,
      "totalUsageCount": 150,
      "isEligible": true,
      "isUsed": false
    }
  ],
  "totalElements": 10,
  "totalPages": 1
}
```

**Giải thích các trường**:
- `code`: Mã khuyến mãi (ví dụ: "GIAM20")
- `name`: Tên chương trình
- `type`: Loại khuyến mãi (PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING, BUY_X_GET_Y)
- `status`: Trạng thái (ACTIVE, INACTIVE, EXPIRED, CANCELLED)
- `discountPercentage`: Phần trăm giảm (nếu type = PERCENTAGE)
- `discountAmount`: Số tiền giảm (nếu type = FIXED_AMOUNT)
- `maxDiscountAmount`: Số tiền giảm tối đa
- `minOrderValue`: Đơn hàng tối thiểu để áp dụng
- `startDate` / `endDate`: Thời gian hiệu lực
- `isPublic`: `true` = công khai, `false` = mã riêng
- `isSingleUse`: `true` = chỉ dùng 1 lần/user, `false` = dùng nhiều lần
- `maxUsagePerUser`: Số lần tối đa mỗi user được dùng
- `totalUsageCount`: Tổng số lần đã sử dụng
- `isEligible`: Bạn có đủ điều kiện dùng không (nếu đã đăng nhập)
- `isUsed`: Bạn đã dùng mã này chưa (nếu đã đăng nhập)

---

### 2. Xem danh sách khuyến mãi (có filter) - Admin/Staff

**Mục đích**: Xem tất cả khuyến mãi, kể cả chưa active hoặc đã hết hạn.

**API**: `GET /api/v1/promotions`

**Ai được dùng**: Tất cả mọi người (nhưng Admin/Staff mới thấy các mã private)

**Cách sử dụng**:

#### Lọc theo trạng thái:
```
GET /api/v1/promotions?status=ACTIVE
```
→ Xem chỉ các khuyến mãi đang active

#### Lọc theo loại:
```
GET /api/v1/promotions?type=PERCENTAGE
```
→ Xem chỉ khuyến mãi giảm phần trăm

#### Tìm kiếm theo từ khóa:
```
GET /api/v1/promotions?keyword=giảm 20
```
→ Tìm khuyến mãi có tên hoặc code chứa "giảm 20"

#### Kết hợp nhiều filter:
```
GET /api/v1/promotions?status=ACTIVE&type=PERCENTAGE&keyword=giảm
```

---

### 3. Xem chi tiết khuyến mãi

**Mục đích**: Xem đầy đủ thông tin về một khuyến mãi cụ thể.

**API**: `GET /api/v1/promotions/{id}` hoặc `GET /api/v1/promotions/code/{code}`

**Cách sử dụng**:
```
GET /api/v1/promotions/1
GET /api/v1/promotions/code/GIAM20
```

**Response**: Tương tự như list, nhưng có đầy đủ thông tin hơn, bao gồm:
- `applicableProductIds`: Danh sách ID sản phẩm được áp dụng (nếu có)
- `applicableCategoryIds`: Danh sách category được áp dụng (nếu có)
- `applicableUserGroup`: Nhóm user được áp dụng (nếu có)

---

### 4. Áp dụng mã giảm giá (Customer)

**Mục đích**: Kiểm tra và tính toán giảm giá khi khách hàng nhập mã.

**API**: `POST /api/v1/promotions/apply`

**Ai được dùng**: Chỉ CUSTOMER (phải đăng nhập)

**Cách sử dụng**:
```
POST /api/v1/promotions/apply
{
  "code": "GIAM20",
  "orderAmount": 600000,
  "productIds": [1, 2, 3],
  "categoryIds": ["shirt", "pants"]
}
```

**Response mẫu**:
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

**Giải thích**:
- `originalAmount`: Tổng tiền ban đầu
- `discountAmount`: Số tiền được giảm
- `finalAmount`: Tổng tiền sau khi giảm

**Lưu ý**:
- API này chỉ **kiểm tra và tính toán**, không lưu vào database
- Sau khi có response, bạn cần lưu `promotionId` vào order/invoice khi tạo đơn hàng
- Nếu mã không hợp lệ → Lỗi 400 với thông báo cụ thể

---

### 5. Xem lịch sử sử dụng mã của tôi (Customer)

**Mục đích**: Xem các mã giảm giá bạn đã sử dụng.

**API**: `GET /api/v1/promotions/my-usages`

**Ai được dùng**: Chỉ CUSTOMER (phải đăng nhập)

**Cách sử dụng**:
```
GET /api/v1/promotions/my-usages?page=0&size=20
```

**Response mẫu**:
```json
{
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
  "totalElements": 5
}
```

---

## 🛠️ Quản trị (Admin/Staff)

### 6. Tạo khuyến mãi mới

**API**: `POST /api/v1/promotions`

**Body mẫu - Giảm phần trăm**:
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
  "image": "https://s3.../promo.jpg",
  "bannerText": "Giảm ngay 20%"
}
```

**Body mẫu - Giảm số tiền cố định**:
```json
{
  "code": "GIAM50K",
  "name": "Giảm 50k cho đơn từ 500k",
  "type": "FIXED_AMOUNT",
  "discountAmount": 50000,
  "minOrderValue": 500000,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "isPublic": true
}
```

**Body mẫu - Áp dụng cho sản phẩm cụ thể**:
```json
{
  "code": "SHIRT20",
  "name": "Giảm 20% cho áo sơ mi",
  "type": "PERCENTAGE",
  "discountPercentage": 20.00,
  "applicableProductIds": [1, 2, 3],
  "applicableCategoryIds": ["shirt"],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "isPublic": true
}
```

**Body mẫu - Mua X tặng Y**:
```json
{
  "code": "MUA2TANG1",
  "name": "Mua 2 tặng 1",
  "type": "BUY_X_GET_Y",
  "buyQuantity": 2,
  "getQuantity": 1,
  "getProductId": 10,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "isPublic": true
}
```

**Lưu ý**:
- `code`: Phải unique, chỉ chứa chữ HOA, số, dấu gạch ngang và gạch dưới
- `type`: Bắt buộc phải có
- Nếu `type = PERCENTAGE` → Phải có `discountPercentage`
- Nếu `type = FIXED_AMOUNT` → Phải có `discountAmount`
- Nếu `type = BUY_X_GET_Y` → Phải có `buyQuantity`, `getQuantity`, `getProductId`
- `endDate` phải sau `startDate`
- Mặc định `status = INACTIVE` (chưa kích hoạt)

---

### 7. Sửa khuyến mãi

**API**: `PUT /api/v1/promotions/{id}`

**Body**: Giống như tạo, tất cả trường optional (trừ `code` không được đổi)

**Lưu ý**: Không thể đổi `code` sau khi tạo

---

### 8. Xóa khuyến mãi

**API**: `DELETE /api/v1/promotions/{id}`

**Lưu ý**: Xóa mềm (soft delete), khuyến mãi vẫn còn trong database nhưng không hiển thị

---

### 9. Kích hoạt khuyến mãi

**API**: `PATCH /api/v1/promotions/{id}/activate`

**Điều kiện**:
- Khuyến mãi phải có `status = INACTIVE`
- `startDate` phải <= ngày hiện tại
- `endDate` phải >= ngày hiện tại

**Sau khi kích hoạt**: `status` chuyển thành `ACTIVE`

---

### 10. Tắt khuyến mãi

**API**: `PATCH /api/v1/promotions/{id}/deactivate`

**Sau khi tắt**: `status` chuyển thành `INACTIVE`

---

### 11. Xem lịch sử sử dụng (Admin/Staff)

**API**: `GET /api/v1/promotions/{id}/usages`

**Cách sử dụng**:
```
GET /api/v1/promotions/1/usages?userId=5&page=0&size=20
```

- Nếu có `userId`: Xem lịch sử của user cụ thể
- Nếu không có `userId`: Xem tất cả lịch sử

---

## 📊 Ví dụ sử dụng thực tế

### Tình huống 1: Khách hàng muốn dùng mã giảm giá

**Bước 1**: Xem danh sách khuyến mãi đang active
```
GET /api/v1/promotions/active
```

**Bước 2**: Chọn mã phù hợp (ví dụ: "GIAM20")

**Bước 3**: Khi thanh toán, nhập mã và kiểm tra
```
POST /api/v1/promotions/apply
{
  "code": "GIAM20",
  "orderAmount": 600000,
  "productIds": [1, 2]
}
```

**Bước 4**: Nhận được discount amount, áp dụng vào đơn hàng

**Bước 5**: Xem lại lịch sử sử dụng
```
GET /api/v1/promotions/my-usages
```

---

### Tình huống 2: Admin tạo chương trình Black Friday

**Bước 1**: Tạo khuyến mãi
```
POST /api/v1/promotions
{
  "code": "BLACKFRIDAY50",
  "name": "Black Friday - Giảm 50%",
  "type": "PERCENTAGE",
  "discountPercentage": 50.00,
  "maxDiscountAmount": 500000,
  "minOrderValue": 1000000,
  "startDate": "2024-11-25",
  "endDate": "2024-11-30",
  "maxUsageTotal": 1000,
  "maxUsagePerUser": 1,
  "isPublic": true,
  "isSingleUse": true,
  "priority": 100
}
```

**Bước 2**: Kích hoạt khuyến mãi
```
PATCH /api/v1/promotions/{id}/activate
```

**Bước 3**: Theo dõi số lượng sử dụng
```
GET /api/v1/promotions/{id}
```
→ Xem `totalUsageCount`

---

### Tình huống 3: Tạo mã riêng cho khách VIP

**Bước 1**: Tạo mã private
```
POST /api/v1/promotions
{
  "code": "VIP100K",
  "name": "Mã riêng VIP - Giảm 100k",
  "type": "FIXED_AMOUNT",
  "discountAmount": 100000,
  "minOrderValue": 500000,
  "applicableUserGroup": "VIP",
  "isPublic": false,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Lưu ý**: `isPublic = false` → Mã này không hiển thị trong danh sách public, chỉ Admin/Staff mới thấy

---

## ⚠️ Lỗi thường gặp

### 1. Mã không tồn tại
```
POST /api/v1/promotions/apply
{
  "code": "KHONGTONTAI"
}
```
→ **Lỗi**: 404 Not Found - "Promotion code not found"

### 2. Mã chưa được kích hoạt
```
POST /api/v1/promotions/apply
{
  "code": "GIAM20"  // status = INACTIVE
}
```
→ **Lỗi**: 400 Bad Request - "Promotion is not active"

### 3. Mã đã hết hạn
```
POST /api/v1/promotions/apply
{
  "code": "GIAM20"  // endDate đã qua
}
```
→ **Lỗi**: 400 Bad Request - "Promotion is not valid for current date"

### 4. Chưa đạt giá trị đơn hàng tối thiểu
```
POST /api/v1/promotions/apply
{
  "code": "GIAM20",
  "orderAmount": 300000  // minOrderValue = 500000
}
```
→ **Lỗi**: 400 Bad Request - "Minimum order value is 500000"

### 5. Đã dùng hết số lần
```
POST /api/v1/promotions/apply
{
  "code": "GIAM20"  // isSingleUse = true, đã dùng rồi
}
```
→ **Lỗi**: 400 Bad Request - "Promotion can only be used once per user"

### 6. Đã đạt giới hạn tổng số lần
```
POST /api/v1/promotions/apply
{
  "code": "GIAM20"  // maxUsageTotal = 1000, đã dùng hết
}
```
→ **Lỗi**: 400 Bad Request - "Promotion has reached maximum usage limit"

### 7. Sản phẩm không áp dụng
```
POST /api/v1/promotions/apply
{
  "code": "SHIRT20",  // chỉ áp dụng cho áo sơ mi
  "productIds": [10, 11]  // nhưng đây là quần
}
```
→ **Lỗi**: 400 Bad Request - "Promotion is not applicable to selected products"

### 8. Code đã tồn tại
```
POST /api/v1/promotions
{
  "code": "GIAM20"  // đã có rồi
}
```
→ **Lỗi**: 400 Bad Request - "Promotion code already exists"

### 9. End date trước start date
```
POST /api/v1/promotions
{
  "startDate": "2024-12-31",
  "endDate": "2024-01-01"  // sai
}
```
→ **Lỗi**: 400 Bad Request - "End date must be after start date"

### 10. Chưa đăng nhập khi apply mã
```
POST /api/v1/promotions/apply  // Không có token
```
→ **Lỗi**: 401 Unauthorized

---

## 💡 Mẹo sử dụng

### Cho Khách hàng:

1. **Xem khuyến mãi trước khi mua**: Luôn check `/api/v1/promotions/active` trước khi đặt hàng
2. **Kiểm tra điều kiện**: Xem `minOrderValue`, `applicableProductIds` để biết có áp dụng được không
3. **Tận dụng mã single-use**: Nếu `isSingleUse = true`, chỉ dùng được 1 lần, hãy dùng cho đơn hàng lớn nhất
4. **Theo dõi lịch sử**: Xem `/api/v1/promotions/my-usages` để biết đã dùng mã nào

### Cho Admin/Staff:

1. **Ưu tiên khuyến mãi**: Dùng `priority` để sắp xếp thứ tự hiển thị (số càng cao, hiển thị càng trước)
2. **Giới hạn sử dụng**: Đặt `maxUsageTotal` và `maxUsagePerUser` để kiểm soát chi phí
3. **Mã riêng tư**: Dùng `isPublic = false` cho mã chỉ dành cho khách VIP hoặc mã đặc biệt
4. **Kiểm tra trước khi kích hoạt**: Luôn validate dates trước khi activate
5. **Theo dõi hiệu quả**: Xem `totalUsageCount` để đánh giá chương trình

---

## 📊 Các giá trị có thể dùng

### PromotionType:
- `PERCENTAGE` - Giảm theo phần trăm
- `FIXED_AMOUNT` - Giảm số tiền cố định
- `FREE_SHIPPING` - Miễn phí vận chuyển
- `BUY_X_GET_Y` - Mua X tặng Y

### PromotionStatus:
- `ACTIVE` - Đang hoạt động
- `INACTIVE` - Chưa kích hoạt
- `EXPIRED` - Đã hết hạn
- `CANCELLED` - Đã hủy

### ApplicableUserGroup:
- `VIP` - Khách VIP
- `NEW_USER` - Khách mới
- `LOYAL` - Khách thân thiết
- Hoặc bất kỳ giá trị nào bạn định nghĩa

---

## 🔗 Liên kết nhanh

- **Xem khuyến mãi active**: `GET /api/v1/promotions/active`
- **Áp dụng mã**: `POST /api/v1/promotions/apply` (cần đăng nhập)
- **Xem lịch sử của tôi**: `GET /api/v1/promotions/my-usages` (cần đăng nhập)
- **Tạo khuyến mãi**: `POST /api/v1/promotions` (Admin/Staff)
- **Kích hoạt**: `PATCH /api/v1/promotions/{id}/activate` (Admin/Staff)

---

## 📝 Quy trình tích hợp vào Order/Invoice

Khi khách hàng áp dụng mã giảm giá:

1. **Frontend gọi** `POST /api/v1/promotions/apply` với thông tin đơn hàng
2. **Nhận được** `discountAmount` và `promotionId`
3. **Khi tạo Order/Invoice**, lưu `promotionId` vào order/invoice
4. **Tính lại tổng tiền**: `finalAmount = originalAmount - discountAmount`
5. **Sau khi thanh toán thành công**, tạo record trong `promotion_usages`:
   ```json
   {
     "promotionId": 1,
     "userId": 5,
     "orderId": 10,
     "invoiceId": 5,
     "discountAmount": 100000,
     "originalAmount": 600000,
     "finalAmount": 500000
   }
   ```

---

**Tài liệu này đi kèm với mã nguồn module Promotion. Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.**


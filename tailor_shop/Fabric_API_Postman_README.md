# Fabric API Postman Collection

File Postman collection để test các API của module Fabric.

## Cách sử dụng

### 1. Import vào Postman

1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file `Fabric_API_Postman_Collection.json`
4. Click **Import**

### 2. Cấu hình Variables

Sau khi import, cấu hình các biến sau:

1. Click vào collection **Fabric API Collection**
2. Vào tab **Variables**
3. Cập nhật các giá trị:
   - `baseUrl`: URL của API server (mặc định: `http://localhost:8080`)
   - `token`: JWT token để authenticate (lấy từ API login)

### 3. Lấy Token

Trước khi test các API cần authentication, bạn cần:

1. Login qua API authentication
2. Copy JWT token từ response
3. Paste vào variable `token` trong collection

### 4. Các nhóm API

Collection được chia thành các nhóm:

#### **Fabric Management**
- **List Fabrics (Public)**: Lấy danh sách vải với filter và pagination
- **Get Fabric Detail by ID/Code/Slug (Public)**: Lấy chi tiết vải
- **Create Fabric (Admin/Staff)**: Tạo mới vải
- **Update Fabric (Admin/Staff)**: Cập nhật vải
- **Delete Fabric (Admin/Staff)**: Xóa vải
- **Get/Update Fabric Inventory (Admin/Staff)**: Quản lý kho vải

#### **Fabric Hold Requests**
- **Create Hold Request (Customer)**: Tạo yêu cầu giữ vải
- **Create Visit Request (Customer)**: Tạo yêu cầu đặt lịch đến xem
- **List Hold Requests**: Lấy danh sách yêu cầu
- **Get Hold Request Detail**: Lấy chi tiết yêu cầu
- **Update Hold Request Status (Admin/Staff)**: Cập nhật trạng thái
- **Cancel Hold Request (Customer)**: Hủy yêu cầu

#### **Fabric Orders**
- **Checkout (Customer)**: Tạo đơn hàng từ giỏ hàng
- **List My Orders (Customer)**: Lấy danh sách đơn hàng
- **Get Order Detail (Customer)**: Lấy chi tiết đơn hàng
- **Cancel Order (Customer)**: Hủy đơn hàng
- **Process Payment (Customer)**: Thanh toán đơn hàng

#### **Fabric Promo**
- **Apply Promo Code (Customer)**: Áp dụng mã giảm giá

## Các giá trị Enum

### FabricCategory
- `COTTON`, `SILK`, `WOOL`, `POLYESTER`, `LINEN`, `DENIM`, `LEATHER`, `SYNTHETIC`, `BLEND`, `OTHER`

### FabricPattern
- `SOLID`, `STRIPED`, `CHECKED`, `FLORAL`, `GEOMETRIC`, `ABSTRACT`, `POLKA_DOT`, `ANIMAL_PRINT`, `TEXTURED`, `OTHER`

### PaymentMethod
- `COD` - Thanh toán khi nhận hàng
- `BANK_TRANSFER` - Chuyển khoản ngân hàng
- `CREDIT_CARD` - Thẻ tín dụng
- `DEBIT_CARD` - Thẻ ghi nợ
- `E_WALLET` - Ví điện tử
- `INSTALLMENT` - Trả góp

### FabricHoldRequestType
- `HOLD` - Giữ vải
- `VISIT` - Đặt lịch đến xem

### Hold Request Status
- `PENDING` - Đang chờ
- `APPROVED` - Đã duyệt
- `REJECTED` - Từ chối
- `COMPLETED` - Hoàn thành
- `CANCELLED` - Đã hủy

## Lưu ý

1. **Authentication**: 
   - Các API public không cần token
   - Các API có role requirement cần token với đúng role

2. **Roles**:
   - `CUSTOMER`: Khách hàng
   - `STAFF`: Nhân viên
   - `ADMIN`: Quản trị viên

3. **Pagination**: 
   - Mặc định: `page=0`, `size=20`
   - Có thể điều chỉnh trong query params

4. **Filter**: 
   - Các filter trong List Fabrics có thể bật/tắt trong Postman
   - Click vào query param và bỏ check "disabled" để sử dụng

## Ví dụ Request Body

### Create Fabric
```json
{
    "code": "FAB001",
    "name": "Cotton Fabric Premium",
    "slug": "cotton-fabric-premium",
    "description": "High quality cotton fabric",
    "category": "COTTON",
    "material": "100% Cotton",
    "color": "White",
    "pattern": "SOLID",
    "width": 1.5,
    "weight": 0.2,
    "pricePerMeter": 150000,
    "image": "https://example.com/fabric1.jpg",
    "gallery": ["https://example.com/fabric1-1.jpg"],
    "origin": "Vietnam",
    "careInstructions": "Machine wash cold",
    "isAvailable": true,
    "isFeatured": false,
    "displayOrder": 1
}
```

### Checkout
```json
{
    "cartItemIds": [1, 2, 3],
    "promoCode": "FABRIC10",
    "shippingName": "Nguyễn Văn A",
    "shippingPhone": "0901234567",
    "shippingAddress": "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
    "paymentMethod": "COD",
    "notes": "Giao hàng vào buổi sáng"
}
```

## Troubleshooting

1. **401 Unauthorized**: Kiểm tra token có hợp lệ không
2. **403 Forbidden**: Kiểm tra role của user có đủ quyền không
3. **404 Not Found**: Kiểm tra ID có tồn tại không
4. **400 Bad Request**: Kiểm tra request body có đúng format không


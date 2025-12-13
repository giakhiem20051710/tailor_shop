# Product/Catalog Module - Hướng Dẫn Sử Dụng

Tài liệu này giải thích cách sử dụng module **Sản phẩm & Danh mục** của hệ thống Tailor Shop. Module này giúp bạn xem danh sách sản phẩm, tìm kiếm, xem chi tiết, và quản lý danh sách yêu thích.

---

## 📋 Module này làm gì?

Module Product/Catalog cung cấp 3 chức năng chính:

1. **Xem Sản phẩm (Products)**: Danh sách sản phẩm may với đầy đủ thông tin, hình ảnh, giá cả
2. **Xem Phong cách (Styles)**: Các phong cách thiết kế có sẵn
3. **Yêu thích (Favorites)**: Lưu sản phẩm yêu thích để xem lại sau

---

## 🎯 Tính năng chính

### 1. Xem danh sách sản phẩm (Products List)

**Mục đích**: Xem tất cả sản phẩm có sẵn, tìm kiếm và lọc theo nhiều tiêu chí.

**API**: `GET /api/v1/products`

**Ai được dùng**: Tất cả mọi người (không cần đăng nhập)

**Cách sử dụng**:

#### Lọc theo danh mục:
```
GET /api/v1/products?category=shirt
```
→ Xem tất cả áo sơ mi

#### Lọc theo dịp sử dụng:
```
GET /api/v1/products?occasion=office
```
→ Xem sản phẩm phù hợp cho văn phòng

#### Tìm kiếm theo từ khóa:
```
GET /api/v1/products?keyword=áo sơ mi
```
→ Tìm tất cả sản phẩm có chứa "áo sơ mi" trong tên hoặc mô tả

#### Lọc theo khoảng giá:
```
GET /api/v1/products?minPrice=500000&maxPrice=1000000
```
→ Xem sản phẩm từ 500,000đ đến 1,000,000đ

#### Lọc theo đánh giá:
```
GET /api/v1/products?minRating=4.0
```
→ Xem sản phẩm có đánh giá từ 4.0 sao trở lên

#### Kết hợp nhiều bộ lọc:
```
GET /api/v1/products?category=shirt&occasion=office&minPrice=500000&maxPrice=1000000
```
→ Tìm áo sơ mi văn phòng, giá từ 500k-1tr

#### Phân trang:
```
GET /api/v1/products?page=0&size=20
```
→ Trang đầu tiên, mỗi trang 20 sản phẩm

#### Sắp xếp:
```
GET /api/v1/products?sort=price,asc        → Giá tăng dần
GET /api/v1/products?sort=rating,desc       → Đánh giá cao nhất
GET /api/v1/products?sort=sold,desc        → Bán chạy nhất
GET /api/v1/products?sort=createdAt,desc   → Mới nhất
```

**Response mẫu**:
```json
{
  "content": [
    {
      "id": 1,
      "key": "ao-so-mi-truyen-thong",
      "name": "Áo Sơ Mi Truyền Thống",
      "image": "https://s3.../image.jpg",
      "price": 500000,
      "priceRange": "500,000 - 800,000",
      "category": "shirt",
      "occasion": "office",
      "tag": "bestseller",
      "rating": 4.5,
      "sold": 150,
      "isFavorite": false
    }
  ],
  "totalElements": 50,
  "totalPages": 3,
  "page": 0,
  "size": 20
}
```

**Giải thích các trường**:
- `id`: Mã số sản phẩm
- `key`: Mã định danh duy nhất (dùng trong URL)
- `name`: Tên sản phẩm
- `image`: Link ảnh chính
- `price`: Giá cố định (nếu có)
- `priceRange`: Khoảng giá (ví dụ: "500,000 - 800,000")
- `category`: Danh mục (shirt, pants, suit...)
- `occasion`: Dịp sử dụng (office, wedding, casual...)
- `tag`: Nhãn (bestseller, new, trending...)
- `rating`: Đánh giá trung bình (0-5 sao)
- `sold`: Số lượng đã bán
- `isFavorite`: `true` nếu bạn đã đăng nhập và đã thêm vào yêu thích

---

### 2. Xem chi tiết sản phẩm (Product Detail)

**Mục đích**: Xem đầy đủ thông tin về một sản phẩm cụ thể.

**API**: `GET /api/v1/products/{key}`

**Ai được dùng**: Tất cả mọi người

**Cách sử dụng**:
```
GET /api/v1/products/ao-so-mi-truyen-thong
```

**Response mẫu**:
```json
{
  "id": 1,
  "key": "ao-so-mi-truyen-thong",
  "name": "Áo Sơ Mi Truyền Thống",
  "slug": "ao-so-mi-truyen-thong",
  "description": "Áo sơ mi may đo theo số đo cá nhân, chất liệu cao cấp...",
  "tag": "bestseller",
  "price": 500000,
  "priceRange": "500,000 - 800,000",
  "image": "https://s3.../main.jpg",
  "gallery": [
    "https://s3.../gallery1.jpg",
    "https://s3.../gallery2.jpg",
    "https://s3.../gallery3.jpg"
  ],
  "occasion": "office",
  "category": "shirt",
  "budget": "medium",
  "type": "custom",
  "rating": 4.5,
  "reviewCount": 25,
  "sold": 150,
  "isFavorite": false,
  "relatedProducts": [
    {
      "id": 2,
      "key": "ao-so-mi-hien-dai",
      "name": "Áo Sơ Mi Hiện Đại",
      "image": "...",
      "price": 600000
    }
  ],
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

**Giải thích các trường**:
- `description`: Mô tả chi tiết sản phẩm
- `gallery`: Danh sách ảnh chi tiết (mảng)
- `budget`: Mức giá (low, medium, high)
- `type`: Loại (custom: may đo, ready-made: có sẵn)
- `reviewCount`: Số lượng đánh giá
- `relatedProducts`: Sản phẩm liên quan (cùng danh mục)
- `isFavorite`: `true` nếu bạn đã thêm vào yêu thích

---

### 3. Xem danh sách phong cách (Styles List)

**Mục đích**: Xem các phong cách thiết kế có sẵn (Classic, Modern, Casual...).

**API**: `GET /api/v1/styles`

**Ai được dùng**: Tất cả mọi người

**Cách sử dụng**:
```
GET /api/v1/styles
GET /api/v1/styles?category=formal
GET /api/v1/styles?keyword=classic
```

**Response mẫu**:
```json
{
  "content": [
    {
      "id": 1,
      "name": "Classic",
      "category": "formal",
      "image": "https://s3.../classic.jpg",
      "description": "Phong cách cổ điển, thanh lịch...",
      "price": 800000
    }
  ],
  "totalElements": 10
}
```

---

### 4. Xem chi tiết phong cách (Style Detail)

**API**: `GET /api/v1/styles/{id}`

**Ví dụ**:
```
GET /api/v1/styles/1
```

---

### 5. Quản lý Yêu thích (Favorites)

**Mục đích**: Lưu sản phẩm yêu thích để xem lại sau.

**Yêu cầu**: Phải đăng nhập với tài khoản CUSTOMER

#### 5.1. Xem danh sách yêu thích

**API**: `GET /api/v1/favorites`

**Cách sử dụng**:
```
GET /api/v1/favorites
GET /api/v1/favorites?page=0&size=20
```

**Response mẫu**:
```json
{
  "content": [
    {
      "id": 1,
      "productKey": "ao-so-mi-truyen-thong",
      "product": {
        "id": 1,
        "key": "ao-so-mi-truyen-thong",
        "name": "Áo Sơ Mi Truyền Thống",
        "image": "...",
        "price": 500000,
        "rating": 4.5
      },
      "addedAt": "2024-01-10T10:00:00Z"
    }
  ],
  "totalElements": 5
}
```

#### 5.2. Thêm vào yêu thích

**API**: `POST /api/v1/favorites`

**Body**:
```json
{
  "productKey": "ao-so-mi-truyen-thong"
}
```

**Response**:
```json
{
  "id": 1,
  "productKey": "ao-so-mi-truyen-thong",
  "product": {...},
  "addedAt": "2024-01-10T10:00:00Z"
}
```

**Lưu ý**: 
- Nếu sản phẩm đã có trong yêu thích → Lỗi: "Product already in favorites"
- Mỗi sản phẩm chỉ thêm được 1 lần

#### 5.3. Xóa khỏi yêu thích

**API**: `DELETE /api/v1/favorites/{productKey}`

**Ví dụ**:
```
DELETE /api/v1/favorites/ao-so-mi-truyen-thong
```

**Response**: 204 No Content (thành công)

#### 5.4. Kiểm tra sản phẩm có trong yêu thích

**API**: `GET /api/v1/favorites/check?productKey={key}`

**Ví dụ**:
```
GET /api/v1/favorites/check?productKey=ao-so-mi-truyen-thong
```

**Response**:
```json
{
  "isFavorite": true
}
```

---

## 🔐 Quyền truy cập

### Sản phẩm (Products)
- **Xem danh sách/chi tiết**: Tất cả mọi người (không cần đăng nhập)
- **Tạo/Sửa/Xóa**: Chỉ ADMIN và STAFF

### Phong cách (Styles)
- **Xem danh sách/chi tiết**: Tất cả mọi người
- **Tạo/Sửa/Xóa**: Chỉ ADMIN và STAFF

### Yêu thích (Favorites)
- **Tất cả chức năng**: Chỉ CUSTOMER (phải đăng nhập)

---

## 📝 Ví dụ sử dụng thực tế

### Tình huống 1: Khách hàng tìm áo sơ mi văn phòng

**Bước 1**: Xem danh sách áo sơ mi
```
GET /api/v1/products?category=shirt&occasion=office
```

**Bước 2**: Xem chi tiết sản phẩm yêu thích
```
GET /api/v1/products/ao-so-mi-truyen-thong
```

**Bước 3**: Thêm vào yêu thích (nếu muốn)
```
POST /api/v1/favorites
{
  "productKey": "ao-so-mi-truyen-thong"
}
```

### Tình huống 2: Tìm sản phẩm theo giá

**Bước 1**: Tìm sản phẩm giá từ 500k-1tr, đánh giá từ 4 sao
```
GET /api/v1/products?minPrice=500000&maxPrice=1000000&minRating=4.0
```

**Bước 2**: Sắp xếp theo giá tăng dần
```
GET /api/v1/products?minPrice=500000&maxPrice=1000000&sort=price,asc
```

### Tình huống 3: Xem lại sản phẩm yêu thích

**Bước 1**: Xem danh sách yêu thích
```
GET /api/v1/favorites
```

**Bước 2**: Xem chi tiết từng sản phẩm
```
GET /api/v1/products/{key}
```

**Bước 3**: Xóa khỏi yêu thích nếu không còn thích
```
DELETE /api/v1/favorites/{productKey}
```

---

## 🛠️ Quản trị (Admin/Staff)

### Tạo sản phẩm mới

**API**: `POST /api/v1/products`

**Body**:
```json
{
  "key": "ao-so-mi-truyen-thong",
  "name": "Áo Sơ Mi Truyền Thống",
  "slug": "ao-so-mi-truyen-thong",
  "description": "Áo sơ mi may đo...",
  "tag": "bestseller",
  "price": 500000,
  "priceRange": "500,000 - 800,000",
  "image": "https://s3.../image.jpg",
  "gallery": ["url1", "url2"],
  "occasion": "office",
  "category": "shirt",
  "budget": "medium",
  "type": "custom"
}
```

**Lưu ý**:
- `key`: Phải unique, chỉ chứa chữ thường, số, dấu gạch ngang
- `slug`: Tự động tạo từ `name` nếu không có
- `gallery`: Mảng các URL ảnh

### Sửa sản phẩm

**API**: `PUT /api/v1/products/{key}`

**Body**: Giống như tạo, tất cả trường optional (trừ `key` không được đổi)

### Xóa sản phẩm

**API**: `DELETE /api/v1/products/{key}`

**Lưu ý**: Xóa mềm (soft delete), sản phẩm vẫn còn trong database nhưng không hiển thị

---

## ⚠️ Lỗi thường gặp

### 1. Sản phẩm không tồn tại
```
GET /api/v1/products/khong-ton-tai
```
→ **Lỗi**: 404 Not Found - "Product not found"

### 2. Thêm yêu thích trùng
```
POST /api/v1/favorites
{
  "productKey": "ao-so-mi-truyen-thong"  // Đã có rồi
}
```
→ **Lỗi**: 400 Bad Request - "Product already in favorites"

### 3. Chưa đăng nhập khi thêm yêu thích
```
POST /api/v1/favorites  // Không có token
```
→ **Lỗi**: 401 Unauthorized

### 4. Không phải CUSTOMER
```
POST /api/v1/favorites  // Token của ADMIN/STAFF
```
→ **Lỗi**: 403 Forbidden

### 5. Key sản phẩm không hợp lệ
```
POST /api/v1/products
{
  "key": "Áo Sơ Mi"  // Có dấu, chữ hoa
}
```
→ **Lỗi**: 400 Bad Request - "Product key must contain only lowercase letters, numbers, and hyphens"

---

## 💡 Mẹo sử dụng

1. **Tìm kiếm hiệu quả**: Kết hợp nhiều filter để tìm chính xác sản phẩm cần
   ```
   ?category=shirt&occasion=office&minPrice=500000&maxPrice=1000000&minRating=4.0
   ```

2. **Xem sản phẩm liên quan**: Khi xem chi tiết, scroll xuống xem `relatedProducts` để tìm sản phẩm tương tự

3. **Quản lý yêu thích**: Thêm vào yêu thích những sản phẩm muốn xem lại sau, dễ dàng so sánh và quyết định

4. **Sắp xếp thông minh**: 
   - `sort=price,asc` → Tìm sản phẩm rẻ nhất
   - `sort=rating,desc` → Tìm sản phẩm được đánh giá cao nhất
   - `sort=sold,desc` → Tìm sản phẩm bán chạy nhất

5. **Phân trang**: Dùng `page` và `size` để xem nhiều sản phẩm, mặc định 20 sản phẩm/trang

---

## 📊 Các giá trị có thể dùng

### Category (Danh mục):
- `shirt` - Áo sơ mi
- `pants` - Quần
- `suit` - Vest/Complê
- `dress` - Váy
- `jacket` - Áo khoác

### Occasion (Dịp sử dụng):
- `office` - Văn phòng
- `wedding` - Đám cưới
- `casual` - Thường ngày
- `formal` - Trang trọng
- `party` - Tiệc

### Budget (Mức giá):
- `low` - Thấp
- `medium` - Trung bình
- `high` - Cao

### Tag (Nhãn):
- `bestseller` - Bán chạy
- `new` - Mới
- `trending` - Đang hot
- `sale` - Giảm giá

---

## 🔗 Liên kết nhanh

- **Xem tất cả sản phẩm**: `GET /api/v1/products`
- **Tìm kiếm**: `GET /api/v1/products?keyword={từ khóa}`
- **Xem yêu thích**: `GET /api/v1/favorites` (cần đăng nhập)
- **Xem phong cách**: `GET /api/v1/styles`

---

**Tài liệu này đi kèm với mã nguồn module Product/Catalog. Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.**


# Phân Tích Hệ Thống Mã Giảm Giá Shopee & Đề Xuất Cải Tiến

## 🔍 Cách Shopee Hoạt Động

### 1. Tự Động Đề Xuất Mã Giảm Giá

**Shopee có 3 cơ chế chính:**

#### a) Tự động đề xuất khi xem giỏ hàng
- Khi khách hàng vào giỏ hàng, Shopee tự động hiển thị các mã có thể dùng
- Hiển thị theo thứ tự ưu tiên: mã giảm nhiều nhất → mã dễ đạt điều kiện nhất
- Hiển thị số tiền sẽ được giảm ngay trên UI

#### b) Tự động apply mã tốt nhất
- Shopee có tính năng "Tự động chọn mã tốt nhất"
- Hệ thống tự động chọn mã giảm nhiều tiền nhất mà khách hàng đủ điều kiện
- Khách hàng không cần nhập mã, chỉ cần bật toggle

#### c) Đề xuất theo sản phẩm
- Mỗi sản phẩm có thể có mã riêng
- Khi xem sản phẩm, hiển thị "Có thể dùng mã XXX để giảm thêm Y%"
- Khi thêm vào giỏ, tự động đề xuất mã đó

### 2. Trừ Trực Tiếp Vào Sản Phẩm

**Shopee có 2 loại giảm giá:**

#### a) Product-level discount (Giảm giá sản phẩm)
- Giảm giá được tính trực tiếp vào giá sản phẩm
- Hiển thị: "Giá gốc: 500k → Giá sau giảm: 400k"
- Áp dụng ngay khi xem sản phẩm, không cần mã

#### b) Order-level discount (Giảm giá đơn hàng)
- Giảm giá được tính trên tổng đơn hàng
- Cần nhập mã hoặc tự động apply
- Trừ vào tổng tiền cuối cùng

### 3. Cơ Chế Ưu Tiên

Shopee áp dụng theo thứ tự:
1. **Product discount** (giảm giá sản phẩm) - áp dụng trước
2. **Order discount** (mã giảm giá đơn hàng) - áp dụng sau
3. **Shipping discount** (giảm phí ship) - áp dụng cuối

---

## 📊 So Sánh Với Module Hiện Tại

### ✅ Đã Có:
- Order-level discount (giảm giá đơn hàng)
- Validate điều kiện (min order value, products, categories)
- Usage limits (per user, total)
- Public/Private codes

### ❌ Chưa Có:
- **Tự động đề xuất mã** dựa trên giỏ hàng
- **Product-level discount** (giảm trực tiếp vào sản phẩm)
- **Tự động apply mã tốt nhất**
- **Hiển thị mã có thể dùng** trong giỏ hàng
- **Tính toán discount cho nhiều mã** để chọn mã tốt nhất

---

## 🚀 Đề Xuất Cải Tiến

### 1. Thêm Product-Level Discount

**Cách hoạt động:**
- Promotion có thể gắn trực tiếp vào sản phẩm
- Khi xem sản phẩm, tự động hiển thị giá đã giảm
- Không cần nhập mã, tự động áp dụng

**Implementation:**
- Thêm field `isProductLevel` vào `PromotionEntity`
- Khi list products, join với promotions để tính giá đã giảm
- Hiển thị: "Giá gốc: 500k → Giá khuyến mãi: 400k"

### 2. API Tự Động Đề Xuất Mã

**Endpoint mới:** `GET /api/v1/promotions/suggestions`

**Input:**
- `orderAmount`: Tổng tiền giỏ hàng
- `productIds`: Danh sách ID sản phẩm
- `categoryIds`: Danh sách category

**Output:**
- Danh sách mã có thể dùng, sắp xếp theo discount amount (giảm nhiều nhất trước)
- Mỗi mã hiển thị: code, name, discountAmount, finalAmount

### 3. API Tự Động Apply Mã Tốt Nhất

**Endpoint mới:** `POST /api/v1/promotions/auto-apply`

**Input:** Giống như suggestions
**Output:** Mã được chọn tự động và discount amount

**Logic:**
- Tìm tất cả mã đủ điều kiện
- Tính discount cho từng mã
- Chọn mã giảm nhiều tiền nhất
- Validate usage limits
- Return mã tốt nhất

### 4. Cải Tiến Apply Promo Code

**Hiện tại:** Chỉ apply 1 mã
**Cải tiến:** Hỗ trợ apply nhiều mã (nếu cho phép)

**Logic:**
- Một số mã có thể combine với mã khác
- Thêm field `canCombineWithOthers` vào `PromotionEntity`
- Tính tổng discount từ nhiều mã

### 5. Hiển Thị Mã Trong Giỏ Hàng

**Endpoint:** `GET /api/v1/promotions/available-for-cart`

**Input:**
- `orderAmount`
- `productIds`
- `categoryIds`
- `userId` (optional)

**Output:**
- Danh sách mã có thể dùng
- Mỗi mã có: code, name, discountAmount, message
- Sắp xếp theo priority và discount amount

---

## 💡 Ví Dụ Sử Dụng

### Tình huống 1: Khách hàng xem giỏ hàng

**Bước 1:** Frontend gọi
```
GET /api/v1/promotions/available-for-cart?orderAmount=600000&productIds=1,2,3
```

**Response:**
```json
{
  "content": [
    {
      "code": "GIAM20",
      "name": "Giảm 20%",
      "discountAmount": 100000,
      "finalAmount": 500000,
      "message": "Bạn có thể giảm thêm 100,000đ",
      "isEligible": true
    },
    {
      "code": "GIAM50K",
      "name": "Giảm 50k",
      "discountAmount": 50000,
      "finalAmount": 550000,
      "message": "Bạn có thể giảm thêm 50,000đ",
      "isEligible": true
    }
  ]
}
```

**Bước 2:** Frontend hiển thị danh sách mã, khách hàng chọn

**Bước 3:** Hoặc khách hàng bật "Tự động chọn mã tốt nhất"

**Bước 4:** Frontend gọi
```
POST /api/v1/promotions/auto-apply
{
  "orderAmount": 600000,
  "productIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "promotionId": 1,
  "code": "GIAM20",
  "discountAmount": 100000,
  "finalAmount": 500000,
  "message": "Đã tự động áp dụng mã GIAM20, giảm 100,000đ"
}
```

### Tình huống 2: Product-level discount

**Khi xem sản phẩm:**
```
GET /api/v1/products/ao-so-mi-truyen-thong
```

**Response có thêm:**
```json
{
  "id": 1,
  "name": "Áo Sơ Mi",
  "originalPrice": 500000,
  "discountedPrice": 400000,
  "discount": {
    "promotionId": 5,
    "code": "SHIRT_SALE",
    "discountAmount": 100000,
    "discountPercentage": 20
  }
}
```

---

## 🔧 Implementation Plan

### Phase 1: Product-Level Discount
1. Thêm field `isProductLevel` vào `PromotionEntity`
2. Thêm field `productDiscount` vào `ProductResponse`
3. Modify `ProductService` để join với promotions
4. Tính giá đã giảm khi list/detail product

### Phase 2: Auto Suggest
1. Tạo endpoint `GET /api/v1/promotions/suggestions`
2. Tạo endpoint `GET /api/v1/promotions/available-for-cart`
3. Logic tìm mã đủ điều kiện và tính discount
4. Sắp xếp theo discount amount

### Phase 3: Auto Apply
1. Tạo endpoint `POST /api/v1/promotions/auto-apply`
2. Logic chọn mã tốt nhất
3. Validate và return

### Phase 4: Multiple Promotions
1. Thêm field `canCombineWithOthers` vào `PromotionEntity`
2. Modify logic apply để hỗ trợ nhiều mã
3. Tính tổng discount

---

## 📝 Kết Luận

### ✅ Đã Implement

**Module hiện tại đã có đầy đủ các tính năng chính:**

1. ✅ **Auto suggest** - Tự động đề xuất mã
   - API: `GET /api/v1/promotions/suggestions`
   - API: `GET /api/v1/promotions/available-for-cart`
   - Tự động tìm mã đủ điều kiện dựa trên giỏ hàng
   - Sắp xếp theo discount amount (giảm nhiều nhất trước)

2. ✅ **Auto apply** - Tự động chọn mã tốt nhất
   - API: `POST /api/v1/promotions/auto-apply`
   - Tự động chọn mã giảm nhiều tiền nhất
   - Validate usage limits trước khi apply

3. ✅ **Cart integration** - Hiển thị mã trong giỏ hàng
   - API `available-for-cart` trả về mã có thể dùng cho giỏ hàng hiện tại
   - Hiển thị rõ số tiền sẽ được giảm
   - Chỉ hiển thị mã đủ điều kiện (`isEligible = true`)

### 🔄 Chưa Implement (Có thể bổ sung sau)

1. ⏳ **Product-level discount** - Giảm trực tiếp vào sản phẩm
   - Cần thêm field `isProductLevel` vào `PromotionEntity`
   - Cần modify `ProductService` để join với promotions
   - Tính giá đã giảm khi list/detail product
   - **Ưu tiên thấp** - Có thể làm sau

### 🎯 Trạng Thái Hiện Tại

**Hệ thống đã có đầy đủ tính năng cốt lõi giống Shopee:**
- ✅ Customer có thể xem danh sách mã đang active
- ✅ Tự động đề xuất mã khi vào giỏ hàng
- ✅ Tự động apply mã tốt nhất
- ✅ Nhập mã thủ công
- ✅ Validate đầy đủ (dates, limits, conditions)
- ✅ Theo dõi usage history

**Những tính năng này đã làm cho hệ thống giống Shopee và trải nghiệm người dùng tốt hơn!**

### 📋 Next Steps (Optional)

Nếu muốn bổ sung Product-level discount:

    1. **Database**: Thêm field `is_product_level` vào bảng `promotions`
    2. **Entity**: Thêm field `isProductLevel` vào `PromotionEntity`
    3. **Service**: Modify `ProductService` để:
    - Join với `promotions` khi list/detail product
    - Tính `discountedPrice` nếu có promotion active
    - Return `originalPrice` và `discountedPrice` trong response
    4. **DTO**: Thêm fields vào `ProductResponse`:
    ```java
    private BigDecimal originalPrice;
    private BigDecimal discountedPrice;
    private PromotionInfo discount; // promotion info if any
    ```

**Lưu ý**: Product-level discount là tính năng bổ sung, không bắt buộc. Hệ thống hiện tại đã đủ để sử dụng như Shopee.


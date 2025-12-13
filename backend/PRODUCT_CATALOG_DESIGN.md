# 🎨 Product/Catalog Module - Thiết Kế Chi Tiết (Chuẩn Product & Thực Tế)

## 📋 Tổng Quan

Module Product/Catalog quản lý:
- **Products**: Sản phẩm may (áo sơ mi, quần âu, vest, v.v.)
- **Styles**: Phong cách thiết kế (classic, modern, casual, v.v.)
- **Favorites**: Yêu thích của khách hàng

**Mục tiêu**: Cung cấp catalog dễ tìm kiếm, filter, và quản lý yêu thích cho khách hàng.

---

## 🧩 Domain Model

### 1. Product Entity

```sql
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,        -- Unique identifier (e.g., "ao-so-mi-truyen-thong")
    name VARCHAR(200) NOT NULL,                -- Tên sản phẩm (e.g., "Áo Sơ Mi Truyền Thống")
    slug VARCHAR(200),                         -- URL-friendly (e.g., "ao-so-mi-truyen-thong")
    description TEXT,                          -- Mô tả chi tiết
    tag VARCHAR(100),                          -- Tags (e.g., "bestseller", "new", "trending")
    price DECIMAL(14,2),                       -- Giá cố định (nếu có)
    price_range VARCHAR(100),                  -- Khoảng giá (e.g., "500,000 - 1,000,000")
    image VARCHAR(500),                        -- Ảnh chính
    gallery JSON,                              -- Mảng ảnh chi tiết ["url1", "url2"]
    occasion VARCHAR(80),                       -- Dịp sử dụng (e.g., "wedding", "office", "casual")
    category VARCHAR(80),                       -- Danh mục (e.g., "shirt", "pants", "suit")
    budget VARCHAR(50),                        -- Budget range (e.g., "low", "medium", "high")
    type VARCHAR(50),                          -- Loại (e.g., "custom", "ready-made")
    rating DECIMAL(3,2),                       -- Đánh giá trung bình (0.00 - 5.00)
    sold INT DEFAULT 0,                        -- Số lượng đã bán
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_slug (slug),
    INDEX idx_product_category (category),
    INDEX idx_product_occasion (occasion),
    INDEX idx_product_tag (tag),
    INDEX idx_product_rating (rating),
    INDEX idx_product_sold (sold)
);
```

**Quan hệ**:
- `products` 1..N `favorites` (via `product_key`)
- `products` 1..N `reviews` (future)
- `products` 1..N `order_items` (via product reference)

### 2. Style Entity

```sql
CREATE TABLE styles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,                -- Tên style (e.g., "Classic", "Modern", "Casual")
    category VARCHAR(80),                      -- Danh mục style
    image VARCHAR(500),                        -- Ảnh đại diện
    description TEXT,                          -- Mô tả style
    price DECIMAL(14,2),                       -- Giá tham khảo
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_style_category (category)
);
```

**Quan hệ**:
- Style là độc lập, có thể được reference trong products (future: `product.style_id`)

### 3. Favorite Entity

```sql
CREATE TABLE favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,               -- User (CUSTOMER role)
    product_key VARCHAR(100) NOT NULL,          -- Reference to products.key
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fav_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_fav_product FOREIGN KEY (product_key) REFERENCES products(`key`),
    UNIQUE (customer_id, product_key),          -- Mỗi customer chỉ favorite 1 lần
    INDEX idx_fav_customer (customer_id),
    INDEX idx_fav_product (product_key)
);
```

**Quan hệ**:
- `favorites` N..1 `users` (customer)
- `favorites` N..1 `products` (via `product_key`)

---

## 📦 API Contract

### Products API

#### 1. Products List (Catalog Page)

```
GET /api/v1/products
Query Parameters:
  - page: int (default: 0)
  - size: int (default: 20, max: 100)
  - sort: string (default: "createdAt,desc")
    Options: "createdAt,desc", "price,asc", "rating,desc", "sold,desc", "name,asc"
  - category: string (e.g., "shirt", "pants", "suit")
  - occasion: string (e.g., "wedding", "office", "casual")
  - budget: string (e.g., "low", "medium", "high")
  - tag: string (e.g., "bestseller", "new", "trending")
  - keyword: string (search in name, description)
  - minPrice: decimal (optional)
  - maxPrice: decimal (optional)
  - minRating: decimal (optional, 0-5)

Response: Page<ProductListItemResponse>
{
  "content": [
    {
      "id": 1,
      "key": "ao-so-mi-truyen-thong",
      "name": "Áo Sơ Mi Truyền Thống",
      "slug": "ao-so-mi-truyen-thong",
      "image": "https://s3.../image.jpg",
      "price": 500000,
      "priceRange": "500,000 - 800,000",
      "category": "shirt",
      "occasion": "office",
      "tag": "bestseller",
      "rating": 4.5,
      "sold": 150,
      "isFavorite": false  // true nếu user đã login và đã favorite
    }
  ],
  "totalElements": 50,
  "totalPages": 3,
  "page": 0,
  "size": 20
}
```

**Business Rules**:
- Chỉ hiển thị products có `is_deleted = false`
- Sort mặc định: mới nhất trước
- Filter có thể kết hợp nhiều điều kiện (AND logic)
- `isFavorite`: chỉ hiển thị nếu user đã login (từ `@AuthenticationPrincipal`)

#### 2. Product Detail

```
GET /api/v1/products/{key}
Path Variable:
  - key: string (product key, e.g., "ao-so-mi-truyen-thong")

Response: ProductDetailResponse
{
  "id": 1,
  "key": "ao-so-mi-truyen-thong",
  "name": "Áo Sơ Mi Truyền Thống",
  "slug": "ao-so-mi-truyen-thong",
  "description": "Áo sơ mi may đo theo số đo cá nhân...",
  "tag": "bestseller",
  "price": 500000,
  "priceRange": "500,000 - 800,000",
  "image": "https://s3.../main.jpg",
  "gallery": [
    "https://s3.../gallery1.jpg",
    "https://s3.../gallery2.jpg"
  ],
  "occasion": "office",
  "category": "shirt",
  "budget": "medium",
  "type": "custom",
  "rating": 4.5,
  "reviewCount": 25,  // Số lượng reviews (future)
  "sold": 150,
  "isFavorite": false,
  "relatedProducts": [  // Sản phẩm cùng category/occasion
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

**Business Rules**:
- Nếu product không tồn tại hoặc `is_deleted = true` → 404
- `relatedProducts`: Lấy 4-6 sản phẩm cùng category hoặc occasion (random)
- `isFavorite`: Check từ favorites table nếu user đã login

#### 3. Create Product (Admin/Staff only)

```
POST /api/v1/products
Authorization: Bearer {token} (ADMIN/STAFF)
Body: CreateProductRequest
{
  "key": "ao-so-mi-truyen-thong",  // Required, unique
  "name": "Áo Sơ Mi Truyền Thống",  // Required
  "slug": "ao-so-mi-truyen-thong",  // Optional, auto-generate from name if empty
  "description": "...",
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

Response: ProductDetailResponse (201 Created)
```

**Validation**:
- `key`: Required, unique, alphanumeric + hyphens, max 100 chars
- `name`: Required, max 200 chars
- `slug`: Auto-generate từ `name` nếu empty (lowercase, replace spaces with hyphens)
- `price`: Optional, >= 0
- `category`, `occasion`, `budget`, `type`: Enum values (validate)

#### 4. Update Product (Admin/Staff only)

```
PUT /api/v1/products/{key}
Authorization: Bearer {token} (ADMIN/STAFF)
Body: UpdateProductRequest (same as CreateProductRequest, all fields optional)

Response: ProductDetailResponse (200 OK)
```

**Business Rules**:
- Không cho phép update `key` (immutable)
- `slug` có thể update, nhưng phải unique

#### 5. Delete Product (Admin/Staff only)

```
DELETE /api/v1/products/{key}
Authorization: Bearer {token} (ADMIN/STAFF)

Response: 204 No Content
```

**Business Rules**:
- Soft delete: Set `is_deleted = true`
- Không xóa nếu có orders đang reference product này (check `order_items`)

---

### Styles API

#### 1. Styles List

```
GET /api/v1/styles
Query Parameters:
  - page: int (default: 0)
  - size: int (default: 20)
  - category: string (optional)
  - keyword: string (search in name, description)

Response: Page<StyleResponse>
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
  "totalElements": 10,
  "totalPages": 1
}
```

**Business Rules**:
- Chỉ hiển thị styles có `is_deleted = false`
- Public endpoint (không cần auth)

#### 2. Style Detail

```
GET /api/v1/styles/{id}

Response: StyleResponse
{
  "id": 1,
  "name": "Classic",
  "category": "formal",
  "image": "https://s3.../classic.jpg",
  "description": "...",
  "price": 800000,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

#### 3. Create/Update/Delete Style (Admin/Staff only)

```
POST   /api/v1/styles        (Create)
PUT    /api/v1/styles/{id}    (Update)
DELETE /api/v1/styles/{id}    (Soft delete)
```

---

### Favorites API

#### 1. Get User Favorites

```
GET /api/v1/favorites
Authorization: Bearer {token} (CUSTOMER)
Query Parameters:
  - page: int (default: 0)
  - size: int (default: 20)

Response: Page<FavoriteProductResponse>
{
  "content": [
    {
      "id": 1,
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

**Business Rules**:
- Chỉ CUSTOMER mới có quyền xem favorites
- Tự động lấy `customerId` từ JWT token
- Chỉ hiển thị products còn active (`is_deleted = false`)

#### 2. Add to Favorites

```
POST /api/v1/favorites
Authorization: Bearer {token} (CUSTOMER)
Body: AddFavoriteRequest
{
  "productKey": "ao-so-mi-truyen-thong"
}

Response: FavoriteResponse (201 Created)
{
  "id": 1,
  "productKey": "ao-so-mi-truyen-thong",
  "addedAt": "2024-01-10T10:00:00Z"
}
```

**Business Rules**:
- Validate product tồn tại và `is_deleted = false`
- Nếu đã favorite rồi → 400 BadRequest ("Product already in favorites")
- Tự động lấy `customerId` từ JWT token

#### 3. Remove from Favorites

```
DELETE /api/v1/favorites/{productKey}
Authorization: Bearer {token} (CUSTOMER)
Path Variable:
  - productKey: string

Response: 204 No Content
```

**Business Rules**:
- Validate favorite tồn tại và thuộc về customer hiện tại
- Nếu không tồn tại → 404 NotFound

#### 4. Check if Product is Favorite

```
GET /api/v1/favorites/check?productKey={key}
Authorization: Bearer {token} (CUSTOMER)

Response: { "isFavorite": true/false }
```

---

## 🔒 Security & RBAC

### Products
- **List/Detail**: Public (không cần auth)
- **Create/Update/Delete**: ADMIN, STAFF only
- **Filter by favorites**: Cần auth để hiển thị `isFavorite`

### Styles
- **List/Detail**: Public
- **Create/Update/Delete**: ADMIN, STAFF only

### Favorites
- **All endpoints**: CUSTOMER only
- Tự động lấy `customerId` từ JWT token (không cho phép favorite cho user khác)

---

## ✅ Validation & Business Rules

### Products
1. **Key uniqueness**: `key` phải unique trong hệ thống
2. **Slug generation**: Auto-generate từ `name` nếu không có
3. **Price validation**: `price >= 0` hoặc `priceRange` hợp lệ
4. **Image validation**: URL hợp lệ hoặc S3 path
5. **Gallery**: Mảng JSON, mỗi item là URL
6. **Soft delete**: Không xóa nếu có orders reference

### Styles
1. **Name uniqueness**: `name` nên unique trong cùng category
2. **Price validation**: `price >= 0`

### Favorites
1. **Unique constraint**: Mỗi customer chỉ favorite 1 product 1 lần
2. **Product existence**: Product phải tồn tại và active
3. **Customer ownership**: Chỉ xem/xóa favorites của chính mình

---

## 🚀 Performance Optimizations

### 1. Caching Strategy
- **Products List**: Cache 5-15 phút (Redis)
  - Key: `products:list:{category}:{occasion}:{page}:{size}`
  - Invalidate khi có product mới/cập nhật
- **Product Detail**: Cache 1 giờ
  - Key: `product:detail:{key}`
  - Invalidate khi product được update
- **Styles List**: Cache 1 giờ (ít thay đổi)

### 2. Query Optimization
- **Indexes**: 
  - `category`, `occasion`, `tag`, `rating`, `sold` (cho filter)
  - `slug` (cho lookup)
  - Composite index: `(category, occasion, is_deleted)` cho list query
- **Pagination**: Luôn dùng pagination, default 20 items
- **N+1 Prevention**: 
  - Eager fetch `gallery` (JSON field, không cần JOIN)
  - Batch load favorites cho list (nếu user đã login)

### 3. Search Optimization
- **Keyword search**: 
  - Full-text search trên `name`, `description` (MySQL FULLTEXT index)
  - Hoặc dùng Elasticsearch cho search phức tạp (future)
- **Filter combination**: Sử dụng `@Query` với dynamic WHERE clauses

---

## 📊 Real-World Best Practices

### 1. SEO-Friendly URLs
- Sử dụng `slug` thay vì `id` trong URL: `/products/ao-so-mi-truyen-thong`
- `slug` tự động generate từ `name` (lowercase, hyphens)
- Redirect từ old slug nếu slug được update

### 2. Image Management
- Store images trên S3
- Multiple sizes: thumbnail, medium, large
- Lazy loading cho gallery images
- CDN (CloudFront) cho image delivery

### 3. Product Variations (Future)
- Có thể mở rộng: `product_variants` table (size, color, fabric)
- Hiện tại: `price_range` để handle variations

### 4. Analytics Tracking
- Track product views (detail page)
- Track favorite actions (add/remove)
- Track search keywords
- Track filter usage

### 5. Recommendation Engine (Future)
- "Related Products": Dựa trên category, occasion, hoặc collaborative filtering
- "You may also like": Dựa trên favorites của user tương tự

---

## 🧪 Test Cases

### Products
1. **List**: Filter by category, occasion, budget → Success
2. **List**: Sort by price, rating, sold → Success
3. **List**: Search keyword → Success
4. **Detail**: Valid key → Success
5. **Detail**: Invalid key → 404
6. **Create**: Valid data → 201 Created
7. **Create**: Duplicate key → 400 BadRequest
8. **Update**: Valid data → 200 OK
9. **Delete**: Product with orders → 400 BadRequest (cannot delete)

### Favorites
1. **Add**: Valid product → 201 Created
2. **Add**: Duplicate → 400 BadRequest
3. **Add**: Invalid product → 404 NotFound
4. **List**: Customer favorites → Success
5. **List**: Other customer → 403 Forbidden (nếu có endpoint này)
6. **Remove**: Valid favorite → 204 No Content
7. **Remove**: Not found → 404 NotFound

---

## 📝 Implementation Checklist

- [ ] **Entity**: ProductEntity, StyleEntity, FavoriteEntity
- [ ] **Repository**: 
  - ProductRepository với custom queries (filter, search)
  - StyleRepository
  - FavoriteRepository
- [ ] **DTO**: 
  - ProductRequest/Response, ProductListItemResponse, ProductDetailResponse
  - StyleRequest/Response
  - FavoriteRequest/Response, AddFavoriteRequest
- [ ] **Service**: 
  - ProductService (list, detail, create, update, delete, search)
  - StyleService (list, detail, CRUD)
  - FavoriteService (list, add, remove, check)
- [ ] **Controller**: 
  - ProductController (RESTful endpoints)
  - StyleController
  - FavoriteController
- [ ] **Validation**: Jakarta Validation annotations
- [ ] **Security**: @PreAuthorize cho admin/staff endpoints
- [ ] **Caching**: Redis cache cho products list/detail
- [ ] **Indexes**: Database indexes cho performance
- [ ] **Tests**: Unit tests cho services, Postman collection

---

## 🎯 Priority Implementation Order

1. **Products List & Detail** (Core functionality)
2. **Favorites** (User engagement)
3. **Styles List** (Supporting feature)
4. **Product CRUD** (Admin functionality)
5. **Search & Advanced Filters** (Enhancement)
6. **Caching** (Performance)

---

**Tóm tắt**: Module Product/Catalog cần thiết kế với focus vào **user experience** (dễ tìm, filter, favorite) và **performance** (caching, indexes, pagination). Public endpoints cho browsing, protected endpoints cho favorites và admin management.


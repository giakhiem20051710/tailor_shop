# 📸 Hiện tại ảnh đang lấy từ đâu?

## 🗄️ Database Structure

### Bảng `products` (V1__init.sql - line 91-112)
```sql
CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200),
  description TEXT,
  price DECIMAL(14,2),
  image VARCHAR(500),           -- ⚠️ CHỈ LƯU 1 ẢNH
  gallery JSON,                 -- ✅ LƯU NHIỀU ẢNH (JSON array)
  category VARCHAR(80),
  ...
);
```

### Bảng `image_assets` (V16__create_image_assets_table.sql)
```sql
CREATE TABLE image_assets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  s3_key VARCHAR(255) NOT NULL,
  url VARCHAR(500) NULL,        -- ✅ S3 URL
  thumbnail_url VARCHAR(500),   -- ✅ Thumbnail
  large_url VARCHAR(500),       -- ✅ Large version
  category VARCHAR(50),         -- template, fabric, style
  type VARCHAR(50),             -- ao_dai, vest, dam, ...
  gender VARCHAR(10),
  tags JSON,
  product_template_id BIGINT,   -- ✅ Link tới product_templates
  fabric_id BIGINT,
  style_id BIGINT,
  ...
);
```

## 🔄 Flow hiện tại (AFTER UPDATE)

### 1. Load Data
```javascript
loadBackendData() {
  // Step 1: Load products từ /api/v1/products
  const products = await productService.list()
  setBackendProductsList(products)
  
  // Step 2: Load image_assets làm fallback
  const images = await imageAssetService.filter()
  setImageAssets(images)
}
```

### 2. Map Products với Images
```javascript
mappedBackendProducts = products.map(product => {
  let imageUrl = null;
  
  // Priority 1: product.media[0].url (nếu có)
  if (product.media && product.media.length > 0) {
    imageUrl = product.media[0].url;
  }
  
  // Priority 2: product.imageUrl hoặc product.image
  if (!imageUrl) {
    imageUrl = product.imageUrl || product.image;
  }
  
  // Priority 3: Tìm trong image_assets
  if (!imageUrl) {
    const matchingImage = imageAssets.find(img =>
      img.productTemplateId === product.templateId
    );
    imageUrl = matchingImage?.url;
  }
  
  // Priority 4: Fallback SVG
  if (!imageUrl) {
    imageUrl = FALLBACK_PRODUCT_IMAGE;
  }
  
  return { ...product, image: imageUrl };
});
```

## 📊 Hiện tại ảnh lấy từ đâu?

### ✅ Sau khi update (ProductsPage.jsx)

| Priority | Source | Field | Table |
|----------|--------|-------|-------|
| 1️⃣ | Products API | `product.media[0].url` | `products.gallery` (JSON) |
| 2️⃣ | Products API | `product.imageUrl` hoặc `product.image` | `products.image` |
| 3️⃣ | Image Assets | `imageAssets.find(...).url` | `image_assets.url` |
| 4️⃣ | Fallback | SVG placeholder | - |

### 🔍 Kiểm tra trong Console

Khi mở trang Products, check console logs:

```
✅ Loaded products from /api/v1/products: 10
✅ Loaded image assets for fallback: 50
📦 Using products from /api/v1/products: 10
```

## 📝 Relationship Diagram

```
┌─────────────────┐
│   products      │
│  (main table)   │
│                 │
│  - id           │
│  - name         │
│  - image  ──────┼──> VARCHAR(500) - Single image URL
│  - gallery ─────┼──> JSON - Array of image URLs
│  - category     │
└─────────────────┘
         │
         │ (Optional FK)
         ▼
┌─────────────────┐
│ image_assets    │
│ (metadata)      │
│                 │
│  - id           │
│  - url ─────────┼──> S3 URL (main)
│  - thumbnail_url│
│  - large_url    │
│  - s3_key       │
│  - category     │
│  - type         │
│  - product_     │
│    template_id  │
└─────────────────┘
```

## 🎯 Kết luận

**Hiện tại (sau update):**
- ✅ **Ưu tiên:** Lấy từ bảng `products` (field `gallery` hoặc `image`)
- ✅ **Fallback:** Lấy từ bảng `image_assets` (field `url`)
- ✅ **Last resort:** SVG placeholder

**Trước update:**
- ❌ Chỉ lấy từ `image_assets`
- ❌ Không hiển thị products thực từ database

## 🧪 Test để verify

```sql
-- Check products có ảnh
SELECT id, name, image, gallery FROM products LIMIT 5;

-- Check image_assets
SELECT id, url, category, type FROM image_assets LIMIT 5;

-- Check relationship
SELECT 
  p.id, 
  p.name, 
  p.image as product_image,
  ia.url as image_asset_url
FROM products p
LEFT JOIN image_assets ia ON ia.product_template_id = p.id
LIMIT 10;
```

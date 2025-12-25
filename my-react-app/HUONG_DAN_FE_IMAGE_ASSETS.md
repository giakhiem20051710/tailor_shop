# Hướng Dẫn Sử Dụng Image Assets API Trên Frontend

## ✅ Đã Hoàn Thành

### 1. API Configuration
- ✅ Thêm endpoints vào `apiConfig.js`
- ✅ Tạo `imageAssetService.js` với đầy đủ methods

### 2. Pages & Components
- ✅ Tạo `ImageUploadPage.jsx` - Trang upload và quản lý ảnh
- ✅ Thêm route `/images` vào `App.jsx`
- ✅ Tích hợp vào `CustomizeProductPage.jsx` (optional - load thêm ảnh từ image assets)

---

## 📋 API Endpoints Đã Tích Hợp

### 1. Upload Ảnh và Tự Động Phân Loại
```javascript
import { imageAssetService } from '../services/index.js';

// Upload ảnh với tự động phân loại
const response = await imageAssetService.upload(file, {
  description: "Áo sơ mi nam màu trắng", // optional
  category: "template", // optional - sẽ tự động detect
  type: "ao_so_mi", // optional - sẽ tự động detect
  gender: "male" // optional - sẽ tự động detect
});

const data = imageAssetService.parseResponse(response);
console.log(data); // { id, s3Key, url, category, type, gender, tags, ... }
```

### 2. Tạo Image Asset Thủ Công
```javascript
const response = await imageAssetService.create({
  s3Key: "templates/ao_so_mi/male/ao-so-mi-1.jpg",
  url: "https://s3.../ao-so-mi-1.jpg",
  category: "template",
  type: "ao_so_mi",
  gender: "male",
  tags: ["casual", "white"],
  productTemplateId: 1 // optional
});
```

### 3. Filter Ảnh
```javascript
// Filter theo category, type, gender
const response = await imageAssetService.filter({
  category: "template",
  type: "ao_so_mi",
  gender: "male",
  page: 0,
  size: 20
});

const data = imageAssetService.parseResponse(response);
// data.content = array of images
// data.totalElements = tổng số ảnh
// data.totalPages = tổng số trang
```

### 4. Lấy Ảnh Theo Category
```javascript
const response = await imageAssetService.getByCategory("template", {
  page: 0,
  size: 20
});
```

### 5. Lấy Ảnh Theo Template ID
```javascript
const response = await imageAssetService.getByTemplateId(templateId);
const images = imageAssetService.parseResponse(response); // Array of images
```

---

## 🎯 Cách Sử Dụng

### Trang Upload Ảnh (`/images`)

1. **Truy cập:** `http://localhost:5173/images`
2. **Upload ảnh:**
   - Click "Chọn ảnh để upload"
   - Nhập mô tả (optional) - hệ thống sẽ tự động phân loại
   - Hệ thống tự động detect category, type, gender, tags
3. **Filter ảnh:**
   - Chọn category (template/fabric/style)
   - Nhập type (ao_so_mi, quan_tay...)
   - Chọn gender (male/female/unisex)
4. **Xem kết quả:** Grid hiển thị ảnh với metadata

### Tích Hợp Vào CustomizeProductPage

`CustomizeProductPage` đã được cập nhật để:
- Load thêm ảnh từ image assets cho mỗi template (optional)
- Hiển thị ảnh từ `templateImages` state nếu có

---

## 📝 Ví Dụ Code

### Component Upload Ảnh Đơn Giản

```jsx
import { useState } from 'react';
import { imageAssetService } from '../services/index.js';

function SimpleImageUpload() {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await imageAssetService.upload(file, {
        description: "Áo sơ mi nam màu trắng"
      });
      
      const data = imageAssetService.parseResponse(response);
      alert(`✅ Upload thành công!\nCategory: ${data.category}\nType: ${data.type}`);
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleUpload}
      disabled={uploading}
    />
  );
}
```

### Component Hiển Thị Ảnh Theo Filter

```jsx
import { useState, useEffect } from 'react';
import { imageAssetService } from '../services/index.js';
import OptimizedImage from './OptimizedImage.jsx';

function FilteredImages({ category, type, gender }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadImages();
  }, [category, type, gender]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await imageAssetService.filter({
        category,
        type,
        gender,
        page: 0,
        size: 20
      });
      
      const data = imageAssetService.parseResponse(response);
      setImages(data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      {images.map((image) => (
        <div key={image.id}>
          <OptimizedImage src={image.url || image.s3Key} alt={image.s3Key} />
          <div className="text-sm">
            <div>Category: {image.category}</div>
            <div>Type: {image.type}</div>
            <div>Gender: {image.gender}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 Xử Lý Response

Backend trả về `CommonResponse<T>` với structure:
```json
{
  "requestTrace": "...",
  "responseDateTime": "2024-...",
  "responseStatus": { ... },
  "responseData": <actual data>
}
```

**Service đã có method `parseResponse()` để tự động xử lý:**

```javascript
const response = await imageAssetService.getAll();
const data = imageAssetService.parseResponse(response);
// data sẽ là actual data (không có wrapper CommonResponse)
```

---

## 🎨 UI Components

### ImageUploadPage
- ✅ Upload form với progress
- ✅ Filter section (category, type, gender)
- ✅ Grid hiển thị ảnh
- ✅ Pagination
- ✅ Error handling

### CustomizeProductPage
- ✅ Load thêm ảnh từ image assets (optional)
- ✅ Hiển thị ảnh từ `templateImages` state

---

## 🚀 Next Steps

1. **Test API:**
   - Upload ảnh qua `/images`
   - Kiểm tra phân loại tự động
   - Test filter/search

2. **Tích hợp vào các trang khác:**
   - ProductsPage: Hiển thị ảnh từ image assets
   - FabricDetailPage: Hiển thị ảnh vải từ image assets
   - StyleListPage: Hiển thị ảnh style từ image assets

3. **Enhancement:**
   - Bulk upload nhiều ảnh cùng lúc
   - Drag & drop upload
   - Image preview modal
   - Edit metadata

---

## 📚 Files Đã Tạo/Cập Nhật

1. ✅ `services/api/apiConfig.js` - Thêm IMAGE_ASSET endpoints
2. ✅ `services/imageAssetService.js` - Service mới
3. ✅ `services/index.js` - Export imageAssetService
4. ✅ `pages/ImageUploadPage.jsx` - Trang upload và quản lý
5. ✅ `App.jsx` - Thêm route `/images`
6. ✅ `pages/CustomizeProductPage.jsx` - Tích hợp load ảnh từ image assets

---

## ✅ Checklist

- [x] API endpoints configuration
- [x] ImageAssetService với đầy đủ methods
- [x] ImageUploadPage component
- [x] Route configuration
- [x] Tích hợp vào CustomizeProductPage
- [ ] Test upload ảnh
- [ ] Test filter/search
- [ ] Tích hợp vào các trang khác (optional)


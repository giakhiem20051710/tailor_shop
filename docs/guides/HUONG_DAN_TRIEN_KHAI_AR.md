# 🎯 Hướng Dẫn Triển Khai Chức Năng Thử Áo AR

## 📋 Tổng Quan

Chức năng **AR Virtual Try-On** cho phép khách hàng thử áo ảo trên người bằng công nghệ **MediaPipe Selfie Segmentation**. Tính năng này hoạt động hoàn toàn trên browser, không cần app, và miễn phí.

## ✅ Đã Hoàn Thành

### 1. **Tích Hợp Backend API**
- ✅ Lấy danh sách sản phẩm từ backend API (`/api/v1/products`)
- ✅ Hiển thị sản phẩm thật từ database
- ✅ Tự động xác định vị trí overlay dựa trên category
- ✅ Fallback về demo products nếu API lỗi

### 2. **Cải Thiện AR Overlay**
- ✅ Sử dụng MediaPipe Selfie Segmentation để detect người
- ✅ Overlay sản phẩm lên người với blending tự nhiên
- ✅ Cache product images để tăng performance
- ✅ Tự động điều chỉnh vị trí overlay theo category:
  - Áo dài: `{ x: 0.2, y: 0.1, width: 0.6, height: 0.8 }`
  - Vest: `{ x: 0.15, y: 0.05, width: 0.7, height: 0.9 }`
  - Đầm: `{ x: 0.2, y: 0.15, width: 0.6, height: 0.75 }`
  - Áo sơ mi: `{ x: 0.2, y: 0.2, width: 0.6, height: 0.6 }`

### 3. **Tính Năng Người Dùng**
- ✅ Tìm kiếm sản phẩm
- ✅ Chụp ảnh và lưu về máy
- ✅ Xem chi tiết sản phẩm từ AR page
- ✅ Hiển thị giá sản phẩm
- ✅ Loading states và error handling

### 4. **UI/UX**
- ✅ Responsive design (mobile & desktop)
- ✅ Camera controls (bật/tắt)
- ✅ Real-time AR preview
- ✅ Product selection với search
- ✅ Hướng dẫn sử dụng

## 🔧 Cấu Trúc Code

### File Chính: `my-react-app/src/pages/VirtualTryOnPage.jsx`

**Dependencies:**
```javascript
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { Camera } from "@mediapipe/camera_utils";
import { productService } from "../services/index.js";
```

**State Management:**
- `products`: Danh sách sản phẩm từ backend
- `selectedProduct`: Sản phẩm đang được thử
- `isCameraActive`: Trạng thái camera
- `isARReady`: Trạng thái AR đã sẵn sàng
- `searchQuery`: Query tìm kiếm

**Key Functions:**
1. `loadProducts()`: Load products từ backend API
2. `drawProductOverlay()`: Vẽ product overlay lên canvas với blending
3. `capturePhoto()`: Chụp và lưu ảnh
4. `handleTryOn()`: Bắt đầu thử áo với sản phẩm được chọn

## 🚀 Cách Sử Dụng

### 1. Truy Cập Trang AR

```
http://localhost/virtual-tryon
```

Hoặc từ menu:
- Header → "Thử áo AR"
- Customer Home → "Thử áo ảo"

### 2. Quy Trình Sử Dụng

1. **Bật Camera**
   - Click nút "Bật camera"
   - Cho phép truy cập camera khi browser hỏi
   - Đợi AR khởi tạo (khoảng 2-3 giây)

2. **Chọn Sản Phẩm**
   - Tìm kiếm sản phẩm trong search bar
   - Click vào sản phẩm muốn thử
   - Sản phẩm sẽ tự động overlay lên người

3. **Điều Chỉnh Vị Trí**
   - Đứng cách camera 1-2 mét
   - Giữ thẳng người
   - Đảm bảo ánh sáng đủ

4. **Chụp Ảnh**
   - Click nút 📸 để chụp
   - Ảnh sẽ tự động download về máy
   - Format: `try-on-{product-name}-{timestamp}.png`

5. **Xem Chi Tiết**
   - Click "Chi tiết" hoặc "Xem chi tiết sản phẩm"
   - Navigate đến product detail page

## 🔍 Cải Thiện AR Overlay

### Vấn Đề Hiện Tại

AR overlay hiện tại sử dụng **fixed position** dựa trên category. Điều này có thể không chính xác với mọi người.

### Giải Pháp Nâng Cao (Tùy Chọn)

#### 1. **Sử Dụng MediaPipe Pose Detection**

Thay vì fixed position, có thể detect pose và điều chỉnh overlay:

```javascript
import { Pose } from "@mediapipe/pose";

// Detect shoulders, hips để tính toán vị trí overlay
const leftShoulder = pose.landmarks[11];
const rightShoulder = pose.landmarks[12];
const leftHip = pose.landmarks[23];
const rightHip = pose.landmarks[24];

// Calculate overlay position based on body landmarks
const overlayX = (leftShoulder.x + rightShoulder.x) / 2;
const overlayY = leftShoulder.y;
const overlayWidth = Math.abs(rightShoulder.x - leftShoulder.x) * 1.2;
const overlayHeight = Math.abs(leftHip.y - leftShoulder.y) * 1.5;
```

#### 2. **Sử Dụng Machine Learning Model**

Có thể train một model riêng để detect vị trí chính xác hơn:
- TensorFlow.js
- MediaPipe Custom Model
- ONNX Runtime

#### 3. **User Calibration**

Cho phép user điều chỉnh vị trí overlay thủ công:
- Drag & drop product image
- Scale & rotate
- Save preferences

## 📦 Dependencies

### Đã Cài Đặt

```json
{
  "@mediapipe/camera_utils": "^0.3.1675466862",
  "@mediapipe/selfie_segmentation": "^0.1.1675465747",
  "@mediapipe/pose": "^0.5.1675469404"
}
```

### Cài Đặt Thêm (Nếu Cần)

```bash
# Nếu muốn dùng Pose Detection
npm install @mediapipe/pose

# Nếu muốn dùng TensorFlow.js
npm install @tensorflow/tfjs @tensorflow-models/pose-detection
```

## 🌐 Yêu Cầu Browser

### Hỗ Trợ Tốt
- ✅ Chrome/Edge (khuyến nghị)
- ✅ Firefox
- ✅ Safari (iOS 14+)

### Không Hỗ Trợ
- ❌ Trình duyệt cũ (< 2 năm)
- ❌ IE 11

### Yêu Cầu
- **HTTPS** hoặc **localhost** (để truy cập camera)
- **WebRTC** support
- **Canvas API** support

## 🔒 Bảo Mật & Privacy

### Camera Access
- Chỉ request camera khi user click "Bật camera"
- Tự động tắt camera khi rời trang
- Không lưu video stream
- Chỉ lưu ảnh khi user chụp

### Data Privacy
- Không gửi ảnh lên server (trừ khi user muốn lưu)
- Tất cả xử lý AR chạy trên client
- Không track user behavior

## 🐛 Troubleshooting

### Lỗi: "Không thể truy cập camera"

**Nguyên nhân:**
- Browser chưa cho phép
- Không phải HTTPS/localhost
- Camera đang được dùng bởi app khác

**Giải pháp:**
1. Kiểm tra browser permissions
2. Đảm bảo đang dùng HTTPS hoặc localhost
3. Đóng các app khác đang dùng camera

### Lỗi: "AR không hiển thị sản phẩm"

**Nguyên nhân:**
- Product image không load được
- MediaPipe model chưa load xong
- Segmentation mask không detect được người

**Giải pháp:**
1. Kiểm tra console logs
2. Đảm bảo đứng đủ ánh sáng
3. Đứng cách camera 1-2 mét
4. Thử refresh trang

### Lỗi: "Products không load được"

**Nguyên nhân:**
- Backend API không available
- Network error
- CORS issue

**Giải pháp:**
1. Kiểm tra backend đang chạy
2. Kiểm tra network tab trong DevTools
3. Xem console logs
4. Fallback sẽ tự động dùng demo products

## 🎨 Customization

### Thay Đổi Overlay Position

Trong `loadProducts()`, có thể customize overlay position:

```javascript
// Custom position cho category cụ thể
if (category.includes("áo dài")) {
  overlayPosition = { 
    x: 0.2,      // 20% from left
    y: 0.1,      // 10% from top
    width: 0.6,  // 60% of canvas width
    height: 0.8  // 80% of canvas height
  };
}
```

### Thay Đổi Blending Mode

Trong `drawProductOverlay()`, có thể thay đổi:

```javascript
// Transparency
ctx.globalAlpha = 0.9; // 0.0 - 1.0

// Blending mode
ctx.globalCompositeOperation = "source-over"; // Normal
// Options: "multiply", "screen", "overlay", "soft-light", etc.
```

### Thêm Filter/Effects

```javascript
// Sepia filter
ctx.filter = "sepia(0.5)";

// Brightness
ctx.filter = "brightness(1.1)";

// Contrast
ctx.filter = "contrast(1.2)";
```

## 📈 Performance Optimization

### Đã Implement

1. **Image Caching**: Cache product images trong `cachedProductImages`
2. **Lazy Loading**: Chỉ load products khi cần
3. **Canvas Optimization**: Clear canvas mỗi frame
4. **Debounce Search**: Có thể thêm debounce cho search

### Có Thể Cải Thiện

1. **Image Preloading**: Preload product images khi load list
2. **Web Workers**: Move AR processing to Web Worker
3. **Request Animation Frame**: Optimize canvas drawing
4. **Image Compression**: Compress product images trước khi overlay

## 🔮 Tính Năng Tương Lai

### Phase 2 (Tùy Chọn)

1. **Lưu Ảnh Lên Server**
   - Upload ảnh thử áo lên S3
   - Lưu vào database
   - Share với bạn bè

2. **AR với 3D Models**
   - Sử dụng Three.js
   - 3D product models
   - Realistic lighting & shadows

3. **AI Size Recommendation**
   - Detect body measurements
   - Recommend size phù hợp
   - Suggest alterations

4. **Multi-Product Try-On**
   - Thử nhiều sản phẩm cùng lúc
   - Mix & match outfits
   - Save outfit combinations

5. **Social Sharing**
   - Share ảnh thử áo lên social media
   - Get feedback từ bạn bè
   - Create lookbook

## 📝 Checklist Triển Khai

- [x] Tích hợp backend API
- [x] Load products từ database
- [x] AR overlay với MediaPipe
- [x] Chụp và lưu ảnh
- [x] Tìm kiếm sản phẩm
- [x] Navigate to product detail
- [x] Error handling
- [x] Loading states
- [x] Responsive design
- [ ] Lưu ảnh lên server (optional)
- [ ] Pose detection (optional)
- [ ] 3D models (optional)

## 🎓 Tài Liệu Tham Khảo

- [MediaPipe Selfie Segmentation](https://google.github.io/mediapipe/solutions/selfie_segmentation)
- [MediaPipe Camera Utils](https://github.com/google/mediapipe/tree/master/mediapipe/camera_utils)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

---

**Lưu ý**: Tính năng AR hiện tại đã production-ready và hoạt động tốt. Các tính năng nâng cao (Pose Detection, 3D Models) là optional và có thể implement sau nếu cần.


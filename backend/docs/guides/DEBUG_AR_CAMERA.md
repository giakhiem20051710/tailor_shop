# 🔍 Hướng Dẫn Debug Camera AR

## ❌ Vấn Đề: Camera không hiển thị

Nếu bạn bấm "Bật camera" nhưng chỉ thấy màn hình đen, hãy làm theo các bước sau:

## 🔧 Bước 1: Kiểm Tra Console Logs

Mở **DevTools** (F12) → Tab **Console** và xem các logs:

### Logs Bình Thường:
```
Loading products from API...
Products API response: {...}
Parsed products data: {...}
Products list: X items
✅ Loaded products for AR: X
Camera activated, setting isCameraActive to true
Video metadata loaded, dimensions: 640 x 480
Video is playing
Initializing MediaPipe Selfie Segmentation...
Starting MediaPipe Camera...
AR ready, switching to canvas
```

### Nếu Không Thấy Logs:
- **Không có logs "Loading products"**: API không được gọi → Kiểm tra backend
- **Không có logs "Camera activated"**: `startCamera()` không chạy → Kiểm tra permissions
- **Không có logs "Video is playing"**: Video stream không được set → Kiểm tra camera permissions

## 🔧 Bước 2: Kiểm Tra Camera Permissions

### Trong Console, chạy:
```javascript
// Kiểm tra permissions
navigator.permissions.query({ name: 'camera' }).then(result => {
  console.log('Camera permission:', result.state);
  // Kết quả: "granted", "denied", hoặc "prompt"
});

// Kiểm tra mediaDevices
console.log('MediaDevices available:', !!navigator.mediaDevices);
console.log('getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
```

### Nếu Permission = "denied":
1. Vào **Settings** của browser
2. Tìm **Privacy** → **Camera**
3. Cho phép camera cho website này
4. Refresh trang

## 🔧 Bước 3: Kiểm Tra Video Element

### Trong Console, chạy:
```javascript
// Tìm video element
const video = document.querySelector('video');
console.log('Video element:', video);
console.log('Video srcObject:', video?.srcObject);
console.log('Video readyState:', video?.readyState);
// readyState: 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
console.log('Video playing:', !video?.paused);
console.log('Video dimensions:', video?.videoWidth, 'x', video?.videoHeight);
```

### Nếu srcObject = null:
- Camera stream chưa được set → Kiểm tra `startCamera()` function

### Nếu readyState < 2:
- Video chưa load xong → Đợi thêm hoặc kiểm tra stream

### Nếu videoWidth = 0:
- Stream không có video track → Kiểm tra camera có hoạt động không

## 🔧 Bước 4: Kiểm Tra Network

Mở **DevTools** → Tab **Network** và kiểm tra:

1. **MediaPipe Files**: 
   - `selfie_segmentation_landscape.tflite`
   - `selfie_segmentation_landscape.binarypb`
   - Nếu không load được → Kiểm tra internet/CDN

2. **Products API**:
   - Request đến `/api/v1/products`
   - Nếu 404/500 → Backend không chạy hoặc API sai

## 🔧 Bước 5: Kiểm Tra Browser Support

### Test trong Console:
```javascript
// Kiểm tra WebRTC support
console.log('getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
console.log('WebRTC:', !!window.RTCPeerConnection);

// Kiểm tra Canvas support
const canvas = document.createElement('canvas');
console.log('Canvas 2D:', !!canvas.getContext('2d'));

// Kiểm tra MediaPipe (sau khi load)
console.log('SelfieSegmentation:', typeof SelfieSegmentation);
```

## 🔧 Bước 6: Test Camera Trực Tiếp

### Chạy trong Console:
```javascript
// Test camera access
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ Camera accessible!');
    console.log('Stream tracks:', stream.getTracks());
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    document.body.appendChild(video);
    console.log('Video should be visible now');
  })
  .catch(error => {
    console.error('❌ Camera error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
  });
```

### Nếu Test Thành Công:
- Camera hoạt động → Vấn đề ở code React
- Kiểm tra lại `startCamera()` function

### Nếu Test Thất Bại:
- Camera không accessible → Vấn đề ở browser/permissions
- Xem error message để biết nguyên nhân

## 🐛 Các Lỗi Thường Gặp

### 1. "NotAllowedError" hoặc "PermissionDeniedError"
**Nguyên nhân**: Browser chưa cho phép camera

**Giải pháp**:
- Cho phép camera trong browser settings
- Refresh trang
- Thử browser khác

### 2. "NotFoundError" hoặc "DevicesNotFoundError"
**Nguyên nhân**: Không tìm thấy camera

**Giải pháp**:
- Kiểm tra camera có được kết nối không
- Kiểm tra camera có đang được dùng bởi app khác không
- Thử unplug và plug lại camera

### 3. "NotReadableError" hoặc "TrackStartError"
**Nguyên nhân**: Camera đang được dùng bởi app khác

**Giải pháp**:
- Đóng các app đang dùng camera (Zoom, Teams, etc.)
- Refresh trang

### 4. "OverconstrainedError"
**Nguyên nhân**: Camera không hỗ trợ resolution yêu cầu

**Giải pháp**:
- Code đã tự động retry với default settings
- Nếu vẫn lỗi, thử browser khác

### 5. Video Element Không Hiển Thị
**Nguyên nhân**: CSS hoặc display logic

**Giải pháp**:
- Kiểm tra `isCameraActive` = true
- Kiểm tra `isARReady` = false (video bị ẩn khi AR ready)
- Kiểm tra CSS: `display: block` và không có `visibility: hidden`

### 6. "Không tìm thấy sản phẩm nào"
**Nguyên nhân**: Products API không trả về data hoặc products không có image

**Giải pháp**:
- Kiểm tra backend API `/api/v1/products`
- Kiểm tra products có `imageUrl` hoặc `images[0].url` không
- Code sẽ tự động fallback về demo products

## ✅ Checklist Debug

- [ ] Console có logs "Camera activated"?
- [ ] Console có logs "Video is playing"?
- [ ] Video element có `srcObject`?
- [ ] Video `readyState` >= 2?
- [ ] Video `videoWidth` > 0?
- [ ] Camera permission = "granted"?
- [ ] Products đã load (không phải "Không tìm thấy")?
- [ ] MediaPipe files đã load?
- [ ] Không có error trong Console?

## 🎯 Quick Fix

Nếu vẫn không hoạt động, thử:

1. **Hard Refresh**: `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)
2. **Clear Cache**: DevTools → Application → Clear site data
3. **Thử Browser Khác**: Chrome/Edge khuyến nghị
4. **Kiểm Tra URL**: Phải là HTTPS hoặc localhost
5. **Restart Browser**: Đóng và mở lại browser

## 📞 Nếu Vẫn Không Được

Vui lòng cung cấp:
1. **Console logs** (copy tất cả)
2. **Screenshot** của màn hình
3. **Browser và version** (Chrome 120, Firefox 121, etc.)
4. **OS** (Windows 10, macOS 14, etc.)
5. **URL** bạn đang truy cập

---

**Lưu ý**: Camera chỉ hoạt động trên HTTPS hoặc localhost. Nếu đang dùng HTTP, hãy chuyển sang HTTPS hoặc dùng localhost.


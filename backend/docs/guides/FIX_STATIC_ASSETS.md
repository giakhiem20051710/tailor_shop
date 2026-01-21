# 🔧 Fix Lỗi Static Assets (404 Not Found)

## ❌ Vấn Đề

Khi truy cập frontend, gặp các lỗi:
1. `Failed to load resource: 404 - CustomerHomePage-B4fmLdGh.js`
2. `Failed to load resource: 404 - icon-192.png`
3. `TypeError: Failed to fetch dynamically imported module`

## 🔍 Nguyên Nhân

1. **Browser Cache Mismatch**: Browser đang cache file JS cũ với hash cũ (`index-DTD5mDl9.js`) nhưng container có file mới với hash mới (`index-tUei72CG.js`)
2. **Missing Icon Files**: File `icon-192.png` và `icon-512.png` được reference trong `manifest.json` nhưng không tồn tại trong source code
3. **Build Out of Sync**: Frontend container có thể đã được build từ code cũ

## ✅ Giải Pháp

### Bước 1: Rebuild Frontend Container

```bash
# Rebuild frontend với --no-cache để đảm bảo build mới hoàn toàn
docker-compose build --no-cache frontend

# Hoặc rebuild và restart
docker-compose up -d --build frontend
```

### Bước 2: Clear Browser Cache

**Cách 1: Hard Refresh (Khuyến nghị)**
- **Windows/Linux**: `Ctrl + Shift + R` hoặc `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

**Cách 2: Clear Cache trong DevTools**
1. Mở DevTools (F12)
2. Right-click vào nút Refresh
3. Chọn "Empty Cache and Hard Reload"

**Cách 3: Clear Cache hoàn toàn**
1. Mở DevTools (F12)
2. Vào tab **Application** (hoặc **Storage**)
3. Click **Clear site data**
4. Refresh trang

### Bước 3: Kiểm Tra Service Worker

Service Worker có thể cache file cũ. Để clear:

1. Mở DevTools (F12)
2. Vào tab **Application** → **Service Workers**
3. Click **Unregister** cho service worker hiện tại
4. Refresh trang

Hoặc trong Console:
```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

### Bước 4: Verify Files trong Container

```bash
# Kiểm tra index.html
docker exec tailor-shop-frontend cat /usr/share/nginx/html/index.html

# Kiểm tra assets folder
docker exec tailor-shop-frontend ls -la /usr/share/nginx/html/assets

# Kiểm tra manifest.json
docker exec tailor-shop-frontend cat /usr/share/nginx/html/manifest.json
```

## 🔄 Các Thay Đổi Đã Thực Hiện

1. ✅ **Fixed `manifest.json`**: Thay thế reference đến `icon-192.png` và `icon-512.png` bằng `vite.svg` (file đã tồn tại)
2. ✅ **Fixed deprecated meta tag**: Thêm `mobile-web-app-capable` meta tag (thay thế cho `apple-mobile-web-app-capable` deprecated)

## 📝 File Đã Sửa

### `my-react-app/public/manifest.json`
- Thay đổi icons từ `/icon-192.png` và `/icon-512.png` → `/vite.svg`
- Cập nhật shortcuts icons

### `my-react-app/index.html`
- Thêm `mobile-web-app-capable` meta tag
- Giữ lại `apple-mobile-web-app-capable` để tương thích ngược

## 🎯 Kết Quả Mong Đợi

Sau khi rebuild và clear cache:
- ✅ Không còn lỗi 404 cho JS files
- ✅ Không còn lỗi 404 cho icon files
- ✅ Không còn cảnh báo về deprecated meta tag
- ✅ Frontend load đúng các assets mới nhất

## 🚨 Nếu Vẫn Gặp Lỗi

### Kiểm tra logs:
```bash
docker-compose logs -f frontend
```

### Kiểm tra network requests:
1. Mở DevTools → Network tab
2. Refresh trang
3. Xem các request nào bị 404
4. So sánh với files trong container

### Force rebuild hoàn toàn:
```bash
# Stop và xóa containers
docker-compose down

# Xóa images cũ
docker rmi tailor_shop-frontend

# Rebuild từ đầu
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## 💡 Tips

1. **Development**: Nên dùng `npm run dev` thay vì Docker để tránh cache issues
2. **Production**: Luôn rebuild sau khi có thay đổi code
3. **Cache Strategy**: Có thể config cache headers trong `nginx.conf` để control caching behavior

---

**Lưu ý**: Nếu bạn muốn thêm icon files thật, hãy:
1. Tạo `icon-192.png` và `icon-512.png` trong `my-react-app/public/`
2. Update lại `manifest.json` để reference các file này
3. Rebuild frontend


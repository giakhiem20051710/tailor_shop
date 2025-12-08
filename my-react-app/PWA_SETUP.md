# PWA Setup Guide

## Icons Required

Để PWA hoạt động đầy đủ, bạn cần tạo 2 icon files trong `public/`:

1. `icon-192.png` - 192x192 pixels
2. `icon-512.png` - 512x512 pixels

Bạn có thể:
- Tạo icons từ logo của bạn
- Sử dụng online tools như https://realfavicongenerator.net/
- Hoặc tạm thời comment out phần icons trong `manifest.json` để test

## Testing PWA

1. Build production: `npm run build`
2. Serve với HTTPS (required cho PWA):
   - `npm install -g serve`
   - `serve -s dist`
3. Mở DevTools → Application → Service Workers để kiểm tra
4. Test offline mode bằng cách:
   - DevTools → Network → Offline
   - Reload trang

## Features

- ✅ Service Worker với caching
- ✅ Offline support
- ✅ Install prompt (trên mobile)
- ✅ App shortcuts
- ✅ Theme color


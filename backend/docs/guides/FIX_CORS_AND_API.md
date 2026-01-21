# 🔧 Sửa Lỗi "Fail to Fetch" - Frontend không kết nối được Backend

## ❌ Vấn đề

Frontend chạy nhưng không kết nối được Backend, báo lỗi "Failed to fetch" hoặc CORS error.

## 🔍 Nguyên nhân

1. **CORS không cho phép origin của frontend**
   - Backend chỉ cho phép `localhost:5173` (dev server)
   - Frontend trong Docker chạy trên `localhost:80` → không được phép

2. **Frontend gọi trực tiếp `http://localhost:8083`**
   - Từ browser, `localhost:8083` có thể bị block bởi CORS
   - Hoặc network không thể resolve

## ✅ Giải pháp đã áp dụng

### 1. **Cập nhật CORS trong Backend**

Đã thêm các origins sau vào `SecurityConfig.java`:
- `http://localhost`
- `http://localhost:80`
- `http://127.0.0.1`
- `http://127.0.0.1:80`

### 2. **Bật Nginx Proxy trong Frontend**

Đã bật proxy trong `nginx.conf`:
```nginx
location /api {
    proxy_pass http://backend:8083;
    # ... proxy headers ...
}
```

**Lợi ích:**
- Frontend gọi `/api/v1/...` → Nginx proxy đến `backend:8083`
- Không cần CORS (cùng origin)
- Không cần expose backend port ra ngoài

### 3. **Cập nhật API Config**

Đã cập nhật `apiConfig.js` để:
- **Development:** Dùng `http://localhost:8083/api/v1`
- **Production/Docker:** Dùng relative path `/api/v1` (qua nginx proxy)

## 🧪 Kiểm tra

### 1. Kiểm tra Backend đã start
```bash
docker-compose logs backend | Select-String "Started TailorShopApplication"
```

### 2. Kiểm tra Frontend có proxy
```bash
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf | Select-String "location /api"
```

### 3. Test từ browser
Mở http://localhost và kiểm tra:
- Network tab trong DevTools
- Xem request đến `/api/v1/...` có thành công không

### 4. Test API trực tiếp
```bash
# Test backend trực tiếp
Invoke-WebRequest -Uri http://localhost:8083/api/v1/products -UseBasicParsing

# Test qua nginx proxy
Invoke-WebRequest -Uri http://localhost/api/v1/products -UseBasicParsing
```

## 🔄 Nếu vẫn còn lỗi

### Kiểm tra logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Nginx error logs
docker-compose exec frontend cat /var/log/nginx/error.log
```

### Kiểm tra network
```bash
# Xem containers có cùng network không
docker network inspect tailor_shop_tailor-shop-network

# Test connectivity
docker-compose exec frontend ping backend
```

### Rebuild lại
```bash
# Rebuild frontend với code mới
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Rebuild backend với CORS mới
docker-compose build --no-cache backend
docker-compose up -d backend
```

## 📝 Lưu ý

1. **API URL trong code:**
   - Development: `http://localhost:8083/api/v1`
   - Production: `/api/v1` (relative path)

2. **Nginx proxy:**
   - Chỉ hoạt động khi frontend chạy trong Docker
   - Nếu chạy dev server (`npm run dev`), vẫn dùng full URL

3. **CORS:**
   - Vẫn cần CORS cho trường hợp frontend gọi trực tiếp backend
   - Nginx proxy không cần CORS (same origin)

## ✅ Kết quả mong đợi

- ✅ Frontend load được tại http://localhost
- ✅ API calls thành công (không còn "Failed to fetch")
- ✅ Không còn CORS errors trong console
- ✅ Backend logs hiển thị requests từ frontend

---

**Chúc bạn sửa thành công! 🎉**


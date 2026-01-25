# Hướng Dẫn Deploy Lên VPS với Cloudflare Tunnel (Không Mở Port)

Hướng dẫn này giúp bạn đưa website lên internet thông qua Cloudflare Tunnel, an toàn tuyệt đối vì không cần mở port trên VPS.

## Bước 1: Chuẩn Bị Trên Cloudflare
1. Đăng nhập vào [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Vào mục **Networks** -> **Tunnels**.
3. Bấm **Create a Tunnel**.
4. Chọn **Cloudflared** -> Next.
5. Đặt tên (ví dụ: `tailor-shop-vps`) -> Save Tunnel.
6. **QUAN TRỌNG**: Copy đoạn mã token ở phần "Install and run a connector". Nó sẽ có dạng dài ngoằng bắt đầu bằng `eyJhIjoi...`. Chỉ copy chuỗi token đó.

7. Chuyển sang tab **Public Hostname** (trong bước cài đặt tunnel):
   - Add a public hostname.
   - **Subdomain**: `shop` (hoặc để trống nếu dùng domain chính).
   - **Domain**: chọn domain của bạn (ví dụ: `tailorshop.com`).
   - **Service**: `HTTP` -> `tailor-shop-frontend:80` (Lưu ý: dùng tên container `tailor-shop-frontend`).
   - Bấm **Save Hostname**.

   *Nếu muốn trỏ cả API (tùy chọn nhưng khuyến khích routing qua frontend):*
   - Add thêm hostname thứ 2: `api.tailorshop.com`.
   - Service: `HTTP` -> `tailor-shop-backend:8083`.

## Bước 2: Chuẩn Bị Trên VPS
Đăng nhập vào VPS của bạn (thông qua Remote Desktop hoặc SSH).

1. **Cài Đặt Git và Docker** (nếu chưa có):
   *Nếu là Windows Server, hãy cài Docker Desktop hoặc Rancher Desktop.*

2. **Clone Code về VPS**:
   ```powershell
   git clone https://github.com/giakhiem20051710/tailor_shop.git
   cd tailor_shop
   ```

3. **Cấu Hình Biến Môi Trường**:
   Copy file `env.example` thành `.env` và chỉnh sửa:
   ```powershell
   copy env.example .env
   notepad .env
   ```
   **Bắt buộc điền:**
   - `CLOUDFLARE_TUNNEL_TOKEN`: dán token bạn vừa copy ở Bước 1 vào đây.
   - `MYSQL_PASSWORD`: mật khẩu database (tự đặt).
   - `JWT_SECRET`: chuỗi bí mật ngẫu nhiên.

## Bước 3: Chạy Ứng Dụng
Chạy lệnh sau để khởi động toàn bộ hệ thống (Database + Backend + Frontend + Tunnel):

```powershell
docker-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.cloudflare.yml up -d --build
```

## Bước 4: Kiểm Tra
1. Xem trạng thái containers:
   ```powershell
   docker-compose ps
   ```
   Đảm bảo `tailor-shop-tunnel`, `tailor-shop-backend`, `tailor-shop-frontend`, `tailor-shop-mysql` đều ở trạng thái **Up**.

2. Truy cập web:
   Mở trình duyệt và vào domain bạn đã cấu hình (ví dụ: `https://shop.tailorshop.com`). Cloudflare sẽ tự động cấp chứng chỉ SSL HTTPS cho bạn.

## Gỡ Lỗi (Troubleshooting)
- **Xem log Tunnel**:
  ```powershell
  docker-compose logs -f cloudflared
  ```
  Nếu thấy dòng `Registered tunnel connection`, tức là đã kết nối thành công.

- **Frontend không gọi được API**:
  Đảm bảo trong `.env` hoặc `docker-compose.yml`, biến `VITE_API_BASE_URL` của frontend trỏ đúng về domain API (ví dụ: `https://api.tailorshop.com/api/v1`) hoặc đường dẫn tương đối `/api/v1` nếu dùng Nginx proxy chung.

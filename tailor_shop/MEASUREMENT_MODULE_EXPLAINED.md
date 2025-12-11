# Measurement Module Explained

## Mục tiêu
- Quản lý số đo khách hàng, gắn với đơn hàng (tùy chọn), hỗ trợ versioning (lưu lịch sử, bản mới nhất).

## Thành phần
- Domain: `MeasurementEntity`
  - `groupId`: nhóm version (UUID)
  - `customer` (User) **bắt buộc**
  - `order` (Order) optional
  - `version`: số thứ tự version
  - `isLatest`: đánh dấu bản mới nhất
  - Số đo: chest, waist, hip, shoulder, sleeve, inseam, outseam, neck, height, weight
  - `fitPreference`, `note`
  - `createdBy`, `createdAt`
- DTO:
  - `MeasurementRequest`: nhận input, validate >0
  - `MeasurementResponse`: trả dữ liệu + meta (version, latest, createdBy, timestamps)
- Repository: `MeasurementRepository`
  - `findLatest(customerId?, orderId?)`
  - `findByGroupIdOrderByVersionDesc`
  - `findFirstByGroupIdAndIsLatestTrue`
- Service + Impl: `MeasurementService`, `MeasurementServiceImpl`
  - `list`: trả bản latest, filter customerId/orderId; nếu role CUSTOMER chỉ xem của mình
  - `detail`: xem một bản; CUSTOMER chỉ xem của mình
  - `create`: version=1, isLatest=true, groupId mới; orderId optional nhưng phải thuộc customer
  - `update`: tạo version mới (version cũ isLatest=false), giữ groupId, tăng version
  - `history`: trả toàn bộ versions theo groupId
  - `latest`: trả bản isLatest theo groupId
- Controller: `MeasurementController`
  - `GET /api/v1/measurements` (list latest, filter)
  - `GET /api/v1/measurements/{id}` (detail)
  - `POST /api/v1/measurements` (create) — roles: ADMIN/STAFF/TAILOR
  - `PUT /api/v1/measurements/{id}` (update -> version mới) — roles: ADMIN/STAFF/TAILOR
  - `GET /api/v1/measurements/{id}/history` (history)
  - `GET /api/v1/measurements/{id}/latest` (bản mới nhất)
  - Guard: CUSTOMER chỉ xem của mình
- Flyway: `V5__measurement.sql`
  - Bảng `measurements` có FK `customer_id` -> users, `order_id` -> orders, `created_by` -> users
  - Index: (group_id, is_latest), customer_id, order_id

## Luồng chính
1) Create
   - Validate customer tồn tại.
   - Nếu có orderId: phải tồn tại và thuộc customer.
   - Tạo record version=1, isLatest=true, groupId=UUID.
2) Update
   - Kiểm tra measurement tồn tại; customer khớp request.
   - Nếu orderId mới: phải thuộc cùng customer.
   - Set tất cả bản cùng groupId isLatest=false; tạo bản mới version=prev+1, isLatest=true.
3) List (latest)
   - Nếu CUSTOMER: ép customerId=currentUser.
   - Filter customerId/orderId, trả bản isLatest.
4) Detail/History/Latest
   - CUSTOMER chỉ xem measurement của mình; ADMIN/STAFF/TAILOR không giới hạn.

## Security & Roles
- ADMIN/STAFF/TAILOR: tạo, cập nhật, xem tất cả.
- CUSTOMER: chỉ được xem (list/detail/history/latest) của chính mình, không được create/update.

## Validation
- customerId bắt buộc; orderId optional nhưng phải cùng customer.
- Các số đo >0 (DecimalMin 0.1).

## API test nhanh
- Create (POST /measurements): thiếu customerId -> 400; order không thuộc customer -> 400.
- Update (PUT /measurements/{id}): version tăng, bản cũ isLatest=false.
- Customer khác gọi detail của người khác -> 403/400 Access denied.

## Gợi ý sử dụng
- Tạo measurement chung (không orderId) cho hồ sơ khách; khi có đơn cụ thể có thể tạo bản riêng với orderId.
- UI hiển thị bản latest, kèm nút xem lịch sử (history) và đánh dấu version.


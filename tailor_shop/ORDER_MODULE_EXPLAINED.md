# Order Module Explained

## Mục tiêu
- Quản lý đơn hàng end-to-end: tạo đơn, xem chi tiết, cập nhật trạng thái theo state machine, tracking timeline, thanh toán, đính kèm.

## Thành phần chính
- Domain:
  - `OrderEntity`: đơn hàng (code, status, customer, tailor, total, deposit, note, timestamps).
  - `OrderStatus`: DRAFT → CONFIRMED → IN_PROGRESS → FITTING → COMPLETED; CANCELLED tại các bước chưa hoàn tất.
  - `OrderItemEntity`: dòng sản phẩm (productId, fabricId, qty, unitPrice, subtotal).
  - `OrderTimelineEntity`: lịch sử trạng thái, note, createdBy, createdAt.
  - `OrderPaymentEntity`: thanh toán (amount, method, status, txnRef, createdAt).
  - `OrderAttachmentEntity`: file đính kèm (name, url, type).
- DTO:
  - `OrderResquest` (giữ typo lịch sử): tạo đơn với customerId, tailorId?, items[], deposit, note.
  - `OrderResponse`: trả chi tiết/tóm tắt (items, timeline, payments, attachments).
  - `UpdateOrderStatusRequest`: cập nhật trạng thái + note.
- Repository:
  - `OrderRepository`: search theo status, customerId, tailorId, from/to date; kiểm tra code duy nhất.
  - `OrderItemRepository`, `OrderTimelineRepository`, `OrderPaymentRepository`, `OrderAttachmentRepository`.
- Service:
  - `OrderService`, `OrderServiceImpl`: list/search, detail, create, updateStatus (state machine), tracking (customer chỉ xem đơn của mình).
- Controller:
  - `OrderController`: REST API `/api/v1/orders` trả `CommonResponse` + `traceId`.
    - GET list (ADMIN/STAFF)
    - GET detail (ADMIN/STAFF/TAILOR)
    - POST create (ADMIN/STAFF)
    - PATCH status (ADMIN/STAFF/TAILOR) — áp dụng state machine
    - GET tracking (ADMIN/STAFF/TAILOR/CUSTOMER) — khách chỉ thấy đơn của mình

## Luồng chính
1) **Create Order**
   - Validate customer (và tailor nếu có).
   - Kiểm tra items không rỗng; tính subtotal và tổng.
   - Đặt status DRAFT, lưu items, tổng, deposit, note.
   - Ghi timeline “Order created”.
2) **Update Status**
   - Kiểm tra chuyển trạng thái hợp lệ qua `isTransitionAllowed`.
   - Lưu trạng thái mới, ghi timeline (note tùy chọn).
3) **Tracking**
   - Trả timeline theo thời gian; nếu là customer phải đúng chủ sở hữu đơn.

## State Machine
- Cho phép:
  - DRAFT -> CONFIRMED hoặc CANCELLED
  - CONFIRMED -> IN_PROGRESS hoặc CANCELLED
  - IN_PROGRESS -> FITTING hoặc CANCELLED
  - FITTING -> COMPLETED hoặc CANCELLED
- Không cho phép rollback từ COMPLETED/CANCELLED.

## Quyền (Role)
- ADMIN/STAFF: full CRUD + search.
- TAILOR: xem/đổi trạng thái đơn được assign (hiện chưa check ownership tailor, có thể bổ sung).
- CUSTOMER: chỉ xem tracking đơn của mình.

## Mã đơn
- Sinh code dạng `ORD-XXXXXXXX` (UUID 8 ký tự, uppercase), đảm bảo unique bằng `existsByCode`.

## Lưu ý mở rộng
- Chưa tích hợp stock check và payment gateway; có thể thêm service riêng.
- Chưa enforce tailor-ownership khi update status; thêm nếu cần.
- Typo `OrderResquest` giữ để tránh vỡ import; nếu muốn đổi, cần rename đồng bộ.


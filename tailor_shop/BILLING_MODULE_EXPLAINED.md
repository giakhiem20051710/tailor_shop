# Billing Module - Giải thích chi tiết từng chức năng

## 📋 Billing là gì?
Module quản lý **hóa đơn (Invoice)** và **thanh toán (Payment)** cho cửa hàng may:
- Tạo hóa đơn từ đơn hàng hoặc thủ công
- Quản lý dòng hàng, thuế, giảm giá, tổng tiền
- Ghi nhận thanh toán nhiều lần (tiền mặt, VNPay, MoMo, ZaloPay)
- Tự động cập nhật trạng thái: `issued` → `partial_paid` → `paid` hoặc `voided`

---

## 🎯 Tính năng chính

### 1) Quản lý Hóa đơn (Invoice)
- Hóa đơn gắn với **order** (tùy chọn) và **customer**
- **Staff** (nhân viên) lập hóa đơn
- Trạng thái: `issued` (mới tạo), `partial_paid` (đã trả một phần), `paid` (đã thanh toán đủ), `voided` (hủy), `refunded` (hoàn tiền)
- Tính toán tự động: subtotal, tax, discount, total, paid, due

### 2) Quản lý Dòng hàng (Invoice Items)
- Mỗi hóa đơn có nhiều dòng hàng
- Mỗi dòng: tên, số lượng, đơn giá, giảm giá, thuế suất
- Tự động tính `lineTotal = (unitPrice × quantity - discount) × (1 + taxRate%)`

### 3) Quản lý Thanh toán (Payment Transactions)
- Mỗi hóa đơn có thể có nhiều giao dịch thanh toán
- Hỗ trợ: `cash` (tiền mặt), `vnpay`, `momo`, `zalopay`
- Trạng thái: `pending` (chờ), `success` (thành công), `failed` (thất bại), `cancelled` (hủy)
- Tự động cập nhật `paidAmount` và `dueAmount` của invoice

### 4) Xử lý Callback từ cổng thanh toán
- Nhận callback từ VNPay/MoMo/ZaloPay
- Cập nhật trạng thái transaction và invoice tự động

---

## 🔐 Quyền (RBAC)
- **Admin**: xem/tạo/void hóa đơn; thêm thanh toán; xem tất cả hóa đơn
- **Staff**: xem/tạo/void hóa đơn; thêm thanh toán; xem tất cả hóa đơn
- **Customer**: chỉ xem hóa đơn của mình; được thêm thanh toán cho hóa đơn của mình
- **Tailor**: xem hóa đơn (tham khảo)

---

## 📝 Quy trình thực tế (ví dụ)

### Tình huống 1: Tạo hóa đơn từ đơn hàng

**Bước 1: Tạo hóa đơn**
```json
POST /api/v1/invoices
{
  "orderId": 1,
  "customerId": 1,
  "staffId": 2,
  "currency": "VND",
  "discountAmount": 50000,
  "taxAmount": 0,
  "dueDate": "2025-01-31",
  "items": [
    {
      "name": "May áo sơ mi",
      "quantity": 2,
      "unitPrice": 500000,
      "discountAmount": 0,
      "taxRate": 10
    },
    {
      "name": "May quần âu",
      "quantity": 1,
      "unitPrice": 800000,
      "discountAmount": 50000,
      "taxRate": 10
    }
  ],
  "notes": "Hóa đơn cho đơn hàng #1"
}
```

**Hệ thống xử lý:**
1. Validate customer, staff, order (nếu có) tồn tại
2. Validate order thuộc về customer
3. Tính toán từng dòng hàng:
   - Dòng 1: `lineBase = 500000 × 2 - 0 = 1,000,000`, `lineTax = 1,000,000 × 10% = 100,000`, `lineTotal = 1,100,000`
   - Dòng 2: `lineBase = 800000 × 1 - 50000 = 750,000`, `lineTax = 750,000 × 10% = 75,000`, `lineTotal = 825,000`
4. Tính tổng:
   - `subtotal = 1,100,000 + 825,000 = 1,925,000`
   - `taxAmount = 0` (đã tính trong từng dòng)
   - `discountAmount = 50,000`
   - `total = 1,925,000 + 0 - 50,000 = 1,875,000`
   - `paidAmount = 0`, `dueAmount = 1,875,000`
5. Tạo mã hóa đơn: `INV-{traceId}`
6. Set trạng thái: `issued`
7. Lưu invoice và items

**Response:**
```json
{
  "id": 1,
  "code": "INV-abc123",
  "orderId": 1,
  "customer": { "id": 1, "name": "Nguyễn Văn A", "role": "CUSTOMER" },
  "staff": { "id": 2, "name": "Trần Thị B", "role": "STAFF" },
  "status": "issued",
  "currency": "VND",
  "subtotal": 1925000,
  "taxAmount": 0,
  "discountAmount": 50000,
  "total": 1875000,
  "paidAmount": 0,
  "dueAmount": 1875000,
  "items": [...],
  "transactions": []
}
```

### Tình huống 2: Thanh toán tiền mặt

**Bước 1: Thêm thanh toán**
```json
POST /api/v1/invoices/payments
{
  "invoiceId": 1,
  "provider": "cash",
  "amount": 1000000
}
```

**Hệ thống xử lý:**
1. Kiểm tra invoice tồn tại, không bị `voided`/`refunded`
2. Kiểm tra `amount ≤ dueAmount` (1,000,000 ≤ 1,875,000) ✅
3. Tạo transaction:
   - `provider = cash`
   - `status = success` (tiền mặt thành công ngay)
   - `providerRef = UUID`
   - `paidAt = now()`
4. Áp dụng vào invoice:
   - `paidAmount = 0 + 1,000,000 = 1,000,000`
   - `dueAmount = 1,875,000 - 1,000,000 = 875,000`
   - `status = partial_paid` (vì còn nợ)
5. Lưu transaction và invoice

**Response:**
```json
{
  "transactionId": 1,
  "invoiceId": 1,
  "provider": "cash",
  "status": "success",
  "amount": 1000000,
  "providerRef": "uuid-123",
  "paymentUrl": null,
  "paidAt": "2024-12-25T10:30:00Z"
}
```

**Bước 2: Thanh toán tiếp (đủ)**
```json
POST /api/v1/invoices/payments
{
  "invoiceId": 1,
  "provider": "cash",
  "amount": 875000
}
```

→ Invoice chuyển sang `paid`, `dueAmount = 0`

### Tình huống 3: Thanh toán online (VNPay)

**Bước 1: Tạo thanh toán online**
```json
POST /api/v1/invoices/payments
{
  "invoiceId": 1,
  "provider": "vnpay",
  "amount": 1875000,
  "callbackUrl": "https://shop.com/payment/callback",
  "returnUrl": "https://shop.com/payment/return"
}
```

**Hệ thống xử lý:**
1. Kiểm tra invoice và amount
2. Tạo transaction:
   - `provider = vnpay`
   - `status = pending` (chờ callback)
   - `providerRef = UUID`
3. Trả về `paymentUrl` (dummy): `https://pay.example.com/redirect?ref=uuid-123`

**Response:**
```json
{
  "transactionId": 2,
  "invoiceId": 1,
  "provider": "vnpay",
  "status": "pending",
  "amount": 1875000,
  "providerRef": "uuid-456",
  "paymentUrl": "https://pay.example.com/redirect?ref=uuid-456",
  "paidAt": null
}
```

**Bước 2: Khách thanh toán trên VNPay**
→ Khách chuyển đến `paymentUrl`, thanh toán trên VNPay

**Bước 3: VNPay gửi callback**
```json
POST /api/v1/invoices/payments/callback
{
  "provider": "vnpay",
  "providerRef": "uuid-456",
  "success": true,
  "amount": 1875000,
  "rawPayload": "{...}",
  "message": "Payment successful"
}
```

**Hệ thống xử lý:**
1. Tìm transaction theo `providerRef`
2. Nếu đã `success` → trả kết quả (idempotent)
3. Cập nhật:
   - `status = success`
   - `paidAt = now()`
   - `responsePayload = rawPayload`
4. Áp dụng vào invoice:
   - `paidAmount += amount`
   - `dueAmount -= amount`
   - `status = paid` (nếu đủ) hoặc `partial_paid`
5. Lưu transaction và invoice

**Response:**
```json
{
  "transactionId": 2,
  "invoiceId": 1,
  "provider": "vnpay",
  "status": "success",
  "amount": 1875000,
  "providerRef": "uuid-456",
  "paidAt": "2024-12-25T11:00:00Z"
}
```

### Tình huống 4: Hủy hóa đơn (Void)

**Chỉ cho phép khi chưa có thanh toán thành công:**
```json
POST /api/v1/invoices/1/void
```

**Hệ thống kiểm tra:**
- Invoice tồn tại
- `paidAmount == 0` (chưa có payment success)
- Set `status = voided`

**Nếu đã có payment:**
→ Lỗi: `"Cannot void an invoice with successful payments"`

---

## 🔍 Xem danh sách hóa đơn (List & Filter)

### Lọc theo nhiều tiêu chí:
```
GET /api/v1/invoices?code=INV-abc123&customerId=1&status=paid&dateFrom=2024-12-01&dateTo=2024-12-31&page=0&size=20
```

**Các filter:**
- `code`: mã hóa đơn (exact match)
- `customerId`: ID khách hàng
- `status`: `issued`, `partial_paid`, `paid`, `voided`, `refunded`
- `dateFrom`: từ ngày (tự động chuyển sang UTC start-of-day)
- `dateTo`: đến ngày (tự động chuyển sang UTC end-of-day)
- `page`, `size`: phân trang

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "code": "INV-abc123",
      "customer": {...},
      "status": "paid",
      "total": 1875000,
      "paidAmount": 1875000,
      "dueAmount": 0
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "page": 0,
  "size": 20
}
```

---

## 📊 Chi tiết hóa đơn (Detail)

```
GET /api/v1/invoices/1
```

**Response đầy đủ:**
- Thông tin invoice (code, status, tiền, ngày)
- Customer và Staff (Party với id/name/role/phone)
- Danh sách items (từng dòng hàng)
- Danh sách transactions (lịch sử thanh toán)
- Audit fields (createdAt, updatedAt)

**Quyền:**
- Customer chỉ xem được hóa đơn của mình
- Admin/Staff xem được tất cả

---

## 🛠️ Các chức năng chi tiết

### 1. Tạo hóa đơn (`create`)

**Input:**
- `orderId` (optional): gắn với đơn hàng
- `customerId` (required): khách hàng
- `staffId` (required): nhân viên lập
- `currency` (required): VND, USD, ...
- `items` (required, không rỗng): danh sách dòng hàng
- `discountAmount` (optional): giảm giá tổng
- `taxAmount` (optional): thuế tổng (nếu không dùng taxRate từng dòng)
- `dueDate` (optional): hạn thanh toán
- `notes` (optional): ghi chú

**Validation:**
- Customer, Staff phải tồn tại
- Order (nếu có) phải thuộc customer
- Items không rỗng, quantity ≥ 1, name ≤ 255 ký tự
- Total không được âm

**Output:**
- InvoiceResponse với status `issued`, `paidAmount = 0`, `dueAmount = total`

---

### 2. Thêm thanh toán (`addPayment`)

**Input:**
- `invoiceId` (required)
- `provider` (required): `cash`, `vnpay`, `momo`, `zalopay`
- `amount` (required, > 0)
- `callbackUrl`, `returnUrl`, `extraData` (optional, cho online)

**Validation:**
- Invoice tồn tại, không `voided`/`refunded`
- `amount ≤ dueAmount`

**Logic:**
- **Cash**: `status = success` ngay, `paidAt = now()`, áp dụng vào invoice
- **Online**: `status = pending`, trả `paymentUrl` (dummy), chờ callback

**Output:**
- PaymentResponse với transaction mới tạo

---

### 3. Xử lý callback (`handleCallback`)

**Input:**
- `provider` (required)
- `providerRef` (required): UUID từ transaction
- `success` (required): true/false
- `amount` (required)
- `rawPayload` (optional): payload từ cổng

**Logic:**
1. Tìm transaction theo `providerRef`
2. Nếu đã `success` → idempotent (trả kết quả, không cập nhật lại)
3. Cập nhật `status` theo `success`
4. Nếu `success = true`:
   - `paidAt = now()`
   - Áp dụng `amount` vào invoice (cộng paid, trừ due)
   - Cập nhật invoice status (`paid` hoặc `partial_paid`)
5. Lưu transaction và invoice

**Output:**
- PaymentResponse với transaction đã cập nhật

---

### 4. Hủy hóa đơn (`voidInvoice`)

**Input:**
- `id` (path variable)

**Validation:**
- Invoice tồn tại
- `paidAmount == 0` (chưa có payment success)

**Logic:**
- Set `status = voided`
- Invoice không thể thanh toán sau khi void

**Output:**
- 200 OK (không có body)

---

### 5. Danh sách hóa đơn (`list`)

**Input:**
- Query params: `code`, `customerId`, `status`, `dateFrom`, `dateTo`
- Pagination: `page`, `size`, `sort`

**Logic:**
- Chuyển `dateFrom` → UTC start-of-day
- Chuyển `dateTo` → UTC end-of-day (plusDays(1))
- Query với filter optional (IS NULL OR pattern)
- Map to Response

**Output:**
- Page<InvoiceResponse>

---

### 6. Chi tiết hóa đơn (`detail`)

**Input:**
- `id` (path variable)
- `currentUserId` (từ principal)
- `isCustomer` (từ principal authorities)

**Validation:**
- Invoice tồn tại, không bị soft delete
- Nếu customer → phải sở hữu invoice

**Output:**
- InvoiceResponse đầy đủ (items + transactions)

---

## 💰 Tính toán tiền (Business Logic)

### Tính lineTotal cho từng dòng hàng:
```
lineBase = (unitPrice × quantity) - discountAmount
lineTax = lineBase × (taxRate / 100)
lineTotal = lineBase + lineTax
```

### Tính tổng hóa đơn:
```
subtotal = Σ(lineTotal của tất cả items)
total = subtotal + taxAmount - discountAmount
```

### Cập nhật khi thanh toán:
```
paidAmount = paidAmount + paymentAmount
dueAmount = total - paidAmount
```

### Cập nhật status:
- `paidAmount == 0` → `issued`
- `0 < paidAmount < total` → `partial_paid`
- `paidAmount >= total` → `paid`

---

## 🔒 Bảo mật & Validation

### Quyền truy cập:
- **Admin/Staff**: full access (tạo, void, xem tất cả)
- **Customer**: chỉ xem hóa đơn của mình, được thêm payment
- **Tailor**: chỉ xem (tham khảo)

### Validation nghiệp vụ:
- Không void invoice đã có payment
- Payment amount không vượt dueAmount
- Total không được âm
- Items không rỗng khi tạo invoice

### Callback endpoint:
- Hiện tại không yêu cầu auth (public)
- **Lưu ý**: Production nên thêm:
  - IP whitelist (chỉ nhận từ IP của VNPay/MoMo/ZaloPay)
  - Signature verification (verify chữ ký từ cổng)
  - Secret key validation

---

## 📦 Database Schema

### Bảng `invoices`:
- `id`, `code` (unique), `order_id` (FK, nullable)
- `customer_id` (FK), `staff_id` (FK)
- `status` (enum), `currency`
- `subtotal`, `tax_amount`, `discount_amount`, `total`, `paid_amount`, `due_amount` (DECIMAL 15,2)
- `issued_at` (TIMESTAMP), `due_date` (DATE)
- `notes`, `is_deleted`, `created_at`, `updated_at`

### Bảng `invoice_items`:
- `id`, `invoice_id` (FK)
- `name`, `quantity`, `unit_price`, `discount_amount`, `tax_rate`, `line_total`
- `created_at`, `updated_at`

### Bảng `payment_transactions`:
- `id`, `invoice_id` (FK)
- `provider` (enum), `status` (enum), `amount`
- `provider_ref` (unique), `request_payload`, `response_payload` (TEXT)
- `paid_at` (TIMESTAMP, nullable), `created_by` (FK, nullable)
- `created_at`, `updated_at`

**Indexes:**
- `invoices.customer_id`, `invoices.staff_id`, `invoices.code`
- `invoice_items.invoice_id`
- `payment_transactions.invoice_id`, `payment_transactions.provider_ref`

---

## 🧪 Kiểm thử nhanh

### Test Case 1: Tạo và thanh toán đủ
1. `POST /invoices` → invoice `issued`, `dueAmount = total`
2. `POST /invoices/payments` (cash, amount = total) → invoice `paid`, `dueAmount = 0`

### Test Case 2: Thanh toán nhiều lần
1. Tạo invoice `total = 1,000,000`
2. Payment 1: `amount = 300,000` → `partial_paid`, `dueAmount = 700,000`
3. Payment 2: `amount = 700,000` → `paid`, `dueAmount = 0`

### Test Case 3: Thanh toán online
1. `POST /invoices/payments` (vnpay) → transaction `pending`, có `paymentUrl`
2. `POST /invoices/payments/callback` (success=true) → transaction `success`, invoice `paid`

### Test Case 4: Void invoice
1. Tạo invoice (chưa thanh toán)
2. `POST /invoices/{id}/void` → `status = voided` ✅
3. Thử thanh toán → Lỗi: "Invoice is not payable"

### Test Case 5: Void invoice đã thanh toán
1. Tạo invoice và thanh toán một phần
2. `POST /invoices/{id}/void` → Lỗi: "Cannot void an invoice with successful payments"

### Test Case 6: Filter và pagination
1. `GET /invoices?status=paid&customerId=1&page=0&size=10`
2. Kiểm tra response có đúng filter và phân trang

---

## 🚀 Hướng phát triển

### Tích hợp cổng thanh toán thật:
- Tách `PaymentProviderPort` interface (Strategy pattern)
- Implement `VnPayProvider`, `MoMoProvider`, `ZaloPayProvider`
- Ký/verify signature từ cổng
- Map status code từ cổng sang `PaymentStatus`

### Refund:
- `refundInvoice(id, amount)`: hoàn tiền một phần hoặc toàn bộ
- Tạo transaction `provider = refund`, `status = success`
- Trừ `paidAmount`, cộng `dueAmount`
- Set invoice `status = refunded` nếu hoàn đủ

### Credit Note:
- Tạo credit note khi refund
- Gắn với invoice gốc
- Có thể dùng credit note để thanh toán invoice khác

### Báo cáo:
- Tổng doanh thu theo ngày/tuần/tháng
- Số hóa đơn theo trạng thái
- Top khách hàng, top sản phẩm

### Notification:
- Email/SMS khi tạo invoice
- Thông báo khi thanh toán thành công/thất bại
- Nhắc nhở hóa đơn sắp đến hạn

---

## 📋 Checklist tuân thủ .cursorrules

- ✅ Lombok: `@Data/@Builder` cho DTO, `@Getter/@Setter/@Builder` cho Entity
- ✅ `@RequiredArgsConstructor` cho Service/Controller
- ✅ `@Slf4j` cho logging
- ✅ `@Transactional` cho service methods
- ✅ `CommonResponse` + `TraceIdUtil` cho response
- ✅ Không wildcard import
- ✅ Max 120 ký tự/line, 4 spaces
- ✅ Soft delete pattern (`isDeleted`)
- ✅ Validation với Jakarta Validation
- ✅ Error handling với custom exceptions
- ✅ Flyway migration cho schema changes

---

Tài liệu này đi kèm mã nguồn trong `modules/billing` và migration `V8__billing_tables.sql`. Có thể giao trực tiếp cho khách hàng như "hồ sơ sử dụng" module Billing.

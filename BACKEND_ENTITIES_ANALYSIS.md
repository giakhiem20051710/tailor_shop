# PHÂN TÍCH ENTITY BACKEND CHO HỆ THỐNG TAILOR SHOP

## TỔNG QUAN
Sau khi phân tích toàn bộ code frontend, hệ thống cần **13 entity chính** cho backend.

---

## DANH SÁCH ENTITY

### 1. **User (Người dùng)**
**Mô tả:** Quản lý tất cả người dùng trong hệ thống
**Các trường chính:**
- id, username, password (hashed)
- name, email, phone
- role (admin, staff, tailor, customer)
- createdAt, updatedAt
- status (active/inactive)

**Quan hệ:**
- One-to-Many với Order (customerId)
- One-to-Many với Order (assignedTailor)

---

### 2. **Order (Đơn đặt may)**
**Mô tả:** Đơn hàng may đo của khách hàng
**Các trường chính:**
- id, customerId (FK → User)
- name, phone, email, address
- productName, productType, description
- budget, total, deposit
- status (Mới, Đang may, Hoàn thành, Hủy)
- receive (ngày khách tới đo/đặt may)
- due (ngày hẹn)
- appointmentType (pickup/delivery/fitting)
- appointmentTime, appointmentDate
- assignedTailor (FK → User)
- promoCode
- notes, correctionNotes
- sampleImages (JSON array)
- createdAt, completedAt

**Quan hệ:**
- Many-to-One với User (customer)
- Many-to-One với User (tailor)
- One-to-One với Invoice
- One-to-Many với Measurement

---

### 3. **Measurement (Số đo)**
**Mô tả:** Số đo chi tiết của khách hàng cho đơn hàng
**Các trường chính:**
- id, orderId (FK → Order)
- height, weight
- chest, waist, hips
- shoulder, sleeve
- pantsLength, shirtLength
- neck, waistband, inseam, thigh
- createdAt, updatedAt

**Quan hệ:**
- Many-to-One với Order

---

### 4. **Product (Sản phẩm)**
**Mô tả:** Sản phẩm/thiết kế may đo (collections, new arrivals)
**Các trường chính:**
- id, key, name, slug
- description, tag
- price, priceRange
- image, gallery (JSON array)
- occasion (wedding, office, party, daily)
- category (ao-dai, vest, dam, everyday)
- budget (low, mid, high)
- type (collection, newArrival)
- rating, sold
- createdAt, updatedAt

**Quan hệ:**
- One-to-Many với Favorite

---

### 5. **Fabric (Vải may đo)**
**Mô tả:** Cuộn vải có sẵn tại tiệm
**Các trường chính:**
- id, key, name
- desc, tag
- image, gallery (JSON array)
- videoUrl
- price, unit (đ/m)
- sold, rating
- totalStock (Tổng mét vải nhập)
- availableStock (Tổng - Đã bán - Đang giữ)
- properties (JSON: stretch, thickness, drape)
- specs (JSON: composition, width, weight)
- suggestions (JSON: should, avoid)
- reviews (JSON array)
- createdAt, updatedAt

**Quan hệ:**
- One-to-Many với FabricHold
- One-to-Many với FabricVisit

---

### 6. **FabricHold (Đặt giữ vải)**
**Mô tả:** Yêu cầu đặt giữ cuộn vải
**Các trường chính:**
- id, fabricId (FK → Fabric)
- customerId (FK → User)
- type ("hold")
- status (pending, confirmed, cancelled)
- createdAt, expiresAt

**Quan hệ:**
- Many-to-One với Fabric
- Many-to-One với User

---

### 7. **FabricVisit (Hẹn xem vải)**
**Mô tả:** Yêu cầu hẹn xem vải tại tiệm
**Các trường chính:**
- id, fabricId (FK → Fabric)
- customerId (FK → User)
- type ("visit")
- visitDate, visitTime
- status (pending, confirmed, completed, cancelled)
- createdAt

**Quan hệ:**
- Many-to-One với Fabric
- Many-to-One với User

---

### 8. **Invoice (Hóa đơn)**
**Mô tả:** Hóa đơn thanh toán cho đơn hàng
**Các trường chính:**
- id, orderId (FK → Order, nullable)
- customerName, phone
- product, dueDate
- total, note
- status (pending, processing, paid)
- createdAt, updatedAt

**Quan hệ:**
- One-to-One với Order (optional)
- One-to-Many với Transaction

---

### 9. **Transaction (Giao dịch thanh toán)**
**Mô tả:** Giao dịch thanh toán cho hóa đơn
**Các trường chính:**
- id, invoiceId (FK → Invoice)
- amount
- method (BANK, MOMO, CASH, VNPAY, ZALOPAY, etc.)
- reference (mã giao dịch/nội dung CK)
- note
- createdAt

**Quan hệ:**
- Many-to-One với Invoice

---

### 10. **Promotion (Khuyến mãi/Ưu đãi)**
**Mô tả:** Chương trình khuyến mãi theo dịp lễ
**Các trường chính:**
- id, title, description
- discount (percentage hoặc amount)
- period (startDate, endDate)
- category, segment
- minBill, channel
- badge, occasionKey
- type (seasonal, bundle, campaign, personal)
- image
- isActive
- createdAt, updatedAt

**Quan hệ:**
- Many-to-Many với Order (qua promoCode)

---

### 11. **Style (Mẫu thiết kế)**
**Mô tả:** Mẫu thiết kế/kiểu dáng có sẵn
**Các trường chính:**
- id, name, category
- image, description
- price
- createdAt, updatedAt

**Quan hệ:**
- Có thể liên kết với Order (productType)

---

### 12. **Favorite (Yêu thích)**
**Mô tả:** Sản phẩm khách hàng yêu thích
**Các trường chính:**
- id, customerId (FK → User)
- productKey (reference đến Product)
- createdAt

**Quan hệ:**
- Many-to-One với User
- Many-to-One với Product (qua productKey)

---

### 13. **Appointment (Lịch hẹn) - Tùy chọn**
**Mô tả:** Lịch hẹn độc lập (có thể embedded trong Order)
**Các trường chính:**
- id, orderId (FK → Order)
- customerId (FK → User)
- tailorId (FK → User, nullable)
- type (fitting, pickup, delivery)
- appointmentDate, appointmentTime
- status (scheduled, completed, cancelled)
- notes
- createdAt, updatedAt

**Quan hệ:**
- Many-to-One với Order
- Many-to-One với User (customer)
- Many-to-One với User (tailor)

**Lưu ý:** Appointment có thể được quản lý như một phần của Order hoặc là entity riêng tùy vào yêu cầu thiết kế.

---

## TỔNG KẾT

### Số lượng entity: **13 entity chính**

1. User
2. Order
3. Measurement
4. Product
5. Fabric
6. FabricHold
7. FabricVisit
8. Invoice
9. Transaction
10. Promotion
11. Style
12. Favorite
13. Appointment (tùy chọn, có thể embedded trong Order)

### Entity phụ/Embedded (không cần bảng riêng):
- **SampleImages** - Lưu trong Order (JSON array)
- **OrderStatus** - Enum trong Order
- **PaymentMethod** - Enum trong Transaction

---

## GỢI Ý THIẾT KẾ DATABASE

### Bảng chính:
1. `users` - Quản lý người dùng
2. `orders` - Đơn đặt may
3. `measurements` - Số đo
4. `products` - Sản phẩm
5. `fabrics` - Vải may đo
6. `fabric_holds` - Đặt giữ vải
7. `fabric_visits` - Hẹn xem vải
8. `invoices` - Hóa đơn
9. `transactions` - Giao dịch
10. `promotions` - Khuyến mãi
11. `styles` - Mẫu thiết kế
12. `favorites` - Yêu thích
13. `appointments` - Lịch hẹn (tùy chọn)

### Indexes đề xuất:
- `orders.customerId`
- `orders.assignedTailor`
- `orders.status`
- `orders.appointmentDate`
- `invoices.orderId`
- `transactions.invoiceId`
- `favorites.customerId`
- `fabric_holds.fabricId`
- `fabric_visits.fabricId`

---

## LƯU Ý QUAN TRỌNG

1. **Authentication & Authorization:** Cần JWT/Token-based auth cho User
2. **File Storage:** Cần lưu trữ hình ảnh (Product, Fabric, Order sampleImages)
3. **Payment Integration:** Cần tích hợp với các cổng thanh toán (VNPay, MoMo, ZaloPay, etc.)
4. **Email/SMS:** Có thể cần gửi thông báo cho khách hàng
5. **Audit Log:** Có thể cần bảng audit_log để tracking thay đổi


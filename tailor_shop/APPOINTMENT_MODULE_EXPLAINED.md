# Appointment Module - Giải Thích Chi Tiết Cho Người Dùng

## 📋 Module Appointment Là Gì?

Module **Appointment** (Lịch Hẹn) giúp quản lý việc đặt lịch hẹn giữa khách hàng và cửa hàng may. Đây là hệ thống giúp:
- Khách hàng đặt lịch đến cửa hàng để đo/quỹ, nhận hàng, hoặc giao hàng
- Cửa hàng quản lý lịch làm việc của nhân viên và thợ may
- Tránh trùng lịch và đảm bảo nhân viên có thời gian phục vụ khách hàng

---

## 🎯 Các Tính Năng Chính

### 1. **Quản Lý Lịch Hẹn (Appointments)**

#### Lịch hẹn là gì?
Lịch hẹn là một cuộc hẹn giữa khách hàng và cửa hàng để thực hiện một công việc cụ thể. Lịch hẹn có thể được assign cho nhân viên (staff) hoặc thợ may (tailor) tùy theo công việc.

#### Các loại lịch hẹn:
- **Fitting (Đo/Quỹ)**: Khách hàng đến để nhân viên đo số đo, thử quần áo (thường do nhân viên phục vụ)
- **Pickup (Nhận hàng)**: Khách hàng đến để nhận hàng đã may xong (nhân viên giao hàng)
- **Delivery (Giao hàng)**: Cửa hàng giao hàng đến địa chỉ khách hàng (nhân viên giao hàng)

#### Trạng thái lịch hẹn:
- **Scheduled (Đã đặt lịch)**: Lịch hẹn đã được tạo và chờ thực hiện
- **Completed (Hoàn thành)**: Đã hoàn thành công việc
- **Cancelled (Đã hủy)**: Lịch hẹn đã bị hủy

#### Ví dụ thực tế:
```
Khách hàng Nguyễn Văn A đặt lịch:
- Ngày: 25/12/2024
- Giờ: 9:00 sáng
- Loại: Fitting (Đo quần áo)
- Thợ may: Nguyễn Thị B
- Ghi chú: Đo quần áo cho khách hàng
```

### 2. **Quản Lý Khung Giờ Làm Việc (Working Slots)**

#### Khung giờ làm việc là gì?
Khung giờ làm việc định nghĩa thời gian mà nhân viên hoặc thợ may có sẵn để phục vụ khách hàng. **Lưu ý**: Trong hệ thống, working slots được quản lý theo tailor, nhưng thực tế **nhân viên (staff) mới là người trực tiếp phục vụ khách hàng** tại cửa hàng (đo quần áo, giao hàng, v.v.). Thợ may chủ yếu làm việc may, có thể được assign trong appointment để tư vấn kỹ thuật hoặc theo dõi đơn hàng.

#### Thông tin trong khung giờ làm việc:
- **Ngày trong tuần**: Thứ 2, Thứ 3, ..., Chủ nhật
- **Giờ bắt đầu**: 8:00
- **Giờ kết thúc**: 17:00
- **Giờ nghỉ**: 12:00 - 13:00 (nghỉ trưa)
- **Hiệu lực**: Từ ngày nào đến ngày nào (có thể để trống nếu áp dụng mãi mãi)

#### Ví dụ thực tế:
```
Nhân viên/Thợ may có khung giờ làm việc:
- Thứ 2 đến Thứ 6: 8:00 - 17:00 (nghỉ trưa 12:00 - 13:00)
- Thứ 7: 8:00 - 12:00 (nửa ngày)
- Chủ nhật: Nghỉ

Lưu ý: Trong hệ thống, working slots được quản lý theo tailor, nhưng thực tế nhân viên (staff) mới là người trực tiếp phục vụ khách hàng tại cửa hàng.
```

### 3. **Xem Lịch Theo Ngày (Schedule)**

#### Schedule là gì?
Schedule cho phép xem tất cả các lịch hẹn trong một ngày cụ thể. Trong hệ thống, schedule được filter theo tailor, nhưng thực tế **nhân viên (staff) mới là người trực tiếp phục vụ khách hàng**.

#### Ví dụ:
```
Xem lịch ngày 25/12/2024:
- 9:00 - Fitting: Khách hàng Nguyễn Văn A (Nhân viên phục vụ: Trần Thị C)
- 11:00 - Pickup: Khách hàng Trần Thị C (Nhân viên phục vụ: Lê Văn D)
- 14:00 - Fitting: Khách hàng Lê Văn D (Nhân viên phục vụ: Trần Thị C)
```

### 4. **Xem Slots Còn Trống (Available Slots)**

#### Available Slots là gì?
Available Slots hiển thị các khung giờ còn trống mà khách hàng có thể đặt lịch.

#### Cách hoạt động:
1. Hệ thống lấy khung giờ làm việc (working slots) - trong hệ thống được quản lý theo tailor
2. Loại bỏ các giờ nghỉ (break time)
3. Loại bỏ các giờ đã có lịch hẹn
4. Chia thành các slots nhỏ (ví dụ: mỗi slot 30 phút)
5. Hiển thị slots còn trống và slots đã bận

**Lưu ý**: Available slots được tính dựa trên working slots của tailor trong hệ thống, nhưng thực tế **nhân viên (staff) mới là người trực tiếp phục vụ khách hàng** tại các slots này.

#### Ví dụ:
```
Khung giờ làm việc: 8:00 - 17:00 (nghỉ 12:00 - 13:00)
Đã có lịch hẹn: 9:00, 11:00, 14:00

Available Slots (nhân viên có thể phục vụ):
- 8:00 - 8:30: ✅ Trống (nhân viên sẵn sàng phục vụ)
- 8:30 - 9:00: ✅ Trống (nhân viên sẵn sàng phục vụ)
- 9:00 - 9:30: ❌ Đã bận (có lịch hẹn, nhân viên đang phục vụ)
- 9:30 - 10:00: ✅ Trống (nhân viên sẵn sàng phục vụ)
- ...
- 12:00 - 13:00: ❌ Nghỉ trưa
- ...
```

---

## 🔐 Ai Có Thể Làm Gì?

### **Admin (Quản trị viên)**
- ✅ Xem tất cả lịch hẹn
- ✅ Tạo, sửa, xóa lịch hẹn
- ✅ Quản lý khung giờ làm việc của tất cả thợ may
- ✅ Xem lịch của bất kỳ thợ may nào

### **Staff (Nhân viên)**
- ✅ Xem tất cả lịch hẹn
- ✅ Tạo, sửa, xóa lịch hẹn
- ✅ Quản lý khung giờ làm việc của tất cả thợ may
- ✅ Xem lịch của bất kỳ thợ may nào

### **Tailor (Thợ may)**
- ✅ Xem lịch hẹn được giao cho mình
- ✅ Cập nhật trạng thái lịch hẹn (scheduled → completed)
- ✅ Quản lý khung giờ làm việc của chính mình
- ✅ Xem lịch của chính mình

### **Customer (Khách hàng)**
- ✅ Xem lịch hẹn của chính mình
- ❌ Không thể tạo, sửa, xóa lịch hẹn (phải nhờ Admin/Staff/Tailor)

---

## 📝 Quy Trình Sử Dụng Thực Tế

### **Tình huống 1: Khách hàng muốn đặt lịch đo quần áo**

**Bước 1: Admin/Staff kiểm tra slots còn trống**
```
GET /api/v1/appointments/available-slots?tailorId=2&date=2024-12-25
→ Xem các giờ còn trống của thợ may ngày 25/12
```

**Bước 2: Admin/Staff tạo lịch hẹn**
```
POST /api/v1/appointments
{
  "orderId": 1,
  "customerId": 1,
  "tailorId": 2,
  "type": "fitting",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "09:00:00",
  "notes": "Đo quần áo cho khách hàng"
}
```

**Bước 3: Hệ thống kiểm tra**
- ✅ Ngày hẹn phải >= hôm nay
- ✅ Giờ hẹn phải trong khung giờ làm việc của thợ may
- ✅ Giờ hẹn không được trùng với lịch hẹn khác

**Bước 4: Lịch hẹn được tạo thành công**
- Khách hàng nhận thông báo
- Thợ may thấy lịch trong schedule của mình

### **Tình huống 2: Thợ may hoàn thành công việc**

**Bước 1: Thợ may cập nhật trạng thái**
```
PATCH /api/v1/appointments/1/status
{
  "status": "completed",
  "notes": "Đã hoàn thành đo quần áo"
}
```

**Bước 2: Lịch hẹn được đánh dấu hoàn thành**
- Slot đó trở thành trống cho các lịch hẹn khác (nếu cần)

### **Tình huống 3: Thợ may thiết lập lịch làm việc**

**Bước 1: Thợ may tạo khung giờ làm việc**
```
POST /api/v1/appointments/working-slots
{
  "tailorId": 2,
  "dayOfWeek": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "breakStartTime": "12:00:00",
  "breakEndTime": "13:00:00",
  "isActive": true
}
```

**Bước 2: Lặp lại cho các ngày khác**
- Tạo working slot cho Thứ 2, Thứ 3, ..., Chủ nhật

**Bước 3: Hệ thống sử dụng working slots**
- Khi khách hàng đặt lịch, hệ thống chỉ cho phép đặt trong khung giờ làm việc
- Available slots chỉ hiển thị các giờ trong working slots

---

## ⚠️ Các Quy Tắc Quan Trọng

### **1. Kiểm Tra Trùng Lịch**
- ❌ Không thể đặt 2 lịch hẹn cùng thợ may, cùng ngày, cùng giờ
- ✅ Hệ thống tự động kiểm tra và từ chối nếu trùng

### **2. Kiểm Tra Khung Giờ Làm Việc**
- ❌ Không thể đặt lịch ngoài khung giờ làm việc của thợ may
- ❌ Không thể đặt lịch trong giờ nghỉ (break time)
- ✅ Hệ thống tự động kiểm tra và từ chối nếu không hợp lệ

### **3. Kiểm Tra Ngày Hẹn**
- ❌ Không thể đặt lịch trong quá khứ
- ✅ Chỉ có thể đặt lịch từ hôm nay trở đi

### **4. Kiểm Tra Quyền Sở Hữu**
- ❌ Khách hàng không thể xem lịch hẹn của khách hàng khác
- ✅ Chỉ Admin/Staff/Tailor mới có thể tạo lịch hẹn

---

## 🔍 Các API Endpoints Chi Tiết

### **Appointments APIs**

#### 1. Lấy Danh Sách Lịch Hẹn
```
GET /api/v1/appointments
```
**Mục đích**: Xem tất cả lịch hẹn với các bộ lọc

**Filters có thể dùng**:
- `tailorId`: Lọc theo thợ may
- `customerId`: Lọc theo khách hàng
- `date`: Lọc theo ngày
- `status`: Lọc theo trạng thái (scheduled/completed/cancelled)
- `type`: Lọc theo loại (fitting/pickup/delivery)

**Ví dụ**:
```
GET /api/v1/appointments?tailorId=2&date=2024-12-25&status=scheduled
→ Lấy tất cả lịch hẹn đã đặt của thợ may ID=2 ngày 25/12
```

#### 2. Xem Chi Tiết Lịch Hẹn
```
GET /api/v1/appointments/{id}
```
**Mục đích**: Xem thông tin chi tiết của một lịch hẹn cụ thể

**Ví dụ**:
```
GET /api/v1/appointments/1
→ Xem chi tiết lịch hẹn ID=1
```

#### 3. Tạo Lịch Hẹn Mới
```
POST /api/v1/appointments
```
**Mục đích**: Tạo một lịch hẹn mới

**Body cần có**:
- `orderId`: ID đơn hàng (bắt buộc)
- `customerId`: ID khách hàng (bắt buộc)
- `tailorId`: ID thợ may (tùy chọn, có thể assign sau)
- `type`: Loại lịch hẹn (fitting/pickup/delivery)
- `appointmentDate`: Ngày hẹn (YYYY-MM-DD)
- `appointmentTime`: Giờ hẹn (HH:mm:ss)
- `notes`: Ghi chú (tùy chọn)

**Ví dụ**:
```json
{
  "orderId": 1,
  "customerId": 1,
  "tailorId": 2,
  "type": "fitting",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "09:00:00",
  "notes": "Đo quần áo cho khách hàng"
}
```

#### 4. Cập Nhật Lịch Hẹn
```
PUT /api/v1/appointments/{id}
```
**Mục đích**: Sửa thông tin lịch hẹn (ngày, giờ, thợ may, ...)

**Body**: Giống như tạo mới

#### 5. Cập Nhật Trạng Thái Lịch Hẹn
```
PATCH /api/v1/appointments/{id}/status
```
**Mục đích**: Chỉ cập nhật trạng thái (scheduled → completed/cancelled)

**Body**:
```json
{
  "status": "completed",
  "notes": "Đã hoàn thành"
}
```

#### 6. Xóa Lịch Hẹn
```
DELETE /api/v1/appointments/{id}
```
**Mục đích**: Hủy lịch hẹn (soft delete)

#### 7. Xem Lịch Theo Ngày
```
GET /api/v1/appointments/schedule?tailorId=2&date=2024-12-25&type=fitting
```
**Mục đích**: Xem tất cả lịch hẹn của một thợ may trong một ngày

**Parameters**:
- `tailorId`: ID thợ may (bắt buộc)
- `date`: Ngày cần xem (YYYY-MM-DD, bắt buộc)
- `type`: Lọc theo loại (tùy chọn)

#### 8. Xem Slots Còn Trống
```
GET /api/v1/appointments/available-slots?tailorId=2&date=2024-12-25&duration=30
```
**Mục đích**: Xem các khung giờ còn trống để đặt lịch

**Parameters**:
- `tailorId`: ID thợ may (bắt buộc)
- `date`: Ngày cần xem (YYYY-MM-DD, bắt buộc)
- `duration`: Độ dài mỗi slot (phút, tùy chọn, mặc định 30)

**Response**:
```json
[
  {
    "startTime": "08:00:00",
    "endTime": "08:30:00",
    "available": true
  },
  {
    "startTime": "09:00:00",
    "endTime": "09:30:00",
    "available": false
  }
]
```

### **Working Slots APIs**

#### 1. Lấy Danh Sách Khung Giờ Làm Việc
```
GET /api/v1/appointments/working-slots?tailorId=2
```
**Mục đích**: Xem tất cả khung giờ làm việc của một thợ may

#### 2. Xem Chi Tiết Khung Giờ Làm Việc
```
GET /api/v1/appointments/working-slots/{id}
```
**Mục đích**: Xem thông tin chi tiết một khung giờ làm việc

#### 3. Tạo Khung Giờ Làm Việc Mới
```
POST /api/v1/appointments/working-slots
```
**Mục đích**: Tạo khung giờ làm việc mới cho thợ may

**Body**:
```json
{
  "tailorId": 2,
  "dayOfWeek": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "breakStartTime": "12:00:00",
  "breakEndTime": "13:00:00",
  "isActive": true,
  "effectiveFrom": "2024-12-01",
  "effectiveTo": "2024-12-31"
}
```

**Giải thích**:
- `dayOfWeek`: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
- `effectiveFrom/To`: Thời gian hiệu lực (có thể để null nếu áp dụng mãi mãi)

#### 4. Cập Nhật Khung Giờ Làm Việc
```
PUT /api/v1/appointments/working-slots/{id}
```
**Mục đích**: Sửa khung giờ làm việc

#### 5. Xóa Khung Giờ Làm Việc
```
DELETE /api/v1/appointments/working-slots/{id}
```
**Mục đích**: Xóa khung giờ làm việc

---

## 🧪 Ví Dụ Test Thực Tế

### **Test Case 1: Tạo lịch hẹn thành công**

**Bước 1**: Tạo working slot cho thợ may
```json
POST /api/v1/appointments/working-slots
{
  "tailorId": 2,
  "dayOfWeek": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "breakStartTime": "12:00:00",
  "breakEndTime": "13:00:00",
  "isActive": true
}
```

**Bước 2**: Tạo lịch hẹn
```json
POST /api/v1/appointments
{
  "orderId": 1,
  "customerId": 1,
  "tailorId": 2,
  "type": "fitting",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "09:00:00"
}
```

**Kết quả**: ✅ Thành công, lịch hẹn được tạo

### **Test Case 2: Tạo lịch hẹn trùng giờ**

**Bước 1**: Đã có lịch hẹn lúc 9:00 của thợ may ID=2 ngày 25/12

**Bước 2**: Tạo lịch hẹn khác cùng giờ
```json
POST /api/v1/appointments
{
  "orderId": 2,
  "customerId": 2,
  "tailorId": 2,
  "type": "fitting",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "09:00:00"
}
```

**Kết quả**: ❌ Lỗi 400 - "Appointment time conflicts with existing appointment"

### **Test Case 3: Tạo lịch hẹn ngoài giờ làm việc**

**Bước**: Tạo lịch hẹn lúc 7:00 (trước giờ làm việc 8:00)
```json
POST /api/v1/appointments
{
  "orderId": 1,
  "customerId": 1,
  "tailorId": 2,
  "type": "fitting",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "07:00:00"
}
```

**Kết quả**: ❌ Lỗi 400 - "Appointment time is outside tailor's working hours"

### **Test Case 4: Khách hàng cố tạo lịch hẹn**

**Bước**: Customer đăng nhập và gọi API tạo lịch hẹn
```json
POST /api/v1/appointments
{
  "orderId": 1,
  "customerId": 1,
  ...
}
```

**Kết quả**: ❌ Lỗi 403 - "Access Denied" (Customer không có quyền)

---

## 📊 Cấu Trúc Dữ Liệu

### **Appointment Response**
```json
{
  "id": 1,
  "orderId": 1,
  "orderCode": "ORD-2024-001",
  "customer": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "phone": "0912345678"
  },
  "tailor": {
    "id": 2,
    "name": "Nguyễn Thị B"
  },
  "type": "fitting",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "09:00:00",
  "status": "scheduled",
  "notes": "Đo quần áo cho khách hàng",
  "createdAt": "2024-12-20T10:00:00Z",
  "updatedAt": "2024-12-20T10:00:00Z"
}
```

### **Working Slot Response**
```json
{
  "id": 1,
  "tailor": {
    "id": 2,
    "name": "Nguyễn Thị B"
  },
  "dayOfWeek": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "breakStartTime": "12:00:00",
  "breakEndTime": "13:00:00",
  "isActive": true,
  "effectiveFrom": "2024-12-01",
  "effectiveTo": "2024-12-31",
  "createdAt": "2024-12-01T08:00:00Z",
  "updatedAt": "2024-12-01T08:00:00Z"
}
```

### **Available Slot Response**
```json
[
  {
    "startTime": "08:00:00",
    "endTime": "08:30:00",
    "available": true
  },
  {
    "startTime": "08:30:00",
    "endTime": "09:00:00",
    "available": true
  },
  {
    "startTime": "09:00:00",
    "endTime": "09:30:00",
    "available": false
  }
]
```

---

## 💡 Tips & Best Practices

### **Cho Admin/Staff**:
1. ✅ Luôn kiểm tra available slots trước khi tạo lịch hẹn
2. ✅ Tạo working slots cho thợ may trước khi cho phép đặt lịch
3. ✅ Cập nhật trạng thái lịch hẹn ngay sau khi hoàn thành
4. ✅ Kiểm tra conflict trước khi cập nhật giờ hẹn

### **Cho Tailor**:
1. ✅ Thiết lập working slots đầy đủ cho tất cả các ngày làm việc
2. ✅ Cập nhật trạng thái lịch hẹn sau khi hoàn thành công việc
3. ✅ Xem schedule hàng ngày để chuẩn bị

### **Cho Customer**:
1. ✅ Liên hệ Admin/Staff để đặt lịch hẹn
2. ✅ Xem lịch hẹn của mình để nhớ lịch
3. ✅ Thông báo sớm nếu cần hủy lịch hẹn

---

## 🔗 Liên Kết Với Các Module Khác

- **Order Module**: Mỗi appointment phải liên kết với một order
- **User Module**: Appointment liên kết với customer và tailor (users)
- **Measurement Module**: Có thể tạo measurement khi tạo order (có appointment)

---

## ❓ Câu Hỏi Thường Gặp (FAQ)

**Q: Khách hàng có thể tự đặt lịch hẹn không?**
A: Không, chỉ Admin/Staff/Tailor mới có thể tạo lịch hẹn. Khách hàng cần liên hệ cửa hàng.

**Q: Có thể đặt nhiều lịch hẹn cùng lúc cho một thợ may không?**
A: Không, mỗi thợ may chỉ có thể có một lịch hẹn tại một thời điểm cụ thể.

**Q: Làm sao để biết thợ may có rảnh không?**
A: Sử dụng API `GET /api/v1/appointments/available-slots` để xem các slots còn trống.

**Q: Có thể đặt lịch hẹn trong quá khứ không?**
A: Không, chỉ có thể đặt lịch từ hôm nay trở đi.

**Q: Working slot có bắt buộc không?**
A: Không bắt buộc, nhưng nếu không có working slot thì không thể đặt lịch hẹn cho thợ may đó.

**Q: Có thể có nhiều working slots cho cùng một ngày không?**
A: Có, nếu sử dụng `effectiveFrom/To` để tạo các khung giờ khác nhau cho các khoảng thời gian khác nhau.

---

## 📞 Hỗ Trợ

Nếu có thắc mắc hoặc gặp vấn đề khi sử dụng module Appointment, vui lòng liên hệ:
- Admin: admin@tailorshop.com
- Support: support@tailorshop.com

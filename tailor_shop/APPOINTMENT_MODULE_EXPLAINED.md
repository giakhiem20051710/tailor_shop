# Appointment Module Explained

Tài liệu ngắn gọn, giao cho khách hàng/dev mới để hiểu nhanh cách hoạt động module Lịch hẹn & Khung giờ làm việc.

## 1. Mục tiêu & phạm vi
- Đặt lịch giữa khách hàng và nhân viên (staff) theo đơn hàng hoặc nhu cầu.
- Kiểm tra trùng giờ, tuân thủ giờ làm, chặn ngày nghỉ/đóng cửa.
- Quản lý khung giờ làm việc (working slots) theo từng nhân viên, hỗ trợ bulk, reset, đóng ngày.
- Tra cứu lịch, slot trống để khách đặt.

## 2. Kiến trúc & thành phần
- Package `modules.appointment`
  - `domain`: `AppointmentEntity`, `WorkingSlotEntity`, enum `AppointmentStatus`, `AppointmentType`.
  - `dto`: `AppointmentRequest/Response`, `UpdateAppointmentStatusRequest`, `AvailableSlotResponse`, `WorkingSlotRequest/Response`, `BulkWorkingSlotRequest`, `CloseDateRequest`, `WorkingHoursResponse`.
  - `repository`: `AppointmentRepository`, `WorkingSlotRepository`.
  - `service`: `AppointmentService`, `AppointmentServiceImpl`.
  - `controller`: `AppointmentController`.
- Migration gần nhất: `V7__rename_tailor_to_staff.sql` (đổi tailor_id → staff_id cho bảng appointments, working_slots).
- Tuân thủ `.cursorrules`: Lombok cho DTO, @Getter/@Setter/@Builder cho entity, CommonResponse + TraceIdUtil, không wildcard import.

## 3. Mô hình dữ liệu
- `AppointmentEntity`: FK `order`, `customer`, `staff`; thuộc tính `type`, `appointmentDate`, `appointmentTime`, `status`, `notes`, `isDeleted`, `createdAt/updatedAt`.
- `WorkingSlotEntity`: FK `staff`; thuộc tính `dayOfWeek`, `startTime`, `endTime`, `breakStartTime`, `breakEndTime`, `isActive` (true mở, false đóng), `effectiveFrom/To`, `createdAt/updatedAt`.

## 4. DTO & Validation
- `AppointmentRequest`: `orderId` (req), `customerId` (req), `staffId` (optional), `type` (req), `appointmentDate` (req), `appointmentTime` (req), `notes`.
- `AppointmentResponse`: thông tin order, customer, staff, loại, ngày/giờ, trạng thái, ghi chú, audit.
- `WorkingSlotRequest`: `staffId`, `dayOfWeek`, `startTime`, `endTime`, break optional, effective optional, `isActive`.
- `WorkingSlotResponse`: staff (Party), ngày/giờ, break, active, effective, audit.
- `BulkWorkingSlotRequest`: `staffId`, danh sách `daysOfWeek`, `startTime`, `endTime`, break/effective optional, `isActive`.
- `CloseDateRequest`: `staffId`, chọn một trong: `singleDate`, `dates[]`, `weekStart/weekEnd`, hoặc `year/month`, có `reason`.
- `WorkingHoursResponse`: thông tin staff + giờ làm Mon–Sat, ưu tiên custom, fallback default.
- `UpdateAppointmentStatusRequest`: `status`, `notes`.
- `AvailableSlotResponse`: danh sách khoảng giờ và cờ `available`.

## 5. Repository & Query
- `AppointmentRepository.search`: filter optional `staffId`, `customerId`, `date`, `status`, `type`.
- `AppointmentRepository.findByStaffAndDate`, `findConflicts`: hỗ trợ kiểm tra trùng lịch.
- `WorkingSlotRepository`: tìm slot active/đóng theo staff + day + effective range; liệt kê slot đóng trong khoảng.

## 6. Luồng nghiệp vụ chính (AppointmentServiceImpl)
- `list(...)`: filter + auto gán customerId cho customer login, sort mặc định theo ngày; map response.
- `detail(...)`: kiểm tra soft delete; nếu customer thì phải sở hữu lịch.
- `create(...)`:
  1) Load order (nếu có) và validate thuộc customer.  
  2) Validate staff (role STAFF/ADMIN) nếu được gán; check `validateAppointmentTime` và `checkConflict`.  
  3) Lưu appointment `status=scheduled`.
- `update(...)`: giống create, có excludeId khi check trùng.
- `updateStatus(...)`: đổi trạng thái + notes nếu có.
- `delete(...)`: soft delete.
- `getSchedule(staffId, date, type)`: trả lịch theo ngày, filter type optional.
- `getAvailableSlots(staffId, date, durationMinutes)`:
  - Chặn Chủ nhật; nếu ngày bị đóng (slot isActive=false) → rỗng.
  - Lấy appointment đã đặt để mark booked.
  - Nếu có working slot custom (active, hợp lệ effective) → sinh slot theo duration, bỏ break, đánh dấu available nếu không booked.
  - Nếu không có custom → dùng default 07:00-23:00.
- Working Slots:
  - CRUD slot: list, detail, create, update, delete.
  - Bulk tạo slot: cùng giờ cho nhiều thứ trong tuần.
  - Reset giờ mặc định: xóa toàn bộ slot custom active của staff.
  - `getWorkingHours`: Mon–Sat, ưu tiên custom, nếu không trả default.
  - `closeDates`: tạo slot đóng cửa (isActive=false) cho các ngày chỉ định, bỏ qua Chủ nhật, skip nếu đã có slot đóng.
- Helpers:
  - `validateAppointmentTime`: chặn Chủ nhật, ngày đóng; kiểm tra trong khung giờ custom (nếu có) hoặc default.
  - `checkConflict`: tìm appointment trùng giờ cùng staff (excludeId khi update).

## 7. Controller (AppointmentController)
- Base `/api/v1/appointments`, trả `CommonResponse`.
- Endpoint chính:
  - GET `/` list (ADMIN/STAFF/TAILOR/CUSTOMER; customer chỉ thấy của mình).
  - GET `/{id}` detail.
  - POST `/` create; PUT `/{id}` update; PATCH `/{id}/status` cập nhật trạng thái.
  - DELETE `/{id}` soft delete.
  - GET `/schedule` (staffId, date, optional type).
  - GET `/available-slots` (staffId, date, optional duration).
  - Working slots:
    - GET `/working-slots` (filter staffId optional) / `{id}`
    - POST `/working-slots`, PUT `/working-slots/{id}`, DELETE `/working-slots/{id}`
    - POST `/working-slots/bulk`
    - POST `/working-slots/{staffId}/reset`
    - GET `/working-slots/{staffId}/hours`
    - POST `/working-slots/close-dates`

## 8. Bảo mật & quyền
- `@PreAuthorize`: ADMIN/STAFF/TAILOR cho quản trị lịch/slot; CUSTOMER chỉ xem lịch của mình.
- Service `detail` bảo vệ quyền customer; controller lấy `principal` để suy ra currentUserId và isCustomer.

## 9. Migrations
- `V7__rename_tailor_to_staff.sql`: thêm staff_id, copy dữ liệu từ tailor_id, drop cột cũ, cập nhật FK cho `appointments`, `working_slots`.

## 10. Kiểm thử nhanh
1) Tạo slot custom hoặc bulk cho staff.  
2) `GET /working-slots/{staffId}/hours` xem khung giờ.  
3) `GET /available-slots` cho ngày không đóng cửa.  
4) `POST /appointments` đặt lịch trong khung → thành công.  
5) `POST /working-slots/close-dates` chặn ngày → available rỗng.  
6) `POST /working-slots/{staffId}/reset` → giờ về mặc định, available theo default 07:00-23:00.

## 11. Hướng phát triển
- Giới hạn số booking song song mỗi slot.
- Thông báo (email/SMS/push) khi đặt/đổi/hủy.
- Hỗ trợ timezone rõ ràng nếu đa khu vực.
- Báo cáo: số lịch theo staff/ngày/loại, tỉ lệ hủy.

## 12. Tuân thủ .cursorrules
- Lombok cho DTO (@Data/@Builder), entity dùng @Getter/@Setter/@Builder (không @Data).
- CommonResponse + TraceIdUtil cho response.
- Max 120 ký tự/line, 4 spaces, không wildcard import.

---
Tài liệu này đi kèm mã nguồn hiện có; có thể giao trực tiếp cho khách hàng như “hồ sơ sử dụng” module Appointment.
# Appointment Module - Giải thích chi tiết (phi kỹ thuật, đã refactor `staffId`)

## 📋 Appointment là gì?
Hệ thống đặt lịch giữa **khách hàng** và **nhân viên phục vụ (staff)** của cửa hàng may:
- Đặt lịch đo/thử/nhận/giao hàng.
- Quản lý giờ làm của nhân viên, tránh trùng lịch.
- Tự động chặn ngày nghỉ, giờ nghỉ, và các ngày đóng cửa đặc biệt.

---

## 🎯 Tính năng chính

### 1) Quản lý lịch hẹn (Appointments)
- Lịch hẹn gắn với **order** và **customer**.
- Có thể gán **staff** (nhân viên) ngay hoặc để trống rồi gán sau.
- Loại lịch hẹn: `fitting` (đo/thử), `pickup` (nhận hàng), `delivery` (giao hàng).
- Trạng thái: `scheduled`, `completed`, `cancelled`.

### 2) Quản lý khung giờ làm việc (Working Slots)
- **Chỉ dùng `staffId`** (đã bỏ hoàn toàn `tailorId`).
- Nếu KHÔNG cấu hình, dùng giờ mặc định: **07:00-23:00, Thứ 2–Thứ 7; Chủ nhật nghỉ**.
- Có thể cấu hình: giờ bắt đầu/kết thúc, giờ nghỉ trưa, hiệu lực từ ngày/đến ngày.
- Đóng cửa đặc biệt: tạo slot `isActive=false` qua API `close-dates` để chặn đặt lịch theo ngày/tuần/tháng (nghỉ lễ, sửa chữa).

### 3) Xem lịch theo ngày (Schedule)
- Lọc theo `staffId` và ngày, để xem nhân viên đó có những lịch gì.

### 4) Xem slots còn trống (Available Slots)
- Tính từ working slots của staff, trừ giờ nghỉ và giờ đã được đặt lịch.
- Nếu không có working slot tùy chỉnh → fallback giờ mặc định.

---

## 🔐 Quyền (RBAC)
- **Admin**: xem/tạo/sửa/xóa lịch hẹn; quản lý working slots của mọi staff; reset giờ mặc định; đóng ngày.
- **Staff**: xem/tạo/sửa/xóa lịch hẹn; quản lý working slots của chính mình; đóng ngày của mình.
- **Tailor**: chỉ mang tính tham khảo trong lịch hẹn (không sở hữu working slot); có thể được gán role phù hợp để thao tác.
- **Customer**: xem lịch của mình; không tạo/sửa/xóa.

---

## 📝 Quy trình thực tế (ví dụ)

### Tình huống 1: Đặt lịch đo quần áo
1) Kiểm tra slots trống  
```
GET /api/v1/appointments/available-slots?staffId=2&date=2024-12-25
```
→ Xem giờ trống của staff 2 ngày 25/12.

2) Tạo lịch hẹn  
```json
POST /api/v1/appointments
{
  "orderId": 1,
  "customerId": 1,
  "staffId": 2,
  "type": "fitting",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "09:00:00",
  "notes": "Đo quần áo cho khách"
}
```

3) Hệ thống kiểm tra:
- Ngày >= hôm nay; không rơi vào ngày đóng cửa.
- Giờ trong khung làm việc (hoặc mặc định 07:00-23:00 nếu chưa cấu hình).
- Không trùng giờ với lịch khác của staff.

### Tình huống 2: Staff thiết lập giờ làm / nghỉ lễ
1) Tạo working slot tùy chỉnh  
```json
POST /api/v1/appointments/working-slots
{
  "staffId": 2,
  "dayOfWeek": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "breakStartTime": "12:00:00",
  "breakEndTime": "13:00:00",
  "isActive": true
}
```

2) Đóng ngày (nghỉ lễ)  
```json
POST /api/v1/appointments/working-slots/close-dates
{
  "staffId": 2,
  "weekStart": "2025-04-28",
  "weekEnd": "2025-05-04",
  "reason": "Nghỉ lễ 30/4 - 1/5"
}
```

3) Nếu không tạo working slot, hệ thống tự dùng giờ mặc định 07:00-23:00 (Thứ 2–Thứ 7).

---

## ⚠️ Quy tắc quan trọng
- **Không trùng lịch**: Cùng staff, cùng ngày, cùng giờ → bị chặn.
- **Giờ làm việc**: Chỉ đặt trong working slot; nếu không có slot → dùng giờ mặc định; Chủ nhật nghỉ.
- **Giờ nghỉ**: Không đặt trong break.
- **Ngày đóng cửa**: close-dates trả về available-slots rỗng và chặn tạo lịch.
- **Ngày hợp lệ**: Không đặt quá khứ.
- **Quyền xem**: Customer chỉ xem lịch của mình; Admin/Staff xem tất cả; Tailor xem lịch được gán.

---

## 🔍 API chính (đã đổi sang `staffId`)

### Appointments
- `GET /api/v1/appointments?staffId&customerId&date&status&type`
- `GET /api/v1/appointments/{id}`
- `POST /api/v1/appointments`
  - Body: `orderId` (bắt buộc), `customerId` (bắt buộc), `staffId` (tùy chọn), `type`, `appointmentDate`, `appointmentTime`, `notes`
- `PUT /api/v1/appointments/{id}` (sửa thông tin)
- `PATCH /api/v1/appointments/{id}/status`
- `DELETE /api/v1/appointments/{id}` (soft delete)
- `GET /api/v1/appointments/schedule?staffId&date&type`
- `GET /api/v1/appointments/available-slots?staffId&date&duration`

### Working Slots
- `GET /api/v1/appointments/working-slots?staffId` (staffId tùy chọn; bỏ trống = tất cả)
- `GET /api/v1/appointments/working-slots/{id}`
- `POST /api/v1/appointments/working-slots`
- `PUT /api/v1/appointments/working-slots/{id}`
- `DELETE /api/v1/appointments/working-slots/{id}`
- `POST /api/v1/appointments/working-slots/bulk`
- `POST /api/v1/appointments/working-slots/{staffId}/reset` (xóa slot tùy chỉnh, về giờ mặc định)
- `GET /api/v1/appointments/working-slots/{staffId}/hours` (xem giờ đang áp dụng)
- `POST /api/v1/appointments/working-slots/close-dates` (tạo slot isActive=false để đóng cửa)

---

## 🧪 Test cases nhanh

### Case 1: Tạo lịch hẹn thành công
```json
POST /api/v1/appointments
{
  "orderId": 1,
  "customerId": 1,
  "staffId": 2,
  "type": "fitting",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "09:00:00"
}
```
→ ✅ Thành công.

### Case 2: Trùng giờ
```json
POST /api/v1/appointments
{
  "orderId": 2,
  "customerId": 2,
  "staffId": 2,
  "type": "fitting",
  "appointmentDate": "2024-12-25",
  "appointmentTime": "09:00:00"
}
```
→ ❌ 400: "Appointment time conflicts with existing appointment".

### Case 3: Ngoài giờ làm việc tùy chỉnh
Đặt lúc 07:00 trong khi slot 08:00-17:00.  
→ ❌ 400: "Appointment time is outside staff custom working hours".

### Case 4: Customer tự tạo
Customer gọi `POST /appointments` → ❌ 403 Access Denied.

---

## 📊 Cấu trúc dữ liệu (response mẫu)

### Appointment Response
```json
{
  "id": 1,
  "orderId": 1,
  "orderCode": "ORD-2024-001",
  "customer": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "phone": "0912345678",
    "role": "customer"
  },
  "staff": {
    "id": 2,
    "name": "Nguyễn Thị B",
    "phone": "0911111111",
    "role": "staff"
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

### Working Slot Response
```json
{
  "id": 1,
  "staff": {
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

### Available Slot Response
```json
[
  { "startTime": "08:00:00", "endTime": "08:30:00", "available": true },
  { "startTime": "08:30:00", "endTime": "09:00:00", "available": true },
  { "startTime": "09:00:00", "endTime": "09:30:00", "available": false }
]
```

---

## 💡 Tips & Best Practices
- Admin/Staff: luôn kiểm tra available-slots trước khi tạo; cập nhật trạng thái ngay sau khi hoàn thành; reset về mặc định nếu cấu hình sai.
- Staff: thiết lập working slots đầy đủ; đóng ngày nghỉ qua close-dates.
- Customer: xem lịch của mình; báo sớm nếu cần hủy.

---

## 🔗 Liên kết module
- **Order**: mỗi appointment gắn với một order.
- **User**: dùng `customer` và `staff` (không còn `tailorId`).
- **Measurement**: có thể tạo measurement khi tạo order; appointment tham chiếu order đó.

---

## ❓ FAQ
- **Khách có tự đặt?** Không, chỉ Admin/Staff (Tailor nếu được cấp role phù hợp).
- **Một staff có nhiều lịch cùng giờ?** Không, bị chặn conflict.
- **Không cấu hình working slot thì sao?** Hệ thống dùng giờ mặc định 07:00-23:00 (Thứ 2–Thứ 7), Chủ nhật nghỉ.
- **Có thể có nhiều working slots một ngày?** Có, dùng `effectiveFrom/To` để thay đổi theo giai đoạn.

---

## 📞 Hỗ trợ
Admin: admin@tailorshop.com  
Support: support@tailorshop.com
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
- **Ngày trong tuần**: Thứ 2, Thứ 3, ..., Thứ 7 (Chủ nhật nghỉ mặc định)
- **Giờ mặc định** (fallback khi KHÔNG cấu hình working slot): 07:00 - 23:00, Thứ 2 → Thứ 7
- **Giờ bắt đầu/kết thúc tuỳ chỉnh**: Có thể rút ngắn/điều chỉnh bằng working slot
- **Giờ nghỉ**: 12:00 - 13:00 (nghỉ trưa) hoặc tuỳ chỉnh
- **Hiệu lực**: Từ ngày nào đến ngày nào (có thể để trống nếu áp dụng mãi mãi)
- **Đóng cửa đặc biệt**: Tạo working slot với `isActive = false` thông qua API `/working-slots/close-dates` để chặn đặt lịch theo ngày/tuần/tháng (nghỉ lễ, sự cố, sửa chữa).

#### Ví dụ thực tế:
```
Mặc định (không cấu hình): 07:00 - 23:00 từ Thứ 2 đến Thứ 7, Chủ nhật nghỉ.

Tuỳ chỉnh bằng working slot:
- Thứ 2 đến Thứ 6: 08:00 - 17:00 (nghỉ trưa 12:00 - 13:00)
- Thứ 7: 08:00 - 12:00 (nửa ngày)
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
- ✅ Không được rơi vào ngày đóng cửa (close-dates)
- ✅ Giờ hẹn phải trong khung giờ làm việc của thợ may (nếu không có khung giờ tuỳ chỉnh, hệ thống dùng mặc định 07:00 - 23:00, Thứ 2 → Thứ 7; Chủ nhật nghỉ)
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

### **Tình huống 3: Thợ may thiết lập lịch làm việc / nghỉ lễ**

**Bước 1: (Tuỳ chọn) Thợ may tạo khung giờ làm việc ngắn hơn mặc định**
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

**Bước 2: Lặp lại cho các ngày cần rút ngắn/tuỳ chỉnh**  
(Nếu không tạo working slot, hệ thống tự dùng giờ mặc định 07:00 - 23:00 từ Thứ 2 → Thứ 7; Chủ nhật nghỉ)

**Bước 3: Đóng cửa ngày/tuần/tháng (nghỉ lễ, sửa chữa)**
```
POST /api/v1/appointments/working-slots/close-dates
{
  "tailorId": null,              // null = đóng cửa toàn bộ tiệm
  "weekStart": "2025-04-28",
  "weekEnd": "2025-05-04",
  "reason": "Nghỉ lễ 30/4 - 1/5"
}
```

**Bước 4: Hệ thống sử dụng working slots**
- Nếu có working slot tuỳ chỉnh: chỉ cho phép đặt trong slot đó
- Nếu không có working slot tuỳ chỉnh: dùng giờ mặc định 07:00 - 23:00 (Thứ 2 → Thứ 7)
- Nếu ngày được đánh dấu đóng cửa: không cho đặt lịch, available-slots trả về rỗng

---

## ⚠️ Các Quy Tắc Quan Trọng

### **1. Kiểm Tra Trùng Lịch**
- ❌ Không thể đặt 2 lịch hẹn cùng thợ may, cùng ngày, cùng giờ
- ✅ Hệ thống tự động kiểm tra và từ chối nếu trùng

### **2. Kiểm Tra Khung Giờ Làm Việc**
- ❌ Không thể đặt lịch ngoài khung giờ làm việc của thợ may (nếu có working slot tuỳ chỉnh)
- ✅ Nếu không có working slot tuỳ chỉnh: dùng giờ mặc định 07:00 - 23:00 từ Thứ 2 → Thứ 7; Chủ nhật nghỉ
- ❌ Không thể đặt lịch trong giờ nghỉ (break time)
- ❌ Không thể đặt lịch vào ngày đóng cửa (close-dates)
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
- Nếu ngày đóng cửa (close-dates): trả về danh sách rỗng
- Nếu không có working slot tuỳ chỉnh: dùng giờ mặc định 07:00 - 23:00 (Thứ 2 → Thứ 7; Chủ nhật nghỉ)

### **Working Slots APIs**

#### 1. Lấy Danh Sách Khung Giờ Làm Việc
```
GET /api/v1/appointments/working-slots?tailorId=2
```
**Mục đích**: Xem tất cả khung giờ làm việc của một thợ may (tailorId tùy chọn; bỏ trống để xem tất cả)

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

#### 6. Tạo nhiều khung giờ một lần
```
POST /api/v1/appointments/working-slots/bulk
```
**Mục đích**: Tạo nhanh nhiều working slot theo template lặp

#### 7. Reset về giờ mặc định (07:00 - 23:00, Thứ 2 → Thứ 7)
```
POST /api/v1/appointments/working-slots/{tailorId}/reset
```
**Mục đích**: Xoá working slot tuỳ chỉnh và quay về giờ mặc định

#### 8. Xem giờ làm việc hiện tại (custom hoặc mặc định)
```
GET /api/v1/appointments/working-slots/{tailorId}/hours
```
**Mục đích**: Biết hiện tại tailor/staff đang áp dụng giờ nào

#### 9. Đóng cửa theo ngày/tuần/tháng (nghỉ lễ, sự cố)
```
POST /api/v1/appointments/working-slots/close-dates
```
**Mục đích**: Chặn đặt lịch trong các ngày cụ thể (tạo working slot isActive=false)

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

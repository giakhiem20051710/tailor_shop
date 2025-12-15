# Phân tích tác động của Utils Files

## 📊 Tổng quan

Hiện tại có **20 utils files** trong `src/utils/`. Một số đã được thay thế bằng backend services, nhưng nhiều files vẫn đang được sử dụng rộng rãi.

## 🔴 Files có tác động CAO (cần refactor ngay)

### 1. `authStorage.js` - ⚠️ **20+ files đang dùng**

**Đang được dùng ở:**
- `SchedulePage.jsx`
- `FabricCheckoutPage.jsx`
- `FabricDetailPage.jsx`
- `CustomerHistory.jsx`
- `ProductDetailPage.jsx`
- `FabricsPage.jsx`
- `CustomerDashboardPage.jsx`
- `CompletedOrdersPage.jsx`
- `CustomerOrderPage.jsx`
- `ProductReviewPage.jsx`
- `CustomerOrderDetailPage.jsx`
- `OrderDetailPage.jsx`
- `ProtectedRoute.jsx`
- `OrderFormPage.jsx`
- `TailorOrdersPage.jsx`
- `CorrectionNotes.jsx`
- `TailorAssignment.jsx`
- `fabricHoldStorage.js` (import)
- `orderStorage.js` (import)

**Functions đang dùng:**
- `getCurrentUser()` - **15+ files** → Nên thay bằng `userService.getMyProfile()`
- `getUsersByRole()` - **5+ files** → Nên thay bằng `userService.listTailors()`, `userService.listCustomers()`
- `isAuthenticated()` - **3+ files** → Nên thay bằng `authService.isAuthenticated()`
- `getCurrentUserRole()` - **3+ files** → Có thể giữ lại hoặc dùng từ JWT token
- `ROLES` constant - **10+ files** → Nên giữ lại (không ảnh hưởng)

**Tác động:** ⚠️ **CAO** - Nếu xóa ngay sẽ break 20+ files

**Giải pháp:**
1. Giữ lại `ROLES` constant (không ảnh hưởng)
2. Tạo wrapper functions trong `authStorage.js` để backward compatible:
   ```javascript
   // authStorage.js - Giữ lại như wrapper
   import { authService, userService } from '../services';
   
   export const getCurrentUser = async () => {
     if (!authService.isAuthenticated()) return null;
     try {
       const response = await userService.getMyProfile();
       return response.data;
     } catch (error) {
       return null;
     }
   };
   
   export const isAuthenticated = () => {
     return authService.isAuthenticated();
   };
   ```
3. Dần dần refactor từng file để dùng services trực tiếp

---

### 2. `orderStorage.js` - ⚠️ **15+ files đang dùng**

**Đang được dùng ở:**
- `SchedulePage.jsx`
- `FabricCheckoutPage.jsx`
- `CustomerHistory.jsx`
- `CustomerDashboardPage.jsx`
- `CompletedOrdersPage.jsx`
- `CustomerOrderPage.jsx`
- `ProductReviewPage.jsx`
- `CustomerOrderDetailPage.jsx`
- `OrderDetailPage.jsx`
- `OrderFormPage.jsx`
- `TailorOrdersPage.jsx`
- `OrderTracking.jsx`
- `CorrectionNotes.jsx`
- `AppointmentManager.jsx`
- `TailorAssignment.jsx`
- `dataExport.js`
- `referralStorage.js` (import)

**Functions đang dùng:**
- `getOrders()` - **10+ files** → Nên thay bằng `orderService.list()`
- `getOrderById()` - **5+ files** → Nên thay bằng `orderService.detail(id)`
- `addOrder()` - **3+ files** → Nên thay bằng `orderService.create()`
- `updateOrder()` - **5+ files** → Nên thay bằng `orderService.updateStatus()`
- `deleteOrderFromStorage()` - **1 file** → Nên thay bằng `orderService.delete()`

**Tác động:** ⚠️ **CAO** - Nếu xóa ngay sẽ break 15+ files

**Giải pháp:**
1. Từng bước refactor từng file
2. Ưu tiên: `OrderListPage.jsx` ✅ (đã xong), tiếp theo là `OrderDetailPage.jsx`, `CustomerOrderPage.jsx`

---

### 3. `workingSlotStorage.js` - ⚠️ **7 files đang dùng**

**Đang được dùng ở:**
- `SchedulePage.jsx`
- `ProductDetailPage.jsx`
- `FabricRequestsPage.jsx`
- `FabricsPage.jsx`
- `CustomerDashboardPage.jsx`
- `OrderTracking.jsx`
- `dataExport.js`

**Functions đang dùng:**
- `getWorkingSlots()` - **7 files** → Nên thay bằng `appointmentService.listWorkingSlots()`
- `addWorkingSlot()` - **2 files** → Nên thay bằng `appointmentService.createWorkingSlot()`
- `updateWorkingSlot()` - **3 files** → Nên thay bằng `appointmentService.updateWorkingSlot()`

**Tác động:** ⚠️ **TRUNG BÌNH** - 7 files bị ảnh hưởng

**Giải pháp:**
- Refactor từng file, bắt đầu từ `SchedulePage.jsx` (file quan trọng nhất)

---

### 4. `appointmentStorage.js` - ⚠️ **7 files đang dùng**

**Đang được dùng ở:**
- `SchedulePage.jsx`
- `ProductDetailPage.jsx`
- `FabricsPage.jsx`
- `CustomerDashboardPage.jsx`
- `OrderTracking.jsx`
- `dataExport.js`

**Functions đang dùng:**
- `getAppointments()` - **3 files** → Nên thay bằng `appointmentService.list()`
- `addAppointment()` - **4 files** → Nên thay bằng `appointmentService.create()`
- `updateAppointment()` - **1 file** → Nên thay bằng `appointmentService.updateStatus()`

**Tác động:** ⚠️ **TRUNG BÌNH** - 7 files bị ảnh hưởng

**Giải pháp:**
- Refactor cùng với `workingSlotStorage.js` vì thường dùng chung

---

## 🟡 Files có tác động TRUNG BÌNH

### 5. `fabricHoldStorage.js` - **3 files đang dùng**
- `FabricDetailPage.jsx`
- `FabricsPage.jsx`
- `FabricRequestsPage.jsx`
- `dataExport.js`

**Thay thế bằng:** `fabricService.createHoldRequest()`, `fabricService.listHoldRequests()`

---

### 6. `reviewStorage.js` - **3 files đang dùng**
- `FabricDetailPage.jsx`
- `ProductReviewPage.jsx`
- `CustomerOrderDetailPage.jsx`

**Thay thế bằng:** `reviewService.createProductReview()`, `reviewService.list()`, `reviewService.detail()`

---

### 7. `customerMeasurementsStorage.js` - **3 files đang dùng**
- `CustomerHistory.jsx`
- `CustomerDashboardPage.jsx`
- `CustomerOrderPage.jsx`

**Thay thế bằng:** `measurementService.create()`, `measurementService.list()`, `measurementService.latest()`

---

## 🟢 Files có tác động THẤP

### 8. `styleStorage.js` - **2 files đang dùng**
- `ProductsPage.jsx` (chỉ dùng `getStyles()` để map styles thành products)
- `StyleListPage.jsx` (dùng `getStyles()`, `saveStyles()`)

**Thay thế bằng:** `styleService.list()`, `styleService.create()`

---

### 9. `fabricInventoryStorage.js` - **2 files đang dùng**
- `FabricInventoryPage.jsx`
- `dataExport.js`

**Thay thế bằng:** `fabricService.getInventory()`, `fabricService.updateInventory()`

---

### 10. `invoiceStorage.js` - **2 files đang dùng**
- `InvoicePage.jsx`
- `TransactionManagementPage.jsx`

**Thay thế bằng:** `invoiceService.list()`, `invoiceService.detail()`, `invoiceService.create()`

---

### 11. `loyaltyStorage.js` - **1 file đang dùng**
- `CustomerDashboardPage.jsx`

**Thay thế bằng:** Backend service (chưa có) hoặc giữ lại nếu chưa có backend

---

### 12. `referralStorage.js` - **2 files đang dùng**
- `CustomerDashboardPage.jsx`
- `CustomerOrderPage.jsx`
- `orderStorage.js` (import)

**Thay thế bằng:** Backend service (chưa có) hoặc giữ lại nếu chưa có backend

---

## ✅ Files đã được thay thế (có thể xóa)

### 13. `favoriteStorage.js` - ✅ **Đã thay thế**
- Đã được thay bằng `favoriteService`
- **Có thể xóa** sau khi verify không còn file nào dùng

### 14. `fabricCartStorage.js` - ✅ **Đã thay thế**
- Đã được thay bằng `cartService`
- **Có thể xóa** sau khi verify không còn file nào dùng

---

## 🔧 Files không ảnh hưởng (giữ lại)

### 15. `validation.js` - ✅ **Giữ lại**
- Utility functions cho validation
- Không liên quan đến data storage

### 16. `analytics.js` - ✅ **Giữ lại**
- Analytics tracking (có thể dùng localStorage cho client-side tracking)
- Không ảnh hưởng business logic

### 17. `errorLogger.js` - ✅ **Giữ lại**
- Error logging (có thể dùng localStorage cho client-side logging)
- Không ảnh hưởng business logic

### 18. `performanceMonitor.js` - ✅ **Giữ lại**
- Performance monitoring (có thể dùng localStorage cho client-side monitoring)
- Không ảnh hưởng business logic

### 19. `dataExport.js` - ⚠️ **Cần refactor**
- Đang import nhiều storage files
- Sau khi refactor xong các storage files, cần update `dataExport.js` để dùng services

### 20. `accessibility.jsx` - ✅ **Giữ lại**
- Accessibility utilities
- Không liên quan đến data storage

---

## 📋 Kế hoạch hành động

### Phase 1: High Priority (Tuần 1-2)
1. ✅ `OrderListPage.jsx` - Đã xong
2. ⏳ `OrderDetailPage.jsx` - Dùng `orderService.detail()`
3. ⏳ `CustomerOrderPage.jsx` - Dùng `orderService.create()`
4. ⏳ `ProductsPage.jsx` - Dùng `productService.list()`, `favoriteService`
5. ⏳ `ProductDetailPage.jsx` - Dùng `productService.detail()`, `favoriteService`, `appointmentService`

### Phase 2: Medium Priority (Tuần 3-4)
6. ⏳ `SchedulePage.jsx` - Dùng `appointmentService`, `workingSlotService`
7. ⏳ `FabricsPage.jsx` - Dùng `fabricService.list()`
8. ⏳ `FabricDetailPage.jsx` - Dùng `fabricService.detail()`, `fabricService.createHoldRequest()`
9. ⏳ `CustomerDashboardPage.jsx` - Dùng nhiều services

### Phase 3: Low Priority (Tuần 5+)
10. ⏳ Các pages còn lại
11. ⏳ `dataExport.js` - Update để dùng services
12. ⏳ Xóa các storage files đã thay thế

---

## ⚠️ Lưu ý quan trọng

1. **KHÔNG XÓA NGAY** các storage files vì sẽ break nhiều files
2. **Refactor từng file một** theo priority
3. **Test kỹ** sau mỗi file refactor
4. **Giữ lại `ROLES` constant** trong `authStorage.js` (không ảnh hưởng)
5. **Tạo wrapper functions** trong `authStorage.js` để backward compatible nếu cần
6. **Verify không còn import** trước khi xóa storage files

---

## 📊 Tổng kết

| Category | Số files | Tác động | Status |
|----------|----------|----------|--------|
| **High Impact** | 2 files | 35+ files bị ảnh hưởng | ⚠️ Cần refactor ngay |
| **Medium Impact** | 2 files | 14 files bị ảnh hưởng | ⏳ Refactor sau |
| **Low Impact** | 8 files | 15 files bị ảnh hưởng | ⏳ Refactor cuối |
| **No Impact** | 5 files | 0 files | ✅ Giữ lại |
| **Replaced** | 2 files | 0 files | ✅ Có thể xóa |

**Tổng cộng:** 19 files cần xử lý, ảnh hưởng đến **64+ files** trong codebase.


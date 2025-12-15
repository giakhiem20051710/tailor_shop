# Migration Status - Trạng thái Migration

## ✅ Đã hoàn thành

### Authentication & User
- ✅ `LoginPage.jsx` - Dùng `authService.login()`
- ✅ `RoleBasedLoginPage.jsx` - Dùng `authService.login()`
- ✅ `Header.jsx` - Dùng `authService`, `userService`, `cartService`

### Favorites
- ✅ `FavoritesPage.jsx` - Dùng `favoriteService.list()`, `favoriteService.remove()`

### Cart
- ✅ `FabricCartPage.jsx` - Dùng `cartService.getCart()`, `cartService.updateCartItem()`, `cartService.removeFromCart()`

## 🔄 Đang xử lý / Cần refactor

### Products
- ⏳ `ProductsPage.jsx` - Cần thay mock data bằng `productService.list()`, `favoriteService`
- ⏳ `ProductDetailPage.jsx` - Cần dùng `productService.getDetail()`, `favoriteService`

### Orders
- ⏳ `OrderListPage.jsx` - Cần dùng `orderService.list()`
- ⏳ `OrderDetailPage.jsx` - Cần dùng `orderService.getDetail()`
- ⏳ `OrderFormPage.jsx` - Cần dùng `orderService.create()`
- ⏳ `CustomerOrderPage.jsx` - Cần dùng `orderService.list()`
- ⏳ `CustomerOrderDetailPage.jsx` - Cần dùng `orderService.getDetail()`
- ⏳ `TailorOrdersPage.jsx` - Cần dùng `orderService.list()`
- ⏳ `CompletedOrdersPage.jsx` - Cần dùng `orderService.list()`

### Fabrics
- ⏳ `FabricsPage.jsx` - Cần dùng `fabricService.list()`
- ⏳ `FabricDetailPage.jsx` - Cần dùng `fabricService.getDetail()`
- ⏳ `FabricCheckoutPage.jsx` - Cần dùng `fabricOrderService.checkout()`
- ⏳ `FabricInventoryPage.jsx` - Cần dùng `fabricService.getInventory()`
- ⏳ `FabricRequestsPage.jsx` - Cần dùng `fabricService.listHoldRequests()`

### Appointments
- ⏳ `SchedulePage.jsx` - Cần dùng `appointmentService.list()`, `appointmentService.getSchedule()`

### Promotions
- ⏳ `PromotionsPage.jsx` - Cần dùng `promotionService.list()`, `promotionService.applyPromoCode()`

### Reviews
- ⏳ `ProductReviewPage.jsx` - Cần dùng `reviewService.createProductReview()`, `reviewService.list()`

### Register & Password
- ⏳ `RegisterPage.jsx` - Cần dùng `authService.register()`
- ⏳ `ForgotPasswordPage.jsx` - Cần dùng `authService.forgotPassword()`
- ⏳ `ResetPasswordPage.jsx` - Cần dùng `authService.resetPassword()`

### Dashboard
- ⏳ `CustomerDashboardPage.jsx` - Cần dùng `orderService.list()`
- ⏳ `DashboardPage.jsx` - Cần dùng các services tương ứng

## 📝 Notes

1. **ProductsPage.jsx** có rất nhiều mock data (100+ products). Cần:
   - Xóa toàn bộ mock data arrays
   - Dùng `productService.list()` với filters
   - Dùng `favoriteService` cho favorite functionality

2. **Storage Utils** - Sau khi migration xong, có thể xóa:
   - `favoriteStorage.js` ✅ (đã thay thế)
   - `fabricCartStorage.js` ✅ (đã thay thế)
   - `orderStorage.js`
   - `fabricHoldStorage.js`
   - `fabricInventoryStorage.js`
   - `styleStorage.js`
   - `appointmentStorage.js`
   - `workingSlotStorage.js`
   - `reviewStorage.js`
   - `invoiceStorage.js`
   - `customerMeasurementsStorage.js`

3. **Auth Storage** - `authStorage.js` vẫn cần giữ lại cho:
   - Helper functions (getCurrentUser, isAuthenticated)
   - Nhưng không dùng localStorage cho data chính

## 🎯 Priority

1. **High Priority** (Core functionality):
   - ProductsPage.jsx
   - ProductDetailPage.jsx
   - OrderListPage.jsx
   - RegisterPage.jsx

2. **Medium Priority**:
   - FabricsPage.jsx
   - FabricDetailPage.jsx
   - FabricCheckoutPage.jsx
   - CustomerDashboardPage.jsx

3. **Low Priority**:
   - Các pages admin/staff
   - Pages ít dùng


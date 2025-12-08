# Hướng Dẫn Sử Dụng Các Tính Năng Mới

## 🖼️ Image Optimization

### Sử dụng OptimizedImage Component

Thay thế `<img>` bằng `<OptimizedImage>` để có lazy loading và placeholder:

```jsx
import OptimizedImage from "../components/OptimizedImage.jsx";

// Thay vì:
<img src={product.image} alt={product.name} />

// Sử dụng:
<OptimizedImage 
  src={product.image} 
  alt={product.name}
  className="w-full h-full object-cover"
/>
```

**Tính năng:**
- ✅ Lazy loading với Intersection Observer
- ✅ Placeholder khi đang tải
- ✅ Error handling tự động
- ✅ Smooth fade-in animation

## 📱 PWA (Progressive Web App)

### Setup Icons

1. Tạo 2 icon files trong `public/`:
   - `icon-192.png` (192x192px)
   - `icon-512.png` (512x512px)

2. Service Worker đã được tự động register trong `index.html`

### Features:
- ✅ Offline support
- ✅ Install prompt trên mobile
- ✅ App shortcuts
- ✅ Caching strategy

### Test PWA:
```bash
npm run build
serve -s dist
# Mở với HTTPS để test đầy đủ tính năng
```

## ⚡ Performance Monitoring

### Tự động track:
- Page load time
- DNS lookup time
- TCP connection time
- Time to First Byte (TTFB)
- Time to Interactive (TTI)

### Xem metrics trong Admin Dashboard:
- Vào `/dashboard`
- Scroll xuống phần "Performance Metrics"

### Manual tracking:
```javascript
import { markStart, markEnd } from "../utils/performanceMonitor.js";

markStart("custom-operation");
// ... your code ...
const duration = markEnd("custom-operation");
```

## ♿ Accessibility

### Skip to Content Link
Đã được tự động thêm vào App - nhấn Tab khi vào trang để thấy.

### ARIA Labels
Sử dụng utility functions:

```javascript
import { getAriaLabel, announceToScreenReader } from "../utils/accessibility.js";

// Generate ARIA label
const label = getAriaLabel("button", { type: "close" });

// Announce to screen readers
announceToScreenReader("Đã thêm vào giỏ hàng");
```

### Keyboard Navigation
```javascript
import { handleKeyboardNavigation } from "../utils/accessibility.js";

const handleKeyDown = handleKeyboardNavigation({
  onEnter: () => handleSubmit(),
  onEscape: () => handleClose(),
  onArrowDown: () => navigateNext(),
});
```

### Focus Trap cho Modals
```javascript
import { trapFocus } from "../utils/accessibility.js";

useEffect(() => {
  const cleanup = trapFocus(modalRef.current);
  return cleanup;
}, []);
```

## 📊 Analytics Events

### Track events:
```javascript
import { events } from "../utils/analytics.js";

events.PRODUCT_VIEW(productId, productName);
events.ADD_TO_CART(productId, productName, price);
events.CHECKOUT_COMPLETE(orderId, orderValue);
events.SEARCH(query, resultsCount);
```

### Xem events trong Admin Dashboard:
- Vào `/dashboard`
- Scroll xuống phần "Analytics Events"

## ✅ Form Validation

### Sử dụng validation system:
```javascript
import { validators, validateForm } from "../utils/validation.js";

const rules = {
  email: [validators.required, validators.email],
  phone: [validators.required, validators.phone],
  name: [validators.required, validators.minLength(3)],
};

const { errors, isValid } = validateForm(formData, rules);
```

### Available validators:
- `required` - Bắt buộc
- `email` - Email hợp lệ
- `phone` - Số điện thoại VN
- `minLength(n)` - Tối thiểu n ký tự
- `maxLength(n)` - Tối đa n ký tự
- `number` - Phải là số
- `min(n)` - Tối thiểu n
- `max(n)` - Tối đa n
- `date` - Ngày hợp lệ
- `futureDate` - Ngày trong tương lai
- `url` - URL hợp lệ
- `pattern(regex, message)` - Regex pattern

## 🔒 Input Sanitization

```javascript
import { sanitizeInput } from "../utils/validation.js";

const safeInput = sanitizeInput(userInput);
```

## 📦 Data Export

### Trong Admin Dashboard:
- Click "Xuất đơn hàng CSV" - Export orders
- Click "Xuất lịch hẹn CSV" - Export appointments
- Click "Backup tất cả" - Export toàn bộ data ra JSON

## 🎯 Order Tracking

### Sử dụng OrderTracking component:
```jsx
import OrderTracking from "../components/OrderTracking.jsx";

<OrderTracking orderId="order-123" />
// hoặc
<OrderTracking customerId="customer-123" />
```

## 🔔 Notification System

```javascript
import { showSuccess, showError, showWarning, showInfo } from "../components/NotificationToast.jsx";

showSuccess("Đặt hàng thành công!");
showError("Có lỗi xảy ra!");
showWarning("Vui lòng kiểm tra lại!");
showInfo("Thông tin quan trọng!");
```

## 🛡️ Error Logging

Tự động log errors. Xem trong Admin Dashboard → Error Logs section.

Manual logging:
```javascript
import { logError } from "../utils/errorLogger.js";

try {
  // code
} catch (error) {
  logError(error, { context: "checkout process" });
}
```


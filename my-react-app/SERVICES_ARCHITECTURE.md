# Services Architecture - Kiến trúc Services chuẩn thực tế

## Tổng quan

Codebase đã được refactor theo chuẩn thực tế của các dự án production, tách riêng các service modules theo domain thay vì gộp tất cả vào 1 file.

## Cấu trúc

```
src/services/
├── api/
│   ├── apiConfig.js      # API configuration và endpoints
│   └── httpClient.js     # Base HTTP client với interceptors
├── authService.js        # Authentication service
├── userService.js        # User management service
├── productService.js     # Product service
├── styleService.js       # Style service
├── cartService.js        # Cart service
├── favoriteService.js    # Favorite service
├── fabricService.js      # Fabric service
├── fabricOrderService.js # Fabric order service
├── promotionService.js   # Promotion service
├── orderService.js       # Order service
├── appointmentService.js # Appointment service
├── invoiceService.js     # Invoice & payment service
├── reviewService.js      # Review service
├── measurementService.js # Measurement service
└── index.js              # Central export
```

## Kiến trúc

### 1. Base HTTP Client (`api/httpClient.js`)

HTTP client với các tính năng:
- **Interceptors**: Request/Response interceptors
- **Auto retry**: Tự động retry cho network errors và 5xx errors
- **Timeout handling**: Request timeout
- **Auth token**: Tự động thêm JWT token vào headers
- **Error handling**: Xử lý lỗi tập trung
- **FormData support**: Hỗ trợ upload file

### 2. API Configuration (`api/apiConfig.js`)

- **API_CONFIG**: Base URL, timeout, retry settings
- **API_ENDPOINTS**: Tất cả endpoints được định nghĩa tập trung

### 3. Service Modules

Mỗi service module:
- **Single Responsibility**: Chỉ xử lý 1 domain
- **Class-based**: Dùng class để dễ mở rộng
- **Singleton pattern**: Export instance để tái sử dụng
- **Type-safe methods**: JSDoc comments cho type hints

## Cách sử dụng

### Import services

```javascript
// Import từng service riêng (recommended)
import { authService, productService, cartService } from '../services';

// Hoặc import tất cả
import * as services from '../services';
```

### Ví dụ sử dụng

#### Authentication

```javascript
import { authService } from '../services';

// Login
try {
  const response = await authService.login({
    username: 'customer1',
    password: 'password123'
  });
  // Token được tự động lưu vào localStorage
  console.log('Login success:', response.data);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Register
await authService.register({
  username: 'newuser',
  email: 'user@example.com',
  password: 'password123'
});

// Logout
authService.logout();
```

#### Products

```javascript
import { productService } from '../services';

// List products
const products = await productService.list({
  category: 'SHIRT',
  page: 0,
  size: 20
});

// Get detail
const product = await productService.getDetail('product-key-123');
```

#### Cart

```javascript
import { cartService } from '../services';

// Add to cart
await cartService.addToCart({
  itemType: 'FABRIC',
  itemId: 123,
  quantity: 2.5
});

// Get cart
const cart = await cartService.getCart();

// Update quantity
await cartService.updateCartItem(cartItemId, 3.0);

// Remove item
await cartService.removeFromCart(cartItemId);
```

#### Favorites

```javascript
import { favoriteService } from '../services';

// Add to favorites
await favoriteService.add({
  itemType: 'PRODUCT',
  itemId: 123
});

// List favorites
const favorites = await favoriteService.list({ page: 0, size: 20 });

// Check if favorited
const { data } = await favoriteService.check('PRODUCT', 123);
console.log('Is favorite:', data.isFavorite);
```

## Advanced Usage

### Custom Interceptors

```javascript
import { httpClient } from '../services';

// Add request interceptor
httpClient.addRequestInterceptor(async (config) => {
  // Add custom header
  config.headers['X-Custom-Header'] = 'value';
  return config;
});

// Add response interceptor
httpClient.addResponseInterceptor(async (response) => {
  // Log response
  console.log('Response:', response);
  return response;
});
```

### Direct HTTP Client Usage

```javascript
import { httpClient, API_ENDPOINTS } from '../services';

// Custom request
const response = await httpClient.get(API_ENDPOINTS.PRODUCT.LIST, {
  retry: true, // Enable retry
});

// With custom headers
await httpClient.post('/custom-endpoint', data, {
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## Best Practices

1. **Import từng service cần dùng**: Không import tất cả services nếu không cần
2. **Error handling**: Luôn wrap API calls trong try-catch
3. **Loading states**: Quản lý loading state trong components
4. **Type safety**: Sử dụng JSDoc comments để IDE hỗ trợ autocomplete
5. **Service composition**: Có thể compose nhiều services trong 1 use case

## Migration từ api.js cũ

Nếu code cũ dùng:
```javascript
import api from './utils/api';
await api.product.list();
```

Chuyển sang:
```javascript
import { productService } from '../services';
await productService.list();
```

## Benefits

1. **Maintainability**: Dễ maintain, mỗi service chỉ xử lý 1 domain
2. **Testability**: Dễ test từng service riêng biệt
3. **Scalability**: Dễ thêm service mới không ảnh hưởng service khác
4. **Type Safety**: JSDoc comments giúp IDE hỗ trợ tốt hơn
5. **Reusability**: Services có thể tái sử dụng ở nhiều nơi
6. **Separation of Concerns**: Tách biệt rõ ràng giữa các domains


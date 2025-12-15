# Migration Guide - Thay thế Mock Data bằng API

## Tổng quan

Tài liệu này hướng dẫn cách thay thế toàn bộ mock data và localStorage bằng API calls từ backend.

## Đã hoàn thành

### ✅ Authentication
- `LoginPage.jsx` - Dùng `authService.login()`
- `RoleBasedLoginPage.jsx` - Dùng `authService.login()`
- `Header.jsx` - Dùng `authService`, `userService`, `cartService`

## Cần refactor

### 1. ProductsPage.jsx
**Hiện tại:**
- Mock data: `collections`, `newArrivals`, `additionalProducts`
- `favoriteStorage.js` cho favorites
- `styleStorage.js` cho styles

**Cần thay:**
```javascript
// OLD
import { getFavorites, addFavorite, removeFavorite } from "../utils/favoriteStorage.js";
const favorites = getFavorites();

// NEW
import { productService, favoriteService } from "../services";
const [products, setProducts] = useState([]);
const [favorites, setFavorites] = useState([]);

useEffect(() => {
  loadProducts();
  loadFavorites();
}, []);

const loadProducts = async () => {
  try {
    const response = await productService.list({ page: 0, size: 100 });
    if (response.success) {
      setProducts(response.data.content || []);
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }
};

const loadFavorites = async () => {
  try {
    if (authService.isAuthenticated()) {
      const response = await favoriteService.list({ page: 0, size: 100 });
      if (response.success) {
        const favoriteMap = {};
        response.data.content?.forEach(fav => {
          if (fav.itemKey) favoriteMap[fav.itemKey] = true;
        });
        setFavorites(favoriteMap);
      }
    }
  } catch (error) {
    console.error("Error loading favorites:", error);
  }
};

const handleFavoriteToggle = async (product) => {
  try {
    if (favorites[product.key]) {
      await favoriteService.remove('PRODUCT', product.id);
    } else {
      await favoriteService.add({
        itemType: 'PRODUCT',
        itemId: product.id,
        itemKey: product.key
      });
    }
    loadFavorites(); // Refresh
  } catch (error) {
    console.error("Error toggling favorite:", error);
  }
};
```

### 2. FavoritesPage.jsx
**Hiện tại:**
```javascript
import { getFavorites, removeFavorite } from "../utils/favoriteStorage.js";
const favorites = getFavorites();
```

**Cần thay:**
```javascript
import { favoriteService } from "../services";
const [favorites, setFavorites] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadFavorites();
}, []);

const loadFavorites = async () => {
  try {
    setLoading(true);
    const response = await favoriteService.list({ page: 0, size: 100 });
    if (response.success) {
      setFavorites(response.data.content || []);
    }
  } catch (error) {
    console.error("Error loading favorites:", error);
  } finally {
    setLoading(false);
  }
};

const handleRemove = async (itemType, itemId) => {
  try {
    await favoriteService.remove(itemType, itemId);
    loadFavorites(); // Refresh
  } catch (error) {
    console.error("Error removing favorite:", error);
  }
};
```

### 3. FabricCartPage.jsx
**Hiện tại:**
```javascript
import { getFabricCart, removeFromFabricCart, updateFabricCartQuantity } from "../utils/fabricCartStorage.js";
const cart = getFabricCart();
```

**Cần thay:**
```javascript
import { cartService } from "../services";
const [cart, setCart] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadCart();
}, []);

const loadCart = async () => {
  try {
    setLoading(true);
    const response = await cartService.getCart();
    if (response.success) {
      setCart(response.data);
    }
  } catch (error) {
    console.error("Error loading cart:", error);
  } finally {
    setLoading(false);
  }
};

const handleRemoveItem = async (itemId) => {
  try {
    await cartService.removeFromCart(itemId);
    loadCart(); // Refresh
  } catch (error) {
    console.error("Error removing item:", error);
  }
};

const handleQuantityChange = async (itemId, quantity) => {
  try {
    await cartService.updateCartItem(itemId, quantity);
    loadCart(); // Refresh
  } catch (error) {
    console.error("Error updating quantity:", error);
  }
};
```

### 4. ProductDetailPage.jsx
**Hiện tại:**
```javascript
import { addFavorite, removeFavorite, isFavorite } from "../utils/favoriteStorage.js";
```

**Cần thay:**
```javascript
import { productService, favoriteService } from "../services";
const [product, setProduct] = useState(null);
const [isFavoriteProduct, setIsFavoriteProduct] = useState(false);

useEffect(() => {
  loadProduct();
  checkFavorite();
}, [productKey]);

const loadProduct = async () => {
  try {
    const response = await productService.getDetail(productKey);
    if (response.success) {
      setProduct(response.data);
    }
  } catch (error) {
    console.error("Error loading product:", error);
  }
};

const checkFavorite = async () => {
  try {
    if (authService.isAuthenticated() && product?.id) {
      const response = await favoriteService.check('PRODUCT', product.id);
      if (response.success) {
        setIsFavoriteProduct(response.data.isFavorite);
      }
    }
  } catch (error) {
    console.error("Error checking favorite:", error);
  }
};

const handleFavoriteToggle = async () => {
  try {
    if (isFavoriteProduct) {
      await favoriteService.remove('PRODUCT', product.id);
      setIsFavoriteProduct(false);
    } else {
      await favoriteService.add({
        itemType: 'PRODUCT',
        itemId: product.id,
        itemKey: product.key
      });
      setIsFavoriteProduct(true);
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
  }
};
```

### 5. OrderListPage.jsx
**Hiện tại:**
```javascript
import { getOrders, updateOrder } from "../utils/orderStorage.js";
const orders = getOrders();
```

**Cần thay:**
```javascript
import { orderService } from "../services";
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadOrders();
}, []);

const loadOrders = async () => {
  try {
    setLoading(true);
    const response = await orderService.list({ page: 0, size: 50 });
    if (response.success) {
      setOrders(response.data.content || []);
    }
  } catch (error) {
    console.error("Error loading orders:", error);
  } finally {
    setLoading(false);
  }
};

const handleUpdateStatus = async (orderId, statusData) => {
  try {
    await orderService.updateStatus(orderId, statusData);
    loadOrders(); // Refresh
  } catch (error) {
    console.error("Error updating order:", error);
  }
};
```

### 6. RegisterPage.jsx
**Hiện tại:**
```javascript
const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
```

**Cần thay:**
```javascript
import { authService } from "../services";

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await authService.register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      // ... other fields
    });
    showSuccess("Đăng ký thành công!");
    navigate("/login");
  } catch (error) {
    showError(error.message || "Đăng ký thất bại");
  }
};
```

## Files cần xóa sau khi migration

Sau khi đã thay thế toàn bộ, có thể xóa các file storage utils:
- `src/utils/favoriteStorage.js`
- `src/utils/orderStorage.js`
- `src/utils/fabricCartStorage.js`
- `src/utils/fabricHoldStorage.js`
- `src/utils/fabricInventoryStorage.js`
- `src/utils/styleStorage.js`
- `src/utils/appointmentStorage.js`
- `src/utils/workingSlotStorage.js`
- `src/utils/reviewStorage.js`
- `src/utils/invoiceStorage.js`
- `src/utils/customerMeasurementsStorage.js`
- `src/utils/loyaltyStorage.js`
- `src/utils/referralStorage.js`

**Lưu ý:** Một số utils như `authStorage.js` vẫn cần giữ lại cho các helper functions (nhưng không dùng localStorage cho data chính).

## Best Practices

1. **Error Handling**: Luôn wrap API calls trong try-catch
2. **Loading States**: Quản lý loading state cho UX tốt hơn
3. **Optimistic Updates**: Có thể update UI trước khi API response (nếu cần)
4. **Refresh Data**: Sau mỗi mutation (create/update/delete), refresh data từ API
5. **Authentication Check**: Kiểm tra `authService.isAuthenticated()` trước khi gọi API cần auth

## Checklist Migration

- [x] LoginPage.jsx
- [x] RoleBasedLoginPage.jsx
- [x] Header.jsx
- [ ] ProductsPage.jsx
- [ ] FavoritesPage.jsx
- [ ] FabricCartPage.jsx
- [ ] ProductDetailPage.jsx
- [ ] OrderListPage.jsx
- [ ] RegisterPage.jsx
- [ ] ForgotPasswordPage.jsx
- [ ] ResetPasswordPage.jsx
- [ ] CustomerDashboardPage.jsx
- [ ] TailorOrdersPage.jsx
- [ ] SchedulePage.jsx
- [ ] FabricsPage.jsx
- [ ] FabricDetailPage.jsx
- [ ] FabricCheckoutPage.jsx
- [ ] PromotionsPage.jsx
- [ ] ProductReviewPage.jsx
- [ ] Xóa storage utils files


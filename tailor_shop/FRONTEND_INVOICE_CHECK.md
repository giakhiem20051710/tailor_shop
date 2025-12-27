# Kiểm tra Frontend - Tự động tạo hóa đơn

## Kết quả kiểm tra

### ✅ Những gì đã hoạt động đúng:

1. **API Endpoints:**
   - Frontend đã có `orderService.create()` và `orderService.createWizard()` ✅
   - Frontend đã có `invoiceService` với các method cần thiết ✅
   - API endpoints đã được config đúng trong `apiConfig.js` ✅

2. **Backend Integration:**
   - Backend tự động tạo hóa đơn sau khi tạo đơn hàng ✅
   - Logic tìm staffId hoạt động đúng ✅
   - Xử lý lỗi không block việc tạo đơn hàng ✅

### ❌ Những vấn đề cần xử lý:

1. **Frontend không biết về hóa đơn đã được tạo:**
   - `OrderResponse` không có field `invoiceId` hoặc `invoice`
   - Frontend không fetch hoặc hiển thị thông tin về hóa đơn sau khi tạo đơn hàng
   - User không được thông báo về việc hóa đơn đã được tự động tạo

2. **Thiếu method để lấy invoice theo orderId:**
   - `invoiceService` không có method để lấy invoice theo `orderId`
   - Cần thêm method `getByOrderId(orderId)` hoặc filter trong `list()`

3. **UI không hiển thị thông tin hóa đơn:**
   - Sau khi tạo đơn hàng thành công, không có thông báo về hóa đơn
   - Không có link để xem hóa đơn
   - Trang chi tiết đơn hàng không hiển thị thông tin hóa đơn liên quan

## Đề xuất giải pháp

### Giải pháp 1: Thêm invoiceId vào OrderResponse (Khuyến nghị)

**Backend:**
- Thêm field `invoiceId` vào `OrderResponse`
- Cập nhật `mapToDetail()` trong `OrderServiceImpl` để set `invoiceId` từ order entity

**Frontend:**
- Sau khi tạo đơn hàng, kiểm tra `responseData.invoiceId`
- Nếu có, hiển thị thông báo và link đến hóa đơn

### Giải pháp 2: Fetch invoice sau khi tạo order

**Backend:**
- Thêm filter `orderId` vào `InvoiceFilterRequest` (nếu chưa có)
- Hoặc thêm endpoint `GET /invoices/by-order/{orderId}`

**Frontend:**
- Sau khi tạo đơn hàng thành công, gọi `invoiceService.list({ orderId: orderId })`
- Hiển thị thông báo và link đến hóa đơn nếu tìm thấy

### Giải pháp 3: Hiển thị trong Order Detail Page

**Frontend:**
- Trong `CustomerOrderDetailPage`, thêm section hiển thị hóa đơn liên quan
- Fetch invoice theo orderId khi load order detail
- Hiển thị link "Xem hóa đơn" nếu có

## Code cần thêm/sửa

### 1. Backend - Thêm invoiceId vào OrderResponse

**File:** `OrderResponse.java`
```java
private Long invoiceId; // Thêm field này

// Thêm getter/setter
public Long getInvoiceId() {
    return invoiceId;
}

public void setInvoiceId(Long invoiceId) {
    this.invoiceId = invoiceId;
}
```

**File:** `OrderServiceImpl.java` - Method `mapToDetail()`
```java
// Thêm logic để lấy invoiceId từ order
// Có thể query InvoiceRepository để tìm invoice theo orderId
InvoiceEntity invoice = invoiceRepository.findByOrderId(order.getId()).orElse(null);
if (invoice != null) {
    dto.setInvoiceId(invoice.getId());
}
```

### 2. Frontend - Thêm method vào invoiceService

**File:** `invoiceService.js`
```javascript
/**
 * Get invoice by order ID
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Invoice
 */
async getByOrderId(orderId) {
  const response = await this.list({ orderId }, { page: 0, size: 1 });
  const invoices = response?.data?.content || response?.content || response?.data || [];
  return invoices.length > 0 ? invoices[0] : null;
}
```

### 3. Frontend - Cập nhật CustomerOrderPage.jsx

**Sau khi tạo đơn hàng thành công:**
```javascript
// Sau dòng 262: const response = await orderService.createWizard(wizardOrder);
const responseData = response?.data ?? response?.responseData ?? response;

// Thêm logic để fetch invoice
let invoiceId = null;
if (responseData?.invoiceId) {
  invoiceId = responseData.invoiceId;
} else if (responseData?.id) {
  // Nếu không có invoiceId trong response, fetch theo orderId
  try {
    const invoice = await invoiceService.getByOrderId(responseData.id);
    if (invoice) {
      invoiceId = invoice.id;
    }
  } catch (error) {
    console.error("Error fetching invoice:", error);
  }
}

// Hiển thị thông báo với link đến hóa đơn
if (invoiceId) {
  // Có thể thêm vào success message
  console.log("Invoice created:", invoiceId);
}
```

### 4. Frontend - Cập nhật CustomerOrderDetailPage.jsx

**Thêm section hiển thị hóa đơn:**
```javascript
// Thêm state
const [invoice, setInvoice] = useState(null);

// Fetch invoice khi load order
useEffect(() => {
  if (orderId) {
    fetchInvoice();
  }
}, [orderId]);

const fetchInvoice = async () => {
  try {
    const invoice = await invoiceService.getByOrderId(orderId);
    setInvoice(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
  }
};

// Thêm vào JSX
{invoice && (
  <div className="bg-white rounded-lg p-4 shadow-sm">
    <h3 className="text-lg font-semibold mb-2">Hóa đơn</h3>
    <p className="text-sm text-gray-600 mb-2">
      Mã hóa đơn: <span className="font-medium">{invoice.code}</span>
    </p>
    <p className="text-sm text-gray-600 mb-2">
      Tổng tiền: <span className="font-medium">{formatCurrency(invoice.total)}</span>
    </p>
    <p className="text-sm text-gray-600 mb-4">
      Trạng thái: <StatusBadge status={invoice.status} />
    </p>
    <button
      onClick={() => navigate(`/invoices/${invoice.id}`)}
      className="px-4 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#14532d]"
    >
      Xem chi tiết hóa đơn
    </button>
  </div>
)}
```

## Kết luận

**Hiện tại:** Backend đã tự động tạo hóa đơn, nhưng frontend chưa biết và chưa hiển thị thông tin này.

**Cần làm:**
1. ✅ Backend: Thêm `invoiceId` vào `OrderResponse` (hoặc fetch invoice sau khi tạo order)
2. ✅ Frontend: Thêm method `getByOrderId()` vào `invoiceService`
3. ✅ Frontend: Cập nhật `CustomerOrderPage` để hiển thị thông báo về hóa đơn
4. ✅ Frontend: Cập nhật `CustomerOrderDetailPage` để hiển thị thông tin hóa đơn

**Ưu tiên:** Giải pháp 1 (thêm invoiceId vào OrderResponse) là tốt nhất vì:
- Đơn giản, hiệu quả
- Không cần thêm API call
- User nhận được thông tin ngay lập tức


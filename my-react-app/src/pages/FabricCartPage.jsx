import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta.jsx";
import { cartService, authService } from "../services";
import { showError, showSuccess } from "../components/NotificationToast.jsx";

export default function FabricCartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  // SEO Meta Tags
  usePageMeta({
    title: "Giỏ hàng vải | My Hiền Tailor",
    description: "Xem và quản lý giỏ hàng vải may đo của bạn tại My Hiền Tailor. Chọn sản phẩm, áp dụng mã giảm giá và tiến hành thanh toán.",
  });

  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cart?.items) {
      setCartItems(cart.items);
      // Kiểm tra nếu có sản phẩm vừa thêm từ "Mua ngay"
      const justAddedKey = location.state?.justAdded;
      if (justAddedKey) {
        setSelectedItems(new Set([justAddedKey]));
        window.history.replaceState({}, document.title);
      } else {
        // Tự động chọn tất cả
        setSelectedItems(new Set(cart.items.map((item) => item.id)));
      }
    }
  }, [cart, location.state]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response.success && response.data) {
        setCart(response.data);
        setCartItems(response.data.items || []);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      showError("Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
    }
    return price || "0 ₫";
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(cartItems.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleRemoveItem = async (id) => {
    try {
      await cartService.removeFromCart(id);
      await loadCart(); // Refresh
      const newSelected = new Set(selectedItems);
      newSelected.delete(id);
      setSelectedItems(newSelected);
      showSuccess("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error) {
      console.error("Error removing item:", error);
      showError("Không thể xóa sản phẩm");
    }
  };

  const handleQuantityChange = async (id, newQuantity) => {
    try {
      await cartService.updateCartItem(id, newQuantity);
      await loadCart(); // Refresh
    } catch (error) {
      console.error("Error updating quantity:", error);
      showError("Không thể cập nhật số lượng");
    }
  };

  const selectedItemsList = cartItems.filter((item) =>
    selectedItems.has(item.id)
  );

  const subtotal = selectedItemsList.reduce((sum, item) => {
    const price = typeof item.itemPrice === 'number' 
      ? item.itemPrice 
      : (typeof item.itemPrice === 'string' 
          ? parseFloat(item.itemPrice.replace(/[^\d]/g, '')) || 0 
          : 0);
    const quantity = parseFloat(item.quantity) || 1;
    return sum + price * quantity;
  }, 0);

  const totalDiscount = discount;
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const rewardPoints = Math.floor(finalTotal / 4000); // 1 điểm = 4000₫

  const allSelected = cartItems.length > 0 && selectedItems.size === cartItems.length;

  const handleConfirmOrder = () => {
    if (selectedItemsList.length === 0) {
      showError("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    // Chuyển đến trang checkout với các sản phẩm đã chọn
    navigate("/checkout", {
      state: {
        cartItemIds: selectedItemsList.map(item => item.id),
        items: selectedItemsList,
        total: finalTotal,
        discount: totalDiscount,
        subtotal: subtotal,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
        <Header currentPage="/cart" />
        <main className="pt-[170px] md:pt-[190px] pb-16">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 text-center py-20">
            <p className="text-[#6B7280]">Đang tải giỏ hàng...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!authService.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
        <Header currentPage="/cart" />
        <main className="pt-[170px] md:pt-[190px] pb-16">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-10 text-center">
              <p className="text-4xl mb-4">🔒</p>
              <h2 className="text-[20px] font-semibold text-[#111827] mb-2">
                Vui lòng đăng nhập
              </h2>
              <p className="text-[13px] text-[#6B7280] mb-4">
                Bạn cần đăng nhập để xem giỏ hàng.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 rounded-full bg-[#1B4332] text-white text-[13px] font-medium hover:bg-[#14532d]"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header currentPage="/cart" />
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="text-[13px] text-[#6B7280]">
              <span
                className="hover:text-[#111827] cursor-pointer"
                onClick={() => navigate("/")}
              >
                Trang chủ
              </span>
              <span className="mx-2">/</span>
              <span className="text-[#111827]">Giỏ hàng</span>
            </nav>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Section - Product List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                {/* Select All */}
                <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB] mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-5 h-5 rounded border-[#D1D5DB] text-[#F97316] focus:ring-[#F97316]"
                    />
                    <span className="text-[14px] font-medium text-[#111827]">
                      Chọn tất cả ({selectedItems.size})
                    </span>
                  </label>
                </div>

                {/* Product List */}
                <div className="space-y-4">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[#6B7280] mb-4">Giỏ hàng của bạn đang trống</p>
                      <button
                        onClick={() => navigate("/fabrics")}
                        className="px-6 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#133021] transition-colors"
                      >
                        Tiếp tục mua sắm
                      </button>
                    </div>
                  ) : (
                    cartItems.map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      const priceValue = typeof item.itemPrice === 'number' 
                        ? item.itemPrice 
                        : (typeof item.itemPrice === 'string' 
                            ? parseFloat(item.itemPrice.replace(/[^\d]/g, '')) || 0 
                            : 0);
                      const quantity = parseFloat(item.quantity) || 1;

                      return (
                        <div
                          key={item.id}
                          className="flex gap-4 pb-4 border-b border-[#E5E7EB] last:border-b-0"
                        >
                          {/* Checkbox */}
                          <label className="flex items-start pt-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                handleSelectItem(item.id, e.target.checked)
                              }
                              className="w-5 h-5 rounded border-[#D1D5DB] text-[#F97316] focus:ring-[#F97316] mt-1"
                            />
                          </label>

                          {/* Product Image */}
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.itemImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='18' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E"}
                              alt={item.itemName || "Sản phẩm"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='18' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] font-medium text-[#111827] mb-2 line-clamp-2">
                              {item.itemName || "Sản phẩm"}
                            </h3>
                            <div className="mb-2">
                              <span className="text-[12px] text-[#6B7280]">
                                Loại: {item.itemType}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[16px] font-semibold text-[#F97316]">
                                {formatPrice(priceValue)}
                              </span>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    Math.max(0.1, quantity - 0.1)
                                  )
                                }
                                className="w-8 h-8 border border-[#E5E7EB] rounded flex items-center justify-center hover:bg-[#F9FAFB] transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={0.1}
                                step={0.1}
                                value={quantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.id,
                                    Math.max(0.1, parseFloat(e.target.value || "1"))
                                  )
                                }
                                className="w-16 text-center border border-[#E5E7EB] rounded py-1 text-[13px] outline-none"
                              />
                              <span className="text-[12px] text-[#6B7280]">m</span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    quantity + 0.1
                                  )
                                }
                                className="w-8 h-8 border border-[#E5E7EB] rounded flex items-center justify-center hover:bg-[#F9FAFB] transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[#F9FAFB] rounded transition-colors flex-shrink-0"
                          >
                            <svg
                              className="w-5 h-5 text-[#6B7280]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 sticky top-[190px]">
                {/* Gifts */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E5E7EB]">
                  <svg
                    className="w-5 h-5 text-[#F97316]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-[13px] text-[#111827]">Quà tặng</span>
                  <span className="text-[12px] text-[#6B7280]">Xem quà (0)</span>
                </div>

                {/* Promo Code */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E5E7EB] cursor-pointer hover:text-[#F97316] transition-colors">
                  <svg
                    className="w-5 h-5 text-[#6B7280]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span className="text-[13px] text-[#111827] flex-1">
                    Chọn hoặc nhập ưu đãi
                  </span>
                  <svg
                    className="w-4 h-4 text-[#6B7280]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                {/* Reward Points */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E5E7EB]">
                  <svg
                    className="w-5 h-5 text-[#F59E0B]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[13px] text-[#111827]">
                    Đăng nhập để sử dụng điểm thưởng
                  </span>
                </div>

                {/* Order Information */}
                <div className="mb-4">
                  <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
                    Thông tin đơn hàng
                  </h3>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Tổng tiền:</span>
                      <span className="font-medium text-[#111827]">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Tổng khuyến mãi:</span>
                      <span className="font-medium text-[#F97316]">
                        -{formatPrice(totalDiscount)}
                      </span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="pl-4 space-y-1 text-[12px] text-[#6B7280]">
                        <div className="flex justify-between">
                          <span>Giảm giá sản phẩm:</span>
                          <span>{formatPrice(totalDiscount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Voucher:</span>
                          <span>0 ₫</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-[#E5E7EB]">
                      <span className="text-[15px] font-semibold text-[#111827]">
                        Cần thanh toán:
                      </span>
                      <span className="text-[18px] font-bold text-[#F97316]">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <svg
                        className="w-4 h-4 text-[#F59E0B]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-[12px] text-[#6B7280]">
                        Điểm thưởng: +{rewardPoints}
                      </span>
                    </div>
                    <button className="text-[12px] text-[#6B7280] hover:text-[#111827] flex items-center gap-1">
                      Rút gọn
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmOrder}
                  disabled={selectedItemsList.length === 0}
                  className={`w-full py-3 rounded-lg font-semibold text-[14px] transition-colors ${
                    selectedItemsList.length === 0
                      ? "bg-[#D1D5DB] text-[#9CA3AF] cursor-not-allowed"
                      : "bg-[#F97316] text-white hover:bg-[#EA580C]"
                  }`}
                >
                  Xác nhận đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


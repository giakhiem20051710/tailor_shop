import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";
import {
  getFabricCart,
  removeFromFabricCart,
  updateFabricCartQuantity,
  getFabricCartTotal,
  clearFabricCart,
} from "../utils/fabricCartStorage.js";

export default function FabricCartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const cart = getFabricCart();
    setCartItems(cart);
    
    // Kiểm tra nếu có sản phẩm vừa thêm từ "Mua ngay"
    const justAddedKey = location.state?.justAdded;
    if (justAddedKey) {
      // Chỉ tick chọn sản phẩm vừa thêm
      setSelectedItems(new Set([justAddedKey]));
      // Xóa state để lần sau vào trang sẽ không bị ảnh hưởng
      window.history.replaceState({}, document.title);
    } else {
      // Nếu không có sản phẩm vừa thêm, tự động chọn tất cả
      setSelectedItems(new Set(cart.map((item) => item.key)));
    }
  }, [location.state]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  };

  const getPriceValue = (priceStr) => {
    const match = priceStr?.match(/[\d.]+/);
    if (match) {
      return parseInt(match[0].replace(/\./g, ""), 10);
    }
    return 0;
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(cartItems.map((item) => item.key)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (key, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }
    setSelectedItems(newSelected);
  };

  const handleRemoveItem = (key) => {
    removeFromFabricCart(key);
    const updated = getFabricCart();
    setCartItems(updated);
    const newSelected = new Set(selectedItems);
    newSelected.delete(key);
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (key, newQuantity) => {
    updateFabricCartQuantity(key, newQuantity);
    const updated = getFabricCart();
    setCartItems(updated);
  };

  const selectedItemsList = cartItems.filter((item) =>
    selectedItems.has(item.key)
  );

  const subtotal = selectedItemsList.reduce((sum, item) => {
    return sum + getPriceValue(item.price) * (item.quantity || 1);
  }, 0);

  const totalDiscount = discount;
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const rewardPoints = Math.floor(finalTotal / 4000); // 1 điểm = 4000₫

  const allSelected = cartItems.length > 0 && selectedItems.size === cartItems.length;

  const handleConfirmOrder = () => {
    if (selectedItemsList.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    // Chuyển đến trang checkout với các sản phẩm đã chọn
    navigate("/checkout", {
      state: {
        items: selectedItemsList,
        total: finalTotal,
        discount: totalDiscount,
        subtotal: subtotal,
      },
    });
  };

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
                      const isSelected = selectedItems.has(item.key);
                      const priceValue = getPriceValue(item.price);
                      const originalPrice = Math.round(priceValue * 1.5); // Giả định giá gốc cao hơn 50%

                      return (
                        <div
                          key={item.key}
                          className="flex gap-4 pb-4 border-b border-[#E5E7EB] last:border-b-0"
                        >
                          {/* Checkbox */}
                          <label className="flex items-start pt-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                handleSelectItem(item.key, e.target.checked)
                              }
                              className="w-5 h-5 rounded border-[#D1D5DB] text-[#F97316] focus:ring-[#F97316] mt-1"
                            />
                          </label>

                          {/* Product Image */}
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] font-medium text-[#111827] mb-2 line-clamp-2">
                              {item.name}
                            </h3>
                            <div className="mb-2">
                              <select className="text-[12px] border border-[#E5E7EB] rounded px-2 py-1">
                                <option>Màu: Mặc định</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[16px] font-semibold text-[#F97316]">
                                {formatPrice(priceValue)}
                              </span>
                              <span className="text-[13px] text-[#9CA3AF] line-through">
                                {formatPrice(originalPrice)}
                              </span>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.key,
                                    Math.max(1, (item.quantity || 1) - 1)
                                  )
                                }
                                className="w-8 h-8 border border-[#E5E7EB] rounded flex items-center justify-center hover:bg-[#F9FAFB] transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity || 1}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.key,
                                    Math.max(1, parseInt(e.target.value || "1", 10))
                                  )
                                }
                                className="w-12 text-center border border-[#E5E7EB] rounded py-1 text-[13px] outline-none"
                              />
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.key,
                                    (item.quantity || 1) + 1
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
                            onClick={() => handleRemoveItem(item.key)}
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


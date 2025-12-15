import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { orderService, userService, authService } from "../services";
import Header from "../components/Header.jsx";
import StatusBadge from "../components/StatusBadge";

const CustomerOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageLightbox, setShowImageLightbox] = useState(null);

  useEffect(() => {
    // Reset state when id or location changes
    setOrder(null);
    setLoading(true);
    
    const loadOrder = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate("/login", { replace: true });
          return;
        }

        const profileResponse = await userService.getProfile();
        const currentUser = profileResponse?.data ?? profileResponse;
        setUser(currentUser);

        if (id) {
          const orderResponse = await orderService.getDetail(id);
          const orderData = orderResponse?.data ?? orderResponse;

          if (!orderData) {
            navigate("/customer/dashboard", { replace: true });
            return;
          }

          const orderCustomerId =
            orderData.customerId ||
            orderData.customer?.id ||
            orderData.customerId;

          const orderPhone =
            orderData.phone ||
            orderData.customerPhone ||
            orderData.customer?.phone;

          const orderName =
            orderData.name ||
            orderData.customerName ||
            orderData.customer?.name;

          const currentUserId = currentUser?.id || currentUser?.userId;

          const isCustomerOrder =
            (currentUserId && orderCustomerId && currentUserId === orderCustomerId) ||
            (orderPhone && currentUser?.phone && orderPhone === currentUser.phone) ||
            (orderName && currentUser?.name && orderName === currentUser.name) ||
            !orderCustomerId; // fallback to allow view if no customer binding

          if (isCustomerOrder) {
            setOrder(orderData);
          } else {
            navigate("/customer/dashboard", { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error("Error loading order detail:", error);
        navigate("/customer/dashboard", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate, location.pathname]);

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    if (typeof amount === "string" && amount.includes("đ")) return amount;
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
        <Header currentPage="/customer/dashboard" />
        <div className="pt-[170px] md:pt-[190px] pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
        <Header currentPage="/customer/dashboard" />
        <div className="pt-[170px] md:pt-[190px] pb-16">
          <div className="max-w-4xl mx-auto px-5 lg:px-8">
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-[#6B7280] mb-4">Không tìm thấy đơn hàng</p>
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="px-4 py-2 bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-colors"
              >
                Quay lại Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const measurementFields = [
    { key: "chest", label: "Vòng ngực", unit: "cm" },
    { key: "waist", label: "Vòng eo", unit: "cm" },
    { key: "hip", label: "Vòng mông", unit: "cm" },
    { key: "hips", label: "Vòng mông", unit: "cm" },
    { key: "shoulder", label: "Ngang vai", unit: "cm" },
    { key: "sleeveLength", label: "Dài tay", unit: "cm" },
    { key: "sleeve", label: "Dài tay", unit: "cm" },
    { key: "shirtLength", label: "Dài áo", unit: "cm" },
    { key: "pantsLength", label: "Dài quần", unit: "cm" },
    { key: "neck", label: "Vòng cổ", unit: "cm" },
    { key: "height", label: "Chiều cao", unit: "cm" },
    { key: "weight", label: "Cân nặng", unit: "kg" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1F2933] body-font antialiased">
      <Header currentPage="/customer/dashboard" />

      <div className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-5xl mx-auto px-4 lg:px-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <button
              onClick={() => navigate("/customer/dashboard")}
              className="flex items-center gap-2 text-[#1B4332] hover:text-[#14532d] text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>
          </div>

          {/* Shop Header - Shopee Style */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4332] to-[#14532d] flex items-center justify-center text-white font-bold">
                  MH
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">My Hiền Fashion Design Studio</h2>
                  <p className="text-xs text-gray-500">Tiệm may đo chuyên nghiệp</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                  💬 Chat
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                  Xem Shop
                </button>
              </div>
            </div>
          </div>

          {/* Order Status - Shopee Style */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái đơn hàng</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {order.status === "Hoàn thành" ? "Đơn hàng đã hoàn thành" : 
                     order.status === "Đang may" ? "Đang được may" :
                     order.status === "Mới" ? "Đã tiếp nhận" : order.status}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge luxury status={order.status} />
              </div>
            </div>
          </div>

          {/* Shipping Information - Shopee Style */}
          {order.status === "Hoàn thành" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Thông tin vận chuyển</h3>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Đơn vị vận chuyển:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {order.shippingCompany || "Giao hàng tận nơi"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Mã vận đơn:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {order.trackingNumber || `MH${order.id?.replace("O-", "") || "000"}${new Date().getFullYear()}`}
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Giao hàng thành công</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.deliveryDate 
                        ? new Date(order.deliveryDate).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }) + " " + (order.deliveryTime || "13:44")
                        : order.due 
                        ? new Date(order.due).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }) + " 13:44"
                        : new Date().toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }) + " 13:44"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address - Shopee Style */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Địa chỉ nhận hàng</h3>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {order.name || user?.name || "Khách hàng"}
                    {(order.phone || user?.phone) && (
                      <span className="text-gray-600 font-normal ml-2">
                        (+84) {(() => {
                          const phone = order.phone || user?.phone || "";
                          const cleaned = phone.replace(/^0/, "").replace(/\s/g, "");
                          if (cleaned.length === 9) {
                            return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
                          } else if (cleaned.length === 10) {
                            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
                          }
                          return cleaned;
                        })()}
                      </span>
                    )}
                  </p>
                  {order.address ? (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {order.address}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Địa chỉ chưa được cập nhật. Vui lòng liên hệ shop để cập nhật địa chỉ giao hàng.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Products List - Shopee Style */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Sản phẩm đã mua
            </h3>
            
            {/* Nếu là đơn hàng vải, hiển thị danh sách items */}
            {order.isFabricOrder && order.items && Array.isArray(order.items) && order.items.length > 0 ? (
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  const getPriceValue = (priceStr) => {
                    if (!priceStr) return 0;
                    const match = priceStr.match(/[\d.]+/);
                    if (match) {
                      return parseInt(match[0].replace(/\./g, ""), 10);
                    }
                    return 0;
                  };
                  
                  const itemPrice = getPriceValue(item.price);
                  const itemTotal = itemPrice * (item.quantity || 1);
                  
                  return (
                    <div key={item.key || index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                      {/* Product Image */}
                      <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.nextElementSibling;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-gray-400 ${item.image ? 'hidden' : ''}`}>
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="text-gray-500">Màu:</span> Mặc định
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="text-sm font-semibold text-red-600">
                              {formatCurrency(itemPrice)}
                            </span>
                            {item.unit && (
                              <span className="text-xs text-gray-500 ml-1">/{item.unit}</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">x{item.quantity || 1}</span>
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            Thành tiền: {formatCurrency(itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Đơn hàng may đo - hiển thị sản phẩm đơn lẻ */
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {order.sampleImages && order.sampleImages.length > 0 ? (
                    <img
                      src={order.sampleImages[0]}
                      alt="Sản phẩm"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {order.styleName || order.style || order.productName || "Sản phẩm may đo"}
                  </h3>
                  {order.productType && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-gray-500">Phân loại hàng:</span> {order.productType}
                    </p>
                  )}
                  {order.description && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-gray-500">Mô tả:</span> {order.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mb-2">x1</p>
                  
                  {/* Price */}
                  <div className="flex items-center gap-2">
                    {order.total && parseFloat(order.total) > 0 ? (
                      <span className="text-lg font-semibold text-red-600">
                        {formatCurrency(order.total)}
                      </span>
                    ) : (
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(order.total || 0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Review Section - Shopee Style */}
            {order.status === "Hoàn thành" && (
              <>
                {review ? (
                  /* Đã có đánh giá */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">Đánh giá của bạn</p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= review.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                        )}
                        {review.images && review.images.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {review.images.map((img, index) => (
                              <img
                                key={index}
                                src={img}
                                alt={`Review ${index + 1}`}
                                className="w-full h-20 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setShowImageLightbox(index)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Thành tiền:</p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Chưa có đánh giá */
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Đánh giá sản phẩm trước {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="text-xs text-orange-500 mt-1">
                        Đánh giá ngay và nhận 200 Xu
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Thành tiền:</p>
                      <p className="text-lg font-semibold text-red-600">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons - Shopee Style */}
            {order.status === "Hoàn thành" && (
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => navigate(`/customer/orders/${order.id}/review`)}
                  className={`flex-1 px-4 py-2 rounded hover:transition-colors text-sm font-medium ${
                    review
                      ? "border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  {review ? "Chỉnh sửa đánh giá" : "Đánh giá"}
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-medium">
                  Liên hệ người bán
                </button>
                <button 
                  onClick={() => navigate("/customer/order")}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Mua lại
                </button>
              </div>
            )}
          </div>

          {/* Order Details - Shopee Style */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Thông tin đơn hàng
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Mã đơn hàng" value={order.id} />
              <InfoRow label="Ngày đặt" value={order.receive ? new Date(order.receive).toLocaleDateString("vi-VN") : order.createdAt?.split("T")[0]} />
              <InfoRow label="Ngày hẹn" value={order.due ? new Date(order.due).toLocaleDateString("vi-VN") : "—"} />
              <InfoRow label="Trạng thái" value={order.status} />
            </div>
          </div>

          {/* Measurements */}
          {order.measurements && Object.keys(order.measurements).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Số đo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {measurementFields.map((field) => {
                  const value = order.measurements[field.key];
                  if (!value || value === "" || value === "0") return null;
                  return (
                    <div key={field.key} className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {value} {field.unit}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Info - Shopee Style */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Thông tin thanh toán
            </h3>
            <div className="space-y-2 text-sm">
              {/* Chi tiết từng sản phẩm cho đơn hàng vải */}
              {order.isFabricOrder && order.items && Array.isArray(order.items) && order.items.length > 0 && (
                <>
                  {order.items.map((item, index) => {
                    const getPriceValue = (priceStr) => {
                      if (!priceStr) return 0;
                      const match = priceStr.match(/[\d.]+/);
                      if (match) {
                        return parseInt(match[0].replace(/\./g, ""), 10);
                      }
                      return 0;
                    };
                    
                    const itemPrice = getPriceValue(item.price);
                    const itemTotal = itemPrice * (item.quantity || 1);
                    
                    return (
                      <div key={item.key || index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="text-gray-500 ml-2">x{item.quantity || 1}</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>
                    );
                  })}
                  {order.discount && parseFloat(order.discount) > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                      <span className="text-gray-600">Tổng khuyến mãi</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(order.discount)}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-between items-center py-2 border-t border-gray-200">
                <span className="text-gray-600 font-semibold">Tổng tiền hàng</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.total)}
                </span>
              </div>
              {order.deposit && (
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-gray-600">Đã đặt cọc</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.deposit)}
                  </span>
                </div>
              )}
              {order.total && order.deposit && (
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-gray-600">Còn lại</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(
                      (typeof order.total === "string" 
                        ? parseFloat(order.total.replace(/[^\d]/g, "")) 
                        : parseFloat(order.total) || 0) - 
                      (typeof order.deposit === "string" 
                        ? parseFloat(order.deposit.replace(/[^\d]/g, "")) 
                        : parseFloat(order.deposit) || 0)
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Info */}
          {(order.appointmentDate || order.appointmentTime) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Lịch hẹn
              </h3>
              <div className="space-y-2 text-sm">
                {order.appointmentDate && (
                  <InfoRow 
                    label="Ngày hẹn" 
                    value={new Date(order.appointmentDate).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })} 
                  />
                )}
                {order.appointmentTime && (
                  <InfoRow label="Giờ hẹn" value={order.appointmentTime} />
                )}
                {order.appointmentType && (
                  <InfoRow 
                    label="Loại hẹn" 
                    value={order.appointmentType === "fitting" ? "Thử đồ" : "Nhận đồ"} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Ghi chú
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap text-sm">{order.notes}</p>
            </div>
          )}

          {/* Sample Images */}
          {order.sampleImages && order.sampleImages.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Hình ảnh mẫu
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {order.sampleImages.map((img, index) => (
                  <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={img}
                      alt={`Mẫu ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions - Shopee Style */}
          {order.status !== "Hoàn thành" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/customer/dashboard")}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => navigate("/customer/order")}
                  className="flex-1 px-4 py-2 bg-[#1B4332] text-white rounded hover:bg-[#14532d] transition-colors text-sm font-medium"
                >
                  Đặt may mới
                </button>
              </div>
            </div>
          )}

          {/* Image Lightbox */}
          {showImageLightbox !== null && review?.images && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
              onClick={() => setShowImageLightbox(null)}
            >
              <button
                onClick={() => setShowImageLightbox(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {review.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageLightbox((prev) => (prev > 0 ? prev - 1 : review.images.length - 1));
                    }}
                    className="absolute left-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageLightbox((prev) => (prev < review.images.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              <img
                src={review.images[showImageLightbox]}
                alt={`Review image ${showImageLightbox + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              {review.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                  {showImageLightbox + 1} / {review.images.length}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

export default CustomerOrderDetailPage;


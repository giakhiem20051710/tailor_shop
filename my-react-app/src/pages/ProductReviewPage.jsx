import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getOrderById } from "../utils/orderStorage";
import { getCurrentUser } from "../utils/authStorage";
import { addReview, getReviewByOrderId, updateReview, deleteReview } from "../utils/reviewStorage";
import Header from "../components/Header.jsx";

const ProductReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingReview, setExistingReview] = useState(null);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (orderId) {
      const orderData = getOrderById(orderId);
      
      if (orderData) {
        const isCustomerOrder = 
          orderData.phone === currentUser?.phone ||
          orderData.name === currentUser?.name ||
          orderData.customerId === currentUser?.username;
        
        // Cho phép đánh giá nếu:
        // 1. Đơn hàng may đo: status phải là "Hoàn thành"
        // 2. Đơn hàng vải: có thể đánh giá ngay (vì đã thanh toán)
        const canReview = isCustomerOrder && (
          orderData.status === "Hoàn thành" || 
          orderData.isFabricOrder === true
        );
        
        if (canReview) {
          setOrder(orderData);
          
          // Kiểm tra xem đã có đánh giá chưa
          const review = getReviewByOrderId(orderId);
          if (review) {
            setExistingReview(review);
            setRating(review.rating || 5);
            setComment(review.comment || "");
            setImages(review.images || []);
          }
        } else {
          // Nếu không thể đánh giá, redirect về dashboard
          navigate("/customer/dashboard");
        }
      } else {
        navigate("/customer/dashboard");
      }
    } else {
      navigate("/customer/dashboard");
    }
    
    setLoading(false);
  }, [orderId, navigate]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert("Bạn chỉ có thể tải lên tối đa 5 hình ảnh");
      return;
    }
    
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImages((prev) => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      alert("Vui lòng nhập đánh giá của bạn");
      return;
    }

    setSubmitting(true);

    try {
      // Lấy fabricKeys từ đơn hàng vải
      let fabricKeys = [];
      if (order.isFabricOrder && order.items && Array.isArray(order.items)) {
        fabricKeys = order.items
          .map(item => {
            const key = item.key || item.fabricKey || item.id;
            console.log("🔍 Item:", item, "→ Key:", key);
            return key;
          })
          .filter(key => key); // Loại bỏ null/undefined
        console.log("📦 Order items:", order.items);
        console.log("🔑 Fabric keys extracted:", fabricKeys);
        
        if (fabricKeys.length === 0) {
          console.warn("⚠️ No fabric keys found in order items!");
        }
      } else {
        console.log("ℹ️ Not a fabric order or no items:", {
          isFabricOrder: order.isFabricOrder,
          hasItems: !!order.items,
          itemsType: Array.isArray(order.items) ? 'array' : typeof order.items
        });
      }

      const reviewData = {
        orderId: order.id,
        productName: order.styleName || order.style || order.productName || (order.isFabricOrder ? "Đơn mua vải" : "Sản phẩm may đo"),
        productType: order.productType || (order.isFabricOrder ? "Vải" : "May đo"),
        rating: rating,
        comment: comment.trim(),
        images: images,
        customerName: user?.name || order.name || "Khách hàng",
        customerId: user?.username || user?.phone,
        orderDate: order.receive || order.createdAt,
        fabricKeys: fabricKeys, // Lưu danh sách fabric keys để hiển thị trên trang sản phẩm
        isFabricOrder: order.isFabricOrder || false,
      };

      if (existingReview) {
        const updated = updateReview(existingReview.id, reviewData);
        console.log("✅ Updated review:", updated);
        setSubmitting(false);
        setReviewSubmitted(true);
        setShowSuccessModal(true);
      } else {
        const newReview = addReview(reviewData);
        console.log("✅ Added new review:", newReview);
        setSubmitting(false);
        setReviewSubmitted(true);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate(`/customer/orders/${order.id}`);
  };

  const handleViewOrder = () => {
    setShowSuccessModal(false);
    navigate(`/customer/orders/${order.id}`);
  };

  const handleDeleteReview = () => {
    if (existingReview) {
      deleteReview(existingReview.id);
      alert("Đã xóa đánh giá thành công!");
      navigate(`/customer/orders/${order.id}`);
    }
  };

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
    return null;
  }

  // Lấy hình ảnh sản phẩm
  let productImage = null;
  if (order.sampleImages && Array.isArray(order.sampleImages) && order.sampleImages.length > 0) {
    productImage = order.sampleImages[0];
  } else if (order.isFabricOrder && order.items && Array.isArray(order.items) && order.items.length > 0) {
    productImage = order.items[0]?.image;
  }

  const productName = order.styleName || order.style || order.productName || (order.isFabricOrder ? "Đơn mua vải" : "Sản phẩm may đo");

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header currentPage="/customer/dashboard" />
      
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(`/customer/orders/${order.id}`)}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại chi tiết đơn hàng
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {existingReview ? "Chỉnh sửa đánh giá" : "Đánh giá sản phẩm"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Chia sẻ trải nghiệm của bạn về sản phẩm này
            </p>
          </div>

          {/* Product Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{productName}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Mã đơn: {order.id}
                </p>
                <p className="text-sm font-semibold text-red-600">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Đánh giá của bạn <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-10 h-10 ${
                        star <= rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {rating === 5 ? "Rất hài lòng" : 
                   rating === 4 ? "Hài lòng" : 
                   rating === 3 ? "Bình thường" : 
                   rating === 2 ? "Không hài lòng" : "Rất không hài lòng"}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Nhận xét chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setComment(e.target.value);
                  }
                }}
                rows={6}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] outline-none resize-none"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                required
              />
              <p className={`text-xs mt-1 ${comment.length >= 500 ? 'text-red-500' : 'text-gray-500'}`}>
                {comment.length}/500 ký tự
              </p>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Hình ảnh (Tùy chọn)
              </label>
              <div className="grid grid-cols-5 gap-3 mb-3">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Review ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setShowImageLightbox(index)}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#1B4332] hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Tối đa 5 hình ảnh (JPG, PNG)
              </p>
            </div>

            {/* Reward Info */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-orange-900">
                    Nhận 200 Xu khi đánh giá
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Xu sẽ được cộng vào tài khoản của bạn sau khi đánh giá được duyệt
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              {existingReview && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  Xóa đánh giá
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(`/customer/orders/${order.id}`)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="flex-1 px-4 py-3 bg-[#1B4332] text-white rounded-lg hover:bg-[#14532d] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang gửi..." : existingReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
              </button>
            </div>
          </form>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onClick={() => setShowDeleteConfirm(false)}
            >
              <div 
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa đánh giá</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteReview();
                      setShowDeleteConfirm(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal Popup */}
          {showSuccessModal && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                animation: 'fadeIn 0.3s ease-out'
              }}
              onClick={handleCloseSuccessModal}
            >
              <div 
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all"
                style={{
                  animation: 'slideUp 0.4s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Success Icon Header */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-6 pt-8 pb-6 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg transform transition-all hover:scale-110"
                    style={{
                      animation: 'scaleIn 0.5s ease-out 0.2s both'
                    }}
                  >
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {reviewSubmitted && existingReview ? "Cập nhật đánh giá thành công!" : "Đánh giá thành công!"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Cảm ơn bạn đã chia sẻ trải nghiệm của mình
                  </p>
                </div>

                {/* Reward Info */}
                <div className="px-6 py-4 bg-orange-50 border-y border-orange-200">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-orange-900">+200 Xu</p>
                      <p className="text-xs text-orange-700">Đã được cộng vào tài khoản</p>
                    </div>
                  </div>
                </div>

                {/* Review Summary */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sản phẩm:</span>
                      <span className="font-semibold text-gray-900">{productName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Đánh giá:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-gray-700 font-medium">{rating}/5</span>
                      </div>
                    </div>
                    {comment && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Nhận xét:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{comment}</p>
                      </div>
                    )}
                    {images.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Hình ảnh:</p>
                        <div className="flex gap-2">
                          {images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Review ${idx + 1}`}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                            />
                          ))}
                          {images.length > 3 && (
                            <div className="w-12 h-12 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                              +{images.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 space-y-2">
                  <button
                    onClick={handleViewOrder}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold text-sm hover:from-orange-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Xem đơn hàng
                  </button>
                  <button
                    onClick={handleCloseSuccessModal}
                    className="w-full py-2.5 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add CSS Animations */}
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>

          {/* Image Lightbox */}
          {showImageLightbox !== null && (
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
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageLightbox((prev) => (prev > 0 ? prev - 1 : images.length - 1));
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
                      setShowImageLightbox((prev) => (prev < images.length - 1 ? prev + 1 : 0));
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
                src={images[showImageLightbox]}
                alt={`Review image ${showImageLightbox + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                  {showImageLightbox + 1} / {images.length}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductReviewPage;


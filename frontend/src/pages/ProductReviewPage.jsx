import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import orderService from "../services/orderService";
import reviewService from "../services/reviewService";
import imageAssetService from "../services/imageAssetService";
import { getCurrentUser } from "../utils/authStorage";
import { showSuccess, showError, showWarning } from "../components/NotificationToast.jsx";
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
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [imageFiles, setImageFiles] = useState([]); // Store File objects
  const [imageUrls, setImageUrls] = useState([]); // Store preview URLs
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }
        setUser(currentUser);

        if (!orderId) {
          navigate("/customer/dashboard");
          return;
        }

        // Load order from API
        const orderResponse = await orderService.getDetail(orderId);
        const orderData = orderResponse?.responseData ?? orderResponse?.data ?? orderResponse;
        
        if (!orderData) {
          showError("Không tìm thấy đơn hàng");
          navigate("/customer/dashboard");
          return;
        }

        // Check if user is the owner of this order
        const isCustomerOrder = 
          orderData.customerId === currentUser.id ||
          orderData.customer?.id === currentUser.id ||
          orderData.phone === currentUser.phone;
        
        if (!isCustomerOrder) {
          showError("Bạn không có quyền đánh giá đơn hàng này");
          navigate("/customer/dashboard");
          return;
        }

        // Check if order can be reviewed (status must be COMPLETED or DELIVERED)
        const canReview = orderData.status === "COMPLETED" || 
                         orderData.status === "DELIVERED" ||
                         orderData.status === "Hoàn thành";
        
        if (!canReview) {
          showWarning("Chỉ có thể đánh giá đơn hàng đã hoàn thành");
          navigate("/customer/dashboard");
          return;
        }

        setOrder(orderData);

        // Check if user has already reviewed this order
        try {
          const hasReviewed = await reviewService.hasReviewedOrder(orderId);
          if (hasReviewed) {
            // Load existing review
            const reviewListResponse = await reviewService.list({
              orderId: orderId,
              userId: currentUser.id
            });
            const reviewList = reviewListResponse?.responseData?.content ?? 
                              reviewListResponse?.data?.content ?? 
                              reviewListResponse?.content ?? [];
            
            if (reviewList.length > 0) {
              const existing = reviewList[0];
              setExistingReview(existing);
              setRating(existing.rating || 5);
              setTitle(existing.title || "");
              setComment(existing.comment || "");
              setImageUrls(existing.imageUrls || []);
              setIsAnonymous(existing.isAnonymous || false);
            }
          }
        } catch (error) {
          console.error("Error checking review:", error);
          // Continue anyway, allow user to create review
        }
      } catch (error) {
        console.error("Error loading order:", error);
        showError("Không thể tải thông tin đơn hàng");
        navigate("/customer/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId, navigate]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 9) {
      showWarning("Bạn chỉ có thể tải lên tối đa 9 hình ảnh");
      return;
    }
    
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        // Store file object
        setImageFiles((prev) => [...prev, file]);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUrls((prev) => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      showError("Vui lòng chọn đánh giá từ 1 đến 5 sao");
      return;
    }

    if (!comment.trim() && !title.trim()) {
      showError("Vui lòng nhập nhận xét hoặc tiêu đề đánh giá");
      return;
    }

    if (comment.length > 5000) {
      showError("Nhận xét không được vượt quá 5000 ký tự");
      return;
    }

    if (title.length > 255) {
      showError("Tiêu đề không được vượt quá 255 ký tự");
      return;
    }

    setSubmitting(true);
    setUploadingImages(true);

    try {
      // Upload images to S3 first
      let uploadedImageUrls = [];
      if (imageFiles.length > 0) {
        try {
          const uploadPromises = imageFiles.map(file => 
            imageAssetService.upload(file, {
              description: `Review image for order ${orderId}`,
              category: 'review'
            })
          );
          
          const uploadResults = await Promise.all(uploadPromises);
          uploadedImageUrls = uploadResults.map(result => {
            const data = result?.responseData ?? result?.data ?? result;
            return data?.url || data?.s3Url || data?.imageUrl;
          }).filter(url => url); // Remove null/undefined
          
          console.log("Uploaded images:", uploadedImageUrls);
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          showWarning("Một số hình ảnh không thể tải lên. Tiếp tục với các hình ảnh đã tải lên thành công.");
        }
      }

      // Combine uploaded images with existing imageUrls (if editing)
      const allImageUrls = [...uploadedImageUrls, ...imageUrls.filter(url => 
        typeof url === 'string' && (url.startsWith('http') || url.startsWith('https'))
      )];

      // Build payload matching ReviewRequest DTO
      const reviewPayload = {
        rating: rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
        imageUrls: allImageUrls.length > 0 ? allImageUrls : null,
        isAnonymous: isAnonymous
      };

      console.log("Submitting review with payload:", reviewPayload);

      let response;
      if (existingReview) {
        // Update existing review
        response = await reviewService.update(existingReview.id, reviewPayload);
        showSuccess("Cập nhật đánh giá thành công!");
      } else {
        // Create new review
        response = await reviewService.createOrderReview(orderId, reviewPayload);
        showSuccess("Gửi đánh giá thành công!");
      }

      // Handle response
      const reviewData = response?.responseData ?? response?.data ?? response;
      console.log("Review response:", reviewData);

      setReviewSubmitted(true);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error submitting review:", error);
      const errorMsg = error?.response?.data?.responseMessage ||
                      error?.response?.data?.message ||
                      error?.message ||
                      "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.";
      showError(errorMsg);
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
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

  const handleDeleteReview = async () => {
    if (!existingReview) return;

    try {
      setSubmitting(true);
      await reviewService.delete(existingReview.id);
      showSuccess("Đã xóa đánh giá thành công!");
      navigate(`/customer/orders/${order.id}`);
    } catch (error) {
      console.error("Error deleting review:", error);
      const errorMsg = error?.response?.data?.responseMessage ||
                      error?.response?.data?.message ||
                      error?.message ||
                      "Không thể xóa đánh giá. Vui lòng thử lại.";
      showError(errorMsg);
    } finally {
      setSubmitting(false);
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

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tiêu đề đánh giá (Tùy chọn)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  if (e.target.value.length <= 255) {
                    setTitle(e.target.value);
                  }
                }}
                maxLength={255}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] outline-none"
                placeholder="Tóm tắt đánh giá của bạn..."
              />
              <p className={`text-xs mt-1 ${title.length >= 255 ? 'text-red-500' : 'text-gray-500'}`}>
                {title.length}/255 ký tự
              </p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Nhận xét chi tiết {!title.trim() && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comment}
                onChange={(e) => {
                  if (e.target.value.length <= 5000) {
                    setComment(e.target.value);
                  }
                }}
                rows={6}
                maxLength={5000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] outline-none resize-none"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                required={!title.trim()}
              />
              <p className={`text-xs mt-1 ${comment.length >= 5000 ? 'text-red-500' : 'text-gray-500'}`}>
                {comment.length}/5000 ký tự
              </p>
            </div>

            {/* Anonymous Checkbox */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-[#1B4332] border-gray-300 rounded focus:ring-[#1B4332]"
                />
                <span className="text-sm text-gray-700">
                  Đánh giá ẩn danh (tên của bạn sẽ không hiển thị)
                </span>
              </label>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Hình ảnh (Tùy chọn, tối đa 9 ảnh)
              </label>
              {uploadingImages && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">Đang tải lên hình ảnh...</p>
                </div>
              )}
              <div className="grid grid-cols-5 gap-3 mb-3">
                {imageUrls.map((img, index) => (
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
                {imageUrls.length < 9 && (
                  <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#1B4332] hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Tối đa 9 hình ảnh (JPG, PNG). Kích thước tối đa 5MB mỗi ảnh.
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
                disabled={submitting || (!comment.trim() && !title.trim())}
                className="flex-1 px-4 py-3 bg-[#1B4332] text-white rounded-lg hover:bg-[#14532d] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (uploadingImages ? "Đang tải ảnh..." : "Đang gửi...") : existingReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
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
                    {imageUrls.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Hình ảnh:</p>
                        <div className="flex gap-2">
                          {imageUrls.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Review ${idx + 1}`}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                            />
                          ))}
                          {imageUrls.length > 3 && (
                            <div className="w-12 h-12 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                              +{imageUrls.length - 3}
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
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageLightbox((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1));
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
                      setShowImageLightbox((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0));
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
                src={imageUrls[showImageLightbox]}
                alt={`Review image ${showImageLightbox + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              {imageUrls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                  {showImageLightbox + 1} / {imageUrls.length}
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


import { useState, useEffect, useMemo } from "react";
import { reviewService, authService } from "../services";
import { showSuccess, showError } from "./NotificationToast.jsx";
import { getCurrentUser } from "../utils/authStorage.js";

/**
 * ReviewSection Component
 * Hiển thị danh sách reviews và form thêm review cho sản phẩm/vải
 */
export default function ReviewSection({
  productId,
  imageAssetId,
  productName,
  productImage,
  type = "PRODUCT" // PRODUCT, ORDER, or IMAGE_ASSET
}) {
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState(null); // null = all, 1-5 = specific rating

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
    imageUrls: [],
    isAnonymous: false,
  });

  const user = getCurrentUser();
  const isAuthenticated = authService.isAuthenticated?.() ?? false;

  const targetId = type === 'IMAGE_ASSET' ? imageAssetId : productId;

  // Load reviews and statistics
  useEffect(() => {
    if (targetId) {
      loadReviews();
      loadStatistics();
      if (isAuthenticated) {
        checkHasReviewed();
      }
    }
  }, [targetId, type, currentPage, ratingFilter]);

  // Reload statistics periodically to catch new approved reviews
  useEffect(() => {
    if (!targetId) return;

    const interval = setInterval(() => {
      loadStatistics();
    }, 10000); // Reload every 10 seconds

    return () => clearInterval(interval);
  }, [targetId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const filters = {
        type: type,
        ...(type === 'PRODUCT' ? { productId: targetId } : {}),
        ...(type === 'IMAGE_ASSET' ? { imageAssetId: targetId } : {}),
        ...(type === 'ORDER' ? { orderId: targetId } : {}),
        ...(ratingFilter && { rating: ratingFilter }),
      };
      const pagination = {
        page: currentPage,
        size: 10,
      };
      const response = await reviewService.list(filters, pagination);
      const data = reviewService.parseResponse(response);
      const reviewsData = data?.content || data?.data || (Array.isArray(data) ? data : []);
      console.log("[ReviewSection] Loaded reviews:", reviewsData.length, reviewsData);
      setReviews(reviewsData);
      setTotalPages(data?.totalPages || 1);
    } catch (error) {
      console.error("Error loading reviews:", error);
      showError("Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await reviewService.getStatistics({
        type: type,
        productId: type === 'PRODUCT' ? targetId : null,
        imageAssetId: type === 'IMAGE_ASSET' ? targetId : null,
        // orderId not typically used for stats but can be if needed
      });
      const data = reviewService.parseResponse(response);
      console.log("[ReviewSection] Loaded statistics:", data);
      setStatistics(data);
    } catch (error) {
      console.error("Error loading review statistics:", error);
      // Set default statistics if error
      setStatistics({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {},
        reviewsWithImages: 0,
        reviewsWithReply: 0,
        verifiedPurchaseReviews: 0,
      });
    }
  };

  const checkHasReviewed = async () => {
    try {
      if (type === "PRODUCT") {
        const hasReviewedResponse = await reviewService.hasReviewedProduct(targetId);
        setHasReviewed(hasReviewedResponse);
      } else if (type === "IMAGE_ASSET") {
        const hasReviewedResponse = await reviewService.hasReviewedImageAsset(targetId);
        setHasReviewed(hasReviewedResponse);
      }
    } catch (error) {
      console.error("Error checking has reviewed:", error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showError("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      showError("Vui lòng chọn số sao đánh giá");
      return;
    }

    try {
      setSubmitting(true);
      const reviewData = {
        rating: reviewForm.rating,
        title: reviewForm.title?.trim() || null,
        comment: reviewForm.comment?.trim() || null,
        imageUrls: reviewForm.imageUrls.filter(url => url?.trim()),
        isAnonymous: reviewForm.isAnonymous || false,
      };

      let response;
      if (type === "PRODUCT") {
        response = await reviewService.createProductReview(targetId, reviewData);
      } else if (type === "ORDER") {
        response = await reviewService.createOrderReview(targetId, reviewData);
      } else if (type === "IMAGE_ASSET") {
        response = await reviewService.createImageAssetReview(targetId, reviewData);
      } else {
        showError("Loại đánh giá không được hỗ trợ");
        return;
      }

      const createdReview = reviewService.parseResponse(response);
      showSuccess("Cảm ơn bạn đã đánh giá! Đánh giá của bạn đang được xét duyệt.");

      // Reset form
      setReviewForm({
        rating: 5,
        title: "",
        comment: "",
        imageUrls: [],
        isAnonymous: false,
      });
      setShowReviewForm(false);
      setHasReviewed(true);

      // Reload reviews and statistics
      setTimeout(async () => {
        await loadStatistics();
        await loadReviews();
      }, 500);
    } catch (error) {
      console.error("Error submitting review:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Không thể gửi đánh giá";
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ... (handleVoteHelpful remains effectively same for logic, just variable access)

  const handleVoteHelpful = async (reviewId, isHelpful) => {
    if (!isAuthenticated) {
      showError("Vui lòng đăng nhập để thích đánh giá");
      return;
    }

    try {
      if (isHelpful) {
        await reviewService.unvoteHelpful(reviewId);
      } else {
        await reviewService.voteHelpful(reviewId);
      }
      await loadReviews();
    } catch (error) {
      console.error("Error voting helpful:", error);
      showError("Không thể cập nhật đánh giá");
    }
  };

  const ratingDistribution = useMemo(() => {
    if (!statistics?.ratingDistribution) return {};
    const dist = { ...statistics.ratingDistribution };
    for (let i = 1; i <= 5; i++) {
      if (!dist[i]) dist[i] = 0;
    }
    return dist;
  }, [statistics]);

  const averageRating = useMemo(() => {
    if (!statistics?.averageRating) return "0.0";
    const avg = Number(statistics.averageRating);
    return isNaN(avg) ? "0.0" : avg.toFixed(1);
  }, [statistics]);

  const totalReviews = statistics?.totalReviews || 0;

  if (!targetId) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-[#E4D8C3] pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="heading-font text-[24px] font-semibold text-[#1B4332] mb-2">
            Đánh giá {type === 'IMAGE_ASSET' ? 'thiết kế' : 'sản phẩm'}
          </h2>
          {statistics && (
            <div className="flex items-center gap-4 text-[14px] text-[#6B7280]">
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-bold text-[#1B4332]">{averageRating}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-amber-400">
                      {star <= Math.round(Number(averageRating)) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
              </div>
              <span>•</span>
              <span>{totalReviews} đánh giá</span>
            </div>
          )}
        </div>
        {isAuthenticated && !hasReviewed && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-5 py-2.5 rounded-full bg-[#1B4332] text-white text-[13px] font-semibold hover:bg-[#133021] transition-all"
          >
            + Viết đánh giá
          </button>
        )}
      </div>

      {/* Rating Distribution */}
      {statistics && totalReviews > 0 && (
        <div className="mb-6 p-4 bg-[#F8F4EC] rounded-[20px] border border-[#E4D8C3]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[13px] font-semibold text-[#1B4332]">Lọc theo sao:</span>
            <button
              onClick={() => setRatingFilter(null)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${ratingFilter === null
                ? "bg-[#1B4332] text-white"
                : "bg-white text-[#1B4332] border border-[#E4D8C3] hover:bg-[#F8F4EC]"
                }`}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setRatingFilter(rating)}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${ratingFilter === rating
                  ? "bg-[#1B4332] text-white"
                  : "bg-white text-[#1B4332] border border-[#E4D8C3] hover:bg-[#F8F4EC]"
                  }`}
              >
                {rating} sao ({ratingDistribution[rating] || 0})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewFormModal
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          onSubmit={handleSubmitReview}
          onClose={() => setShowReviewForm(false)}
          submitting={submitting}
          productName={productName}
        />
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 text-[#6B7280]">
            <div className="w-5 h-5 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[14px]">Đang tải đánh giá...</span>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[48px] mb-3">💬</p>
          <p className="text-[16px] font-semibold text-[#1B4332] mb-1">
            Chưa có đánh giá nào
          </p>
          <p className="text-[13px] text-[#6B7280]">
            Hãy là người đầu tiên đánh giá sản phẩm này!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVoteHelpful={handleVoteHelpful}
              isAuthenticated={isAuthenticated}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${currentPage === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-[#E4D8C3] text-[#111827] hover:bg-[#F8F4EC]"
                  }`}
              >
                ← Trước
              </button>
              <span className="text-[13px] text-[#6B7280]">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${currentPage >= totalPages - 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-[#E4D8C3] text-[#111827] hover:bg-[#F8F4EC]"
                  }`}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Review Card Component
 */
function ReviewCard({ review, onVoteHelpful, isAuthenticated }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#E4D8C3] p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#FFF7E6] to-[#F8F4EC] border border-[#E4D8C3] flex items-center justify-center text-[18px]">
          {review.isAnonymous ? "👤" : (review.userAvatar ? (
            <img src={review.userAvatar} alt={review.userName} className="w-full h-full rounded-full object-cover" />
          ) : (
            (review.userName?.[0] || "U").toUpperCase()
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="font-semibold text-[#1B4332] text-[14px] mb-1">
                {review.isAnonymous ? "Khách hàng ẩn danh" : (review.userName || "Khách hàng")}
              </p>
              <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= review.rating ? "text-amber-400" : "text-gray-300"}>
                      ★
                    </span>
                  ))}
                </div>
                <span>•</span>
                <span>{formatDate(review.createdAt)}</span>
                {review.isVerifiedPurchase && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold">
                      ✓ Đã mua
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {review.title && (
            <h4 className="font-semibold text-[#1B4332] text-[15px] mb-2">
              {review.title}
            </h4>
          )}

          {review.comment && (
            <p className="text-[14px] text-[#4B5563] mb-3 whitespace-pre-wrap">
              {review.comment}
            </p>
          )}

          {/* Images */}
          {review.imageUrls && review.imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {review.imageUrls.slice(0, 9).map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Review image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-[12px] border border-[#E4D8C3] cursor-pointer hover:opacity-80"
                  onClick={() => window.open(imageUrl, "_blank")}
                />
              ))}
            </div>
          )}

          {/* Shop Reply */}
          {review.replyText && (
            <div className="mt-3 p-3 bg-[#F8F4EC] rounded-[12px] border-l-4 border-[#1B4332]">
              <p className="text-[12px] font-semibold text-[#1B4332] mb-1">
                Phản hồi từ cửa hàng
              </p>
              <p className="text-[13px] text-[#4B5563]">{review.replyText}</p>
              {review.repliedAt && (
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  {formatDate(review.repliedAt)}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => onVoteHelpful(review.id, review.isHelpfulByCurrentUser)}
              disabled={!isAuthenticated}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${review.isHelpfulByCurrentUser
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-[#F8F4EC] text-[#6B7280] border border-[#E4D8C3] hover:bg-white"
                }`}
            >
              <span>{review.isHelpfulByCurrentUser ? "❤️" : "🤍"}</span>
              <span>Hữu ích</span>
              {review.helpfulCount > 0 && (
                <span className="text-[11px]">({review.helpfulCount})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Review Form Modal Component
 */
function ReviewFormModal({ reviewForm, setReviewForm, onSubmit, onClose, submitting, productName }) {
  const [imageUrls, setImageUrls] = useState(reviewForm.imageUrls || []);

  const handleImageUrlAdd = () => {
    const url = prompt("Nhập URL hình ảnh:");
    if (url && url.trim()) {
      setImageUrls(prev => [...prev, url.trim()]);
    }
  };

  const handleImageUrlRemove = (index) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    setReviewForm(prev => ({ ...prev, imageUrls }));
  }, [imageUrls, setReviewForm]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-[30px] shadow-2xl border border-[#E4D8C3] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[20px] font-semibold text-[#1B4332]">
              Viết đánh giá
            </h3>
            {productName && (
              <p className="text-[13px] text-[#6B7280] mt-1">
                Sản phẩm: {productName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Rating */}
          <div>
            <label className="block text-[13px] font-semibold text-[#1B4332] mb-2">
              Đánh giá sao <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                  className={`text-[32px] transition-all ${star <= reviewForm.rating ? "text-amber-400" : "text-gray-300"
                    } hover:scale-110`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-[14px] text-[#6B7280]">
                {reviewForm.rating} sao
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[13px] font-semibold text-[#1B4332] mb-2">
              Tiêu đề (tùy chọn)
            </label>
            <input
              type="text"
              maxLength={255}
              value={reviewForm.title}
              onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ví dụ: Sản phẩm rất đẹp, chất lượng tốt"
              className="w-full px-4 py-3 rounded-[16px] border border-[#E4D8C3] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-[13px] font-semibold text-[#1B4332] mb-2">
              Nội dung đánh giá <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              maxLength={5000}
              rows={6}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              className="w-full px-4 py-3 rounded-[16px] border border-[#E4D8C3] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1B4332] resize-none"
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1 text-right">
              {reviewForm.comment.length}/5000 ký tự
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-[13px] font-semibold text-[#1B4332] mb-2">
              Hình ảnh (tối đa 9 ảnh)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Review ${index + 1}`}
                    className="w-full h-24 object-cover rounded-[12px] border border-[#E4D8C3]"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-24 rounded-[12px] border border-[#E4D8C3] bg-[#F8F4EC] flex items-center justify-center text-[10px] text-[#9CA3AF]" style={{ display: 'none' }}>
                    Invalid URL
                  </div>
                  <button
                    type="button"
                    onClick={() => handleImageUrlRemove(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-[12px] flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              {imageUrls.length < 9 && (
                <button
                  type="button"
                  onClick={handleImageUrlAdd}
                  className="w-full h-24 rounded-[12px] border-2 border-dashed border-[#E4D8C3] bg-[#F8F4EC] flex items-center justify-center text-[#6B7280] hover:bg-[#FFF7E6] transition-all"
                >
                  + Thêm ảnh
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Nhập URL hình ảnh (hỗ trợ tối đa 9 ảnh)
            </p>
          </div>

          {/* Anonymous */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={reviewForm.isAnonymous}
              onChange={(e) => setReviewForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
              className="w-4 h-4 rounded border-[#E4D8C3] text-[#1B4332] focus:ring-[#1B4332]"
            />
            <label htmlFor="isAnonymous" className="text-[13px] text-[#6B7280]">
              Đánh giá ẩn danh
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 rounded-full border border-[#E4D8C3] text-[#1B4332] text-[14px] font-semibold hover:bg-[#F8F4EC] transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !reviewForm.rating || !reviewForm.comment?.trim()}
              className="flex-1 px-5 py-3 rounded-full bg-[#1B4332] text-white text-[14px] font-semibold hover:bg-[#133021] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


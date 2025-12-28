import { useEffect, useState } from "react";
import promotionService from "../services/promotionService";
import { showSuccess, showError, showWarning } from "../components/NotificationToast.jsx";

const PromotionManagementPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalUsages: 0
  });

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "PERCENTAGE", // PERCENTAGE or FIXED_AMOUNT
    value: "",
    minOrderValue: "",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
    maxUsage: "",
    maxUsagePerUser: "",
    isPublic: true,
    priority: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, [filterStatus, searchTerm]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterStatus !== "all") {
        filters.status = filterStatus.toUpperCase();
      }
      if (searchTerm) {
        filters.keyword = searchTerm;
      }

      console.log('[PromotionManagementPage] Loading promotions with filters:', filters);
      const response = await promotionService.list(filters, { page: 0, size: 100 });
      console.log('[PromotionManagementPage] Raw API response:', response);
      console.log('[PromotionManagementPage] Response keys:', Object.keys(response || {}));

      // Parse response - Backend trả về CommonResponse<Page<PromotionResponse>>
      let promotionsData = [];

      // Ưu tiên responseData.content (cấu trúc chuẩn từ CommonResponse)
      if (response?.responseData?.content && Array.isArray(response.responseData.content)) {
        promotionsData = response.responseData.content;
        console.log('[PromotionManagementPage] ✅ Found in responseData.content, count:', promotionsData.length);
      }
      // Fallback: data.content
      else if (response?.data?.content && Array.isArray(response.data.content)) {
        promotionsData = response.data.content;
        console.log('[PromotionManagementPage] ✅ Found in data.content, count:', promotionsData.length);
      }
      // Fallback: responseData là Page object trực tiếp
      else if (response?.responseData && Array.isArray(response.responseData)) {
        promotionsData = response.responseData;
        console.log('[PromotionManagementPage] ✅ Found in responseData (direct array), count:', promotionsData.length);
      }
      // Fallback: content trực tiếp
      else if (Array.isArray(response?.content)) {
        promotionsData = response.content;
        console.log('[PromotionManagementPage] ✅ Found in content (direct array), count:', promotionsData.length);
      }
      // Fallback: data trực tiếp
      else if (Array.isArray(response?.data)) {
        promotionsData = response.data;
        console.log('[PromotionManagementPage] ✅ Found in data (direct array), count:', promotionsData.length);
      }
      // Fallback: response là array trực tiếp
      else if (Array.isArray(response)) {
        promotionsData = response;
        console.log('[PromotionManagementPage] ✅ Found as direct array, count:', promotionsData.length);
      }
      else {
        console.warn('[PromotionManagementPage] ⚠️ Unknown response structure:', response);
        promotionsData = [];
      }

      console.log('[PromotionManagementPage] Final promotions list:', promotionsData.length, 'items');
      if (promotionsData.length > 0) {
        console.log('[PromotionManagementPage] First promotion sample:', promotionsData[0]);
      }

      setPromotions(promotionsData);

      // Calculate stats
      const active = promotionsData.filter(p => p.status === 'ACTIVE').length;
      const inactive = promotionsData.filter(p => p.status === 'INACTIVE').length;
      setStats({
        total: promotionsData.length,
        active,
        inactive,
        active,
        inactive,
        totalUsages: promotionsData.reduce((sum, p) => sum + (p.totalUsageCount || 0), 0)
      });
    } catch (error) {
      console.error("[PromotionManagementPage] Failed to load promotions:", error);
      console.error("[PromotionManagementPage] Error details:", error.response?.data || error.message);
      const errorMsg = error?.response?.data?.responseMessage ||
        error?.message ||
        "Không thể tải danh sách mã giảm giá";
      showError(errorMsg);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('[PromotionManagementPage] Already submitting, ignoring duplicate request');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.code?.trim()) {
        showError("Mã giảm giá là bắt buộc");
        e.target.disabled = false;
        return;
      }
      if (!formData.name?.trim()) {
        showError("Tên mã là bắt buộc");
        e.target.disabled = false;
        return;
      }
      if (!formData.startDate) {
        showError("Ngày bắt đầu là bắt buộc");
        e.target.disabled = false;
        return;
      }
      if (!formData.endDate) {
        showError("Ngày kết thúc là bắt buộc");
        e.target.disabled = false;
        return;
      }

      // Validate and parse value
      const valueStr = String(formData.value || '').trim().replace(/,/g, '');
      const val = parseFloat(valueStr);
      
      if (!valueStr || isNaN(val) || val <= 0 || !isFinite(val)) {
        showError("Giá trị giảm giá phải là số dương hợp lệ");
        e.target.disabled = false;
        return;
      }

      // Build payload matching PromotionRequest DTO exactly
      // Backend expects: code, name, description, type, startDate, endDate, 
      // discountPercentage (for PERCENTAGE), discountAmount (for FIXED_AMOUNT),
      // maxDiscountAmount, minOrderValue, maxUsageTotal, maxUsagePerUser,
      // isPublic, isSingleUse, priority
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isPublic: formData.isPublic !== undefined ? Boolean(formData.isPublic) : true,
        isSingleUse: false,
        priority: formData.priority ? parseInt(formData.priority, 10) : 0
      };

      // Add type-specific discount fields - MUST be present and > 0
      if (formData.type === 'PERCENTAGE') {
        if (val <= 0 || val > 100) {
          showError("Phần trăm giảm giá phải từ 1 đến 100");
          setIsSubmitting(false);
          return;
        }
        payload.discountPercentage = val; // Backend expects BigDecimal, JSON number is fine
        if (formData.maxDiscountAmount) {
          const maxDisc = parseFloat(String(formData.maxDiscountAmount).replace(/,/g, ''));
          if (!isNaN(maxDisc) && maxDisc > 0) {
            payload.maxDiscountAmount = maxDisc;
          }
        }
      } else if (formData.type === 'FIXED_AMOUNT') {
        if (val <= 0) {
          showError("Số tiền giảm giá phải lớn hơn 0");
          setIsSubmitting(false);
          return;
        }
        payload.discountAmount = val; // Backend expects BigDecimal, JSON number is fine
      } else {
        showError("Loại giảm giá không hợp lệ");
        setIsSubmitting(false);
        return;
      }

      // Add optional numeric fields
      if (formData.minOrderValue) {
        const minOrder = parseFloat(String(formData.minOrderValue).replace(/,/g, ''));
        if (!isNaN(minOrder) && minOrder > 0) {
          payload.minOrderValue = minOrder;
        }
      }
      if (formData.maxUsage) {
        const maxUsage = parseInt(formData.maxUsage, 10);
        if (!isNaN(maxUsage) && maxUsage > 0) {
          payload.maxUsageTotal = maxUsage;
        }
      }
      if (formData.maxUsagePerUser) {
        const maxUsagePerUser = parseInt(formData.maxUsagePerUser, 10);
        if (!isNaN(maxUsagePerUser) && maxUsagePerUser > 0) {
          payload.maxUsagePerUser = maxUsagePerUser;
        }
      }

      // Final check - ensure required discount field is present
      if (formData.type === 'PERCENTAGE' && (!payload.discountPercentage || payload.discountPercentage <= 0)) {
        console.error('[PromotionManagementPage] ERROR: discountPercentage missing!', payload);
        showError("Lỗi: Phần trăm giảm giá không hợp lệ");
        setIsSubmitting(false);
        return;
      }
      if (formData.type === 'FIXED_AMOUNT' && (!payload.discountAmount || payload.discountAmount <= 0)) {
        console.error('[PromotionManagementPage] ERROR: discountAmount missing!', payload);
        showError("Lỗi: Số tiền giảm giá không hợp lệ");
        setIsSubmitting(false);
        return;
      }

      // Verify payload before sending
      console.log('[PromotionManagementPage] Final payload:', JSON.stringify(payload, null, 2));
      console.log('[PromotionManagementPage] Payload has discountPercentage:', 'discountPercentage' in payload, payload.discountPercentage);
      console.log('[PromotionManagementPage] Payload has discountAmount:', 'discountAmount' in payload, payload.discountAmount);
      
      const response = await promotionService.create(payload);
      console.log('[PromotionManagementPage] Response:', response);

      // Handle response - backend returns CommonResponse structure
      const responseData = response?.responseData ?? response?.data ?? response;
      const responseStatus = response?.responseStatus ?? response?.status;
      const responseCode = responseStatus?.responseCode ?? responseStatus?.code ?? response?.status;

      // Check if successful (200 or responseCode === "200" or SUCCESS)
      if (responseCode === 200 || responseCode === "200" || responseStatus?.responseMessage === "SUCCESS" || responseData) {
        showSuccess("Tạo mã giảm giá thành công!");
        setShowCreateModal(false);
        resetForm();
        loadPromotions();
      } else {
        const errorMsg = responseStatus?.responseMessage || 
          response?.responseMessage ||
          "Không thể tạo mã giảm giá";
        showError(errorMsg);
      }
    } catch (error) {
      console.error("[PromotionManagementPage] Failed to create promotion:", error);
      console.error("[PromotionManagementPage] Error details:", {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        response: error?.response
      });
      
      // Check if error is actually a success response (sometimes httpClient throws even on 200)
      if (error?.data?.responseStatus?.responseCode === "200" || 
          error?.data?.responseStatus?.responseCode === 200 ||
          (error?.data?.responseData && error?.data?.responseStatus?.responseMessage === "SUCCESS")) {
        console.log('[PromotionManagementPage] Response was success but caught as error, handling as success');
        showSuccess("Tạo mã giảm giá thành công!");
        setShowCreateModal(false);
        resetForm();
        loadPromotions();
        return;
      }
      
      const errorMsg = error?.data?.responseStatus?.responseMessage ||
        error?.data?.responseMessage ||
        error?.response?.data?.responseMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo mã giảm giá";
      showError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isUpdating) {
      console.log('[PromotionManagementPage] Already updating, ignoring duplicate request');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Validate required fields
      if (!formData.code?.trim()) {
        showError("Mã giảm giá là bắt buộc");
        e.target.disabled = false;
        return;
      }
      if (!formData.name?.trim()) {
        showError("Tên mã là bắt buộc");
        e.target.disabled = false;
        return;
      }
      if (!formData.startDate) {
        showError("Ngày bắt đầu là bắt buộc");
        e.target.disabled = false;
        return;
      }
      if (!formData.endDate) {
        showError("Ngày kết thúc là bắt buộc");
        e.target.disabled = false;
        return;
      }

      // Validate and parse value
      const valueStr = String(formData.value || '').trim().replace(/,/g, '');
      const val = parseFloat(valueStr);
      
      if (!valueStr || isNaN(val) || val <= 0 || !isFinite(val)) {
        showError("Giá trị giảm giá phải là số dương hợp lệ");
        e.target.disabled = false;
        return;
      }

      // Build payload matching PromotionRequest DTO exactly
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isPublic: formData.isPublic !== undefined ? Boolean(formData.isPublic) : true,
        isSingleUse: false,
        priority: formData.priority ? parseInt(formData.priority, 10) : 0
      };

      // Add type-specific discount fields - MUST be present and > 0
      if (formData.type === 'PERCENTAGE') {
        if (val <= 0 || val > 100) {
          showError("Phần trăm giảm giá phải từ 1 đến 100");
          e.target.disabled = false;
          return;
        }
        payload.discountPercentage = val;
        if (formData.maxDiscountAmount) {
          const maxDisc = parseFloat(String(formData.maxDiscountAmount).replace(/,/g, ''));
          if (!isNaN(maxDisc) && maxDisc > 0) {
            payload.maxDiscountAmount = maxDisc;
          }
        }
      } else if (formData.type === 'FIXED_AMOUNT') {
        if (val <= 0) {
          showError("Số tiền giảm giá phải lớn hơn 0");
          e.target.disabled = false;
          return;
        }
        payload.discountAmount = val;
      } else {
        showError("Loại giảm giá không hợp lệ");
        e.target.disabled = false;
        return;
      }

      // Add optional numeric fields
      if (formData.minOrderValue) {
        const minOrder = parseFloat(String(formData.minOrderValue).replace(/,/g, ''));
        if (!isNaN(minOrder) && minOrder > 0) {
          payload.minOrderValue = minOrder;
        }
      }
      if (formData.maxUsage) {
        const maxUsage = parseInt(formData.maxUsage, 10);
        if (!isNaN(maxUsage) && maxUsage > 0) {
          payload.maxUsageTotal = maxUsage;
        }
      }
      if (formData.maxUsagePerUser) {
        const maxUsagePerUser = parseInt(formData.maxUsagePerUser, 10);
        if (!isNaN(maxUsagePerUser) && maxUsagePerUser > 0) {
          payload.maxUsagePerUser = maxUsagePerUser;
        }
      }

      // Final check
      if (formData.type === 'PERCENTAGE' && (!payload.discountPercentage || payload.discountPercentage <= 0)) {
        console.error('[PromotionManagementPage] ERROR: discountPercentage missing!', payload);
        showError("Lỗi: Phần trăm giảm giá không hợp lệ");
        e.target.disabled = false;
        return;
      }
      if (formData.type === 'FIXED_AMOUNT' && (!payload.discountAmount || payload.discountAmount <= 0)) {
        console.error('[PromotionManagementPage] ERROR: discountAmount missing!', payload);
        showError("Lỗi: Số tiền giảm giá không hợp lệ");
        e.target.disabled = false;
        return;
      }

      console.log('[PromotionManagementPage] Updating promotion:', selectedPromo.id, 'with payload:', JSON.stringify(payload, null, 2));
      const response = await promotionService.update(selectedPromo.id, payload);
      console.log('[PromotionManagementPage] Update response:', response);

      // Handle response
      const responseData = response?.responseData ?? response?.data ?? response;
      const responseStatus = response?.responseStatus ?? response?.status;
      const responseCode = responseStatus?.responseCode ?? responseStatus?.code ?? response?.status;

      if (responseCode === 200 || responseCode === "200" || responseStatus?.responseMessage === "SUCCESS" || responseData) {
        showSuccess("Cập nhật mã giảm giá thành công!");
        setShowEditModal(false);
        setSelectedPromo(null);
        resetForm();
        loadPromotions();
      } else {
        const errorMsg = responseStatus?.responseMessage || 
          response?.responseMessage ||
          "Không thể cập nhật mã giảm giá";
        showError(errorMsg);
      }
    } catch (error) {
      console.error("[PromotionManagementPage] Failed to update promotion:", error);
      
      // Check if error is actually a success response
      if (error?.data?.responseStatus?.responseCode === "200" || 
          error?.data?.responseStatus?.responseCode === 200 ||
          (error?.data?.responseData && error?.data?.responseStatus?.responseMessage === "SUCCESS")) {
        showSuccess("Cập nhật mã giảm giá thành công!");
        setShowEditModal(false);
        setSelectedPromo(null);
        resetForm();
        loadPromotions();
        return;
      }
      
      const errorMsg = error?.data?.responseStatus?.responseMessage ||
        error?.data?.responseMessage ||
        error?.response?.data?.responseMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể cập nhật mã giảm giá";
      showError(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) {
      return;
    }

    try {
      console.log('[PromotionManagementPage] Deleting promotion:', id);
      const response = await promotionService.delete(id);
      console.log('[PromotionManagementPage] Delete promotion response:', response);
      showSuccess("Xóa mã giảm giá thành công!");
      loadPromotions();
    } catch (error) {
      console.error("[PromotionManagementPage] Failed to delete promotion:", error);
      console.error("[PromotionManagementPage] Error details:", error.response?.data || error.message);
      const errorMsg = error?.response?.data?.responseMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xóa mã giảm giá";
      showError(errorMsg);
    }
  };

  const handleActivate = async (id) => {
    try {
      console.log('[PromotionManagementPage] Activating promotion:', id);
      const response = await promotionService.activate(id);
      console.log('[PromotionManagementPage] Activate promotion response:', response);
      showSuccess("Kích hoạt mã giảm giá thành công!");
      loadPromotions();
    } catch (error) {
      console.error("[PromotionManagementPage] Failed to activate promotion:", error);
      console.error("[PromotionManagementPage] Error details:", error.response?.data || error.message);
      const errorMsg = error?.response?.data?.responseMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể kích hoạt mã giảm giá";
      showError(errorMsg);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      console.log('[PromotionManagementPage] Deactivating promotion:', id);
      const response = await promotionService.deactivate(id);
      console.log('[PromotionManagementPage] Deactivate promotion response:', response);
      showSuccess("Vô hiệu hóa mã giảm giá thành công!");
      loadPromotions();
    } catch (error) {
      console.error("[PromotionManagementPage] Failed to deactivate promotion:", error);
      console.error("[PromotionManagementPage] Error details:", error.response?.data || error.message);
      const errorMsg = error?.response?.data?.responseMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể vô hiệu hóa mã giảm giá";
      showError(errorMsg);
    }
  };

  const handleEdit = (promo) => {
    setSelectedPromo(promo);
    // Map discountPercentage/discountAmount to value based on type
    const value = promo.type === 'PERCENTAGE'
      ? (promo.discountPercentage || "")
      : (promo.discountAmount || "");

    setFormData({
      code: promo.code || "",
      name: promo.name || "",
      description: promo.description || "",
      type: promo.type || "PERCENTAGE",
      value: value,
      minOrderValue: promo.minOrderValue || "",
      maxDiscountAmount: promo.maxDiscountAmount || "",
      startDate: promo.startDate ? promo.startDate.split('T')[0] : "",
      endDate: promo.endDate ? promo.endDate.split('T')[0] : "",
      maxUsage: promo.maxUsageTotal || "",
      maxUsagePerUser: promo.maxUsagePerUser || "",
      isPublic: promo.isPublic !== false,
      priority: promo.priority || 0
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "PERCENTAGE",
      value: "",
      minOrderValue: "",
      maxDiscountAmount: "",
      startDate: "",
      endDate: "",
      maxUsage: "",
      maxUsagePerUser: "",
      isPublic: true,
      priority: 0
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    if (!amount) return "—";
    return new Intl.NumberFormat('vi-VN').format(amount) + "₫";
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      ACTIVE: { label: "Đang hoạt động", className: "bg-green-100 text-green-700" },
      INACTIVE: { label: "Tạm dừng", className: "bg-gray-100 text-gray-700" },
      CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" }
    };
    const statusInfo = statusMap[status] || statusMap.INACTIVE;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] py-10 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332] mx-auto mb-4"></div>
          <p className="text-[#6B7280]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#AD7A2A]">
              Quản lý mã giảm giá
            </p>
            <h1 className="text-3xl font-semibold text-[#1F2A37]">
              Mã giảm giá & Khuyến mãi
            </h1>
            <p className="text-sm text-[#6B7280]">
              Tạo và quản lý các mã giảm giá cho khách hàng
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-5 py-3 rounded-full bg-[#EE4D2D] text-white text-sm font-semibold hover:bg-[#D73211]"
          >
            + Tạo mã mới
          </button>
        </header>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Tổng số mã" value={stats.total} />
          <StatCard label="Đang hoạt động" value={stats.active} color="green" />
          <StatCard label="Tạm dừng" value={stats.inactive} color="gray" />
          <StatCard label="Tổng lượt sử dụng" value={stats.totalUsages} color="blue" />
        </section>

        {/* Filters */}
        <section className="bg-white rounded-3xl border border-[#ECE7DD] p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-[#6B7280]">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-full border border-[#E5E7EB] text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã, tên..."
                className="w-full px-4 py-2 rounded-full border border-[#E5E7EB] text-sm"
              />
            </div>
          </div>

          {/* Promotions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#111827] text-white uppercase text-[11px] tracking-[0.2em]">
                <tr>
                  <th className="px-4 py-3 text-left">Mã</th>
                  <th className="px-4 py-3 text-left">Tên</th>
                  <th className="px-4 py-3 text-left">Loại</th>
                  <th className="px-4 py-3 text-left">Giá trị</th>
                  <th className="px-4 py-3 text-left">Điều kiện</th>
                  <th className="px-4 py-3 text-left">HSD</th>
                  <th className="px-4 py-3 text-left">Sử dụng</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => (
                  <tr key={promo.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#EE4D2D]">{promo.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{promo.name}</div>
                        {promo.description && (
                          <div className="text-xs text-[#6B7280] mt-1">{promo.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {promo.type === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền cố định'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {promo.type === 'PERCENTAGE'
                        ? `${promo.discountPercentage}%`
                        : formatCurrency(promo.discountAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">
                      {promo.minOrderValue ? `Từ ${formatCurrency(promo.minOrderValue)}` : "Không"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">
                      {formatDate(promo.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{promo.totalUsageCount || 0} lượt</div>
                        {promo.maxUsageTotal && (
                          <div className="text-xs text-[#9CA3AF]">/ {promo.maxUsageTotal} tối đa</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(promo.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(promo)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Sửa
                        </button>
                        {promo.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleDeactivate(promo.id)}
                            className="text-xs text-orange-600 hover:text-orange-700"
                          >
                            Tạm dừng
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(promo.id)}
                            className="text-xs text-green-600 hover:text-green-700"
                          >
                            Kích hoạt
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {promotions.length === 0 && (
              <div className="text-center py-12 text-[#6B7280]">
                Không có mã giảm giá nào
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <PromoFormModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          onSubmit={handleCreate}
          title="Tạo mã giảm giá mới"
          isSubmitting={isSubmitting}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <PromoFormModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPromo(null);
            resetForm();
          }}
          onSubmit={handleUpdate}
          title="Chỉnh sửa mã giảm giá"
          isSubmitting={isUpdating}
        />
      )}
    </div>
  );
};

function StatCard({ label, value, color = "slate" }) {
  const colorMap = {
    slate: "from-slate-900 to-slate-800",
    green: "from-emerald-500 to-emerald-600",
    gray: "from-gray-500 to-gray-600",
    blue: "from-blue-500 to-blue-600"
  };
  return (
    <div className="rounded-2xl border border-[#ECE7DD] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-[#9CA3AF]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#111827]">{value}</p>
      <div className={`mt-4 h-2 rounded-full bg-gradient-to-r ${colorMap[color]}`}></div>
    </div>
  );
}

function PromoFormModal({ formData, setFormData, onClose, onSubmit, title, isSubmitting = false }) {
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form
        onSubmit={onSubmit}
        className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl border border-[#ECE7DD] p-8 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-[#1F2A37]">{title}</h3>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">
              Mã giảm giá <span className="text-red-500">*</span>
            </label>
            <input
              required
              placeholder="Ví dụ: SALE2024"
              value={formData.code}
              onChange={(e) => updateField("code", e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">
              Tên mã <span className="text-red-500">*</span>
            </label>
            <input
              required
              placeholder="Tên mã giảm giá"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#6B7280] mb-1">Mô tả</label>
          <textarea
            placeholder="Mô tả về mã giảm giá"
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">
              Loại giảm giá <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            >
              <option value="PERCENTAGE">Phần trăm (%)</option>
              <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">
              Giá trị <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="number"
              min="0"
              step={formData.type === 'PERCENTAGE' ? '1' : '1000'}
              placeholder={formData.type === 'PERCENTAGE' ? 'Ví dụ: 10' : 'Ví dụ: 50000'}
              value={formData.value || ""}
              onChange={(e) => updateField("value", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">
              Đơn hàng tối thiểu (₫)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="Không bắt buộc"
              value={formData.minOrderValue || ""}
              onChange={(e) => updateField("minOrderValue", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
          </div>
          {formData.type === 'PERCENTAGE' && (
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">
                Giảm tối đa (₫)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="Không giới hạn"
                value={formData.maxDiscountAmount || ""}
                onChange={(e) => updateField("maxDiscountAmount", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Ngày bắt đầu</label>
            <input
              type="date"
              value={formData.startDate || ""}
              onChange={(e) => updateField("startDate", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Ngày kết thúc</label>
            <input
              type="date"
              value={formData.endDate || ""}
              onChange={(e) => updateField("endDate", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Số lần sử dụng tối đa</label>
            <input
              type="number"
              min="0"
              placeholder="Không giới hạn"
              value={formData.maxUsage || ""}
              onChange={(e) => updateField("maxUsage", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Số lần/người dùng</label>
            <input
              type="number"
              min="0"
              placeholder="Không giới hạn"
              value={formData.maxUsagePerUser || ""}
              onChange={(e) => updateField("maxUsagePerUser", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Độ ưu tiên</label>
            <input
              type="number"
              min="0"
              value={formData.priority ?? 0}
              onChange={(e) => updateField("priority", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
          </div>
          <div className="flex items-center gap-2 pt-8">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => updateField("isPublic", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="isPublic" className="text-sm text-[#6B7280]">
              Hiển thị công khai
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-full bg-[#EE4D2D] text-white font-semibold hover:bg-[#D73211] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-full bg-[#F3F4F6] text-[#111827] font-semibold hover:bg-[#E5E7EB]"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export default PromotionManagementPage;


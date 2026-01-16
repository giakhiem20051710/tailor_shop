import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";
import TutorialOverlay from "../components/TutorialOverlay.jsx";
import { orderService, invoiceService } from "../services";
import { isAuthenticated, getCurrentUserRole, getCurrentUser, ROLES } from "../utils/authStorage";
import { saveCustomerMeasurements } from "../utils/customerMeasurementsStorage";
import {
  getReferralByCode,
  recordReferralOnOrderCreated,
} from "../utils/referralStorage.js";
import { addAppointment } from "../utils/appointmentStorage.js";
import usePageMeta from "../hooks/usePageMeta";

// ============================================
// TUTORIAL STEPS - Game-like onboarding
// ============================================
const TUTORIAL_STEPS = [
  {
    target: "#progress-bar",
    title: "Thanh tiến trình",
    content: "Theo dõi tiến độ điền form tại đây. Bạn có thể click vào các bước đã hoàn thành để quay lại chỉnh sửa.",
    position: "bottom",
    tip: "Click vào số bước để di chuyển nhanh!"
  },
  {
    target: "#name-input",
    title: "Họ và tên",
    content: "Điền họ tên đầy đủ của bạn. Đây là thông tin bắt buộc để chúng tôi liên hệ.",
    position: "bottom",
  },
  {
    target: "#phone-input",
    title: "Số điện thoại",
    content: "Số điện thoại để thợ may liên hệ tư vấn và xác nhận đơn hàng.",
    position: "bottom",
    tip: "Nên dùng số Zalo để tiện trao đổi hình ảnh."
  },
  {
    target: "#referral-input",
    title: "Mã giới thiệu",
    content: "Nếu bạn được bạn bè giới thiệu, hãy nhập mã ở đây để nhận ưu đãi 10% cho đơn đầu tiên!",
    position: "top",
  },
  {
    target: "#next-btn",
    title: "Tiếp tục",
    content: "Sau khi điền xong, nhấn nút này để chuyển sang bước tiếp theo.",
    position: "top",
  },
  {
    target: "#order-preview",
    title: "Xem trước đơn hàng",
    content: "Thông tin bạn điền sẽ hiển thị ở đây theo thời gian thực. Bạn có thể kiểm tra lại trước khi gửi.",
    position: "left",
  },
];

const WELCOME_VOUCHER_CODE = "FRIEND-10";

// ============================================
// PRODUCT TYPES - Pre-defined options
// ============================================
const PRODUCT_TYPES = [
  { id: "ao_dai", name: "Áo dài", desc: "Cưới, lễ hội, tốt nghiệp", priceRange: "2.5 - 5 triệu" },
  { id: "vest", name: "Vest nam", desc: "Công sở, sự kiện, cưới", priceRange: "3 - 8 triệu" },
  { id: "dam", name: "Đầm/Váy", desc: "Dạ hội, tiệc, thường ngày", priceRange: "1.5 - 4 triệu" },
  { id: "so_mi", name: "Sơ mi", desc: "Công sở, casual", priceRange: "500k - 1.5 triệu" },
  { id: "quan", name: "Quần", desc: "Âu, kaki, tây", priceRange: "500k - 1.5 triệu" },
  { id: "khac", name: "Khác", desc: "Tự mô tả bên dưới", priceRange: "Liên hệ" },
];

// ============================================
// STEP CONFIGURATION
// ============================================
const STEPS = [
  { id: 1, label: "Thông tin", desc: "Liên hệ & mã giới thiệu" },
  { id: 2, label: "Sản phẩm", desc: "Loại đồ & mô tả" },
  { id: 3, label: "Số đo", desc: "Kích thước cơ thể" },
  { id: 4, label: "Xác nhận", desc: "Kiểm tra & gửi" },
];

const CustomerOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const productFromDetail = location.state?.product;
  const promoCodeFromPromotions = location.state?.promoCode;
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    productName: productFromDetail?.name || "",
    productType: productFromDetail?.tag || "",
    selectedProductType: null,
    description: productFromDetail?.desc || productFromDetail?.description || "",
    budget: "",
    dueDate: "",
    notes: "",
    promoCode: promoCodeFromPromotions || "",
    measurements: {
      height: "", weight: "", neck: "", chest: "", waist: "", hips: "",
      bicep: "", shoulder: "", sleeve: "", pantsLength: "", shirtLength: "",
      thigh: "", crotch: "", ankle: "",
    },
    appointmentType: "pickup",
    appointmentTime: "",
    referralCode: "",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [referralVoucher, setReferralVoucher] = useState("");
  const [hintModal, setHintModal] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceCode, setInvoiceCode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Image state - can be from product detail or uploaded
  const [productImage, setProductImage] = useState(
    productFromDetail?.image || productFromDetail?.imageUrl || productFromDetail?.thumbnail || null
  );
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // ============================================
  // NEW FEATURES STATES
  // ============================================

  // Quick Order Mode
  const [isQuickOrder, setIsQuickOrder] = useState(false);

  // Save Draft
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const DRAFT_KEY = 'tailor_order_draft';

  // Price Estimator
  const [estimatedPrice, setEstimatedPrice] = useState({ min: 0, max: 0 });

  // Style Gallery
  const [showStyleGallery, setShowStyleGallery] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState([]);

  // Measurement Guide
  const [showMeasurementGuide, setShowMeasurementGuide] = useState(false);
  const [activeMeasurement, setActiveMeasurement] = useState(null);

  usePageMeta({
    title: "Đặt may theo số đo | My Hiền Tailor",
    description: "Form đặt may áo dài, vest, đầm theo số đo cá nhân tại My Hiền Tailor TP.HCM.",
  });

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(isAuthenticated());
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || currentUser.name || currentUser.fullName || "",
      phone: prev.phone || currentUser.phone || "",
      email: prev.email || currentUser.email || "",
      address: prev.address || currentUser.address || "",
    }));
  }, [isLoggedIn]);

  // ============================================
  // VALIDATION
  // ============================================
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Vui lòng nhập họ tên";
      if (!formData.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
      else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, "")))
        newErrors.phone = "Số điện thoại không hợp lệ";
      if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Email không hợp lệ";
    }
    if (step === 2) {
      if (!formData.selectedProductType && !formData.productName.trim())
        newErrors.productName = "Vui lòng chọn hoặc nhập loại sản phẩm";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // SAVE DRAFT - Auto save & restore
  // ============================================

  // Check for saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft && !productFromDetail) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.formData && draft.timestamp) {
          const hoursSinceLastSave = (Date.now() - draft.timestamp) / (1000 * 60 * 60);
          // Only show prompt if draft is less than 24 hours old
          if (hoursSinceLastSave < 24) {
            setHasSavedDraft(true);
            setShowDraftPrompt(true);
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        }
      } catch (e) {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, [productFromDetail]);

  // Auto-save on form changes
  useEffect(() => {
    if (!showSuccess && formData.name || formData.phone || formData.selectedProductType) {
      const draftData = {
        formData,
        currentStep,
        uploadedImages,
        selectedStyles,
        isQuickOrder,
        timestamp: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
    }
  }, [formData, currentStep, uploadedImages, selectedStyles, isQuickOrder, showSuccess]);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.formData) setFormData(draft.formData);
        if (draft.currentStep) setCurrentStep(draft.currentStep);
        if (draft.uploadedImages) setUploadedImages(draft.uploadedImages);
        if (draft.selectedStyles) setSelectedStyles(draft.selectedStyles);
        if (draft.isQuickOrder !== undefined) setIsQuickOrder(draft.isQuickOrder);
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    }
    setShowDraftPrompt(false);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasSavedDraft(false);
    setShowDraftPrompt(false);
  };

  // ============================================
  // PRICE ESTIMATOR
  // ============================================
  const PRICE_DATA = {
    ao_dai: { min: 2500000, max: 5000000, label: "Áo dài" },
    vest: { min: 3000000, max: 8000000, label: "Vest nam" },
    dam: { min: 1500000, max: 4000000, label: "Đầm/Váy" },
    so_mi: { min: 500000, max: 1500000, label: "Sơ mi" },
    quan: { min: 500000, max: 1500000, label: "Quần" },
    khac: { min: 500000, max: 3000000, label: "Khác" },
  };

  useEffect(() => {
    if (formData.selectedProductType && PRICE_DATA[formData.selectedProductType]) {
      const priceInfo = PRICE_DATA[formData.selectedProductType];
      setEstimatedPrice({ min: priceInfo.min, max: priceInfo.max });
    } else {
      setEstimatedPrice({ min: 0, max: 0 });
    }
  }, [formData.selectedProductType]);

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + ' triệu';
    }
    return (price / 1000).toFixed(0) + 'k';
  };

  // ============================================
  // STYLE GALLERY DATA
  // ============================================
  const STYLE_GALLERY = {
    ao_dai: [
      { id: 1, name: "Áo dài cưới trắng", image: "/images/styles/ao-dai-1.jpg", tags: ["cưới", "trắng"] },
      { id: 2, name: "Áo dài đỏ truyền thống", image: "/images/styles/ao-dai-2.jpg", tags: ["truyền thống", "đỏ"] },
      { id: 3, name: "Áo dài cách tân", image: "/images/styles/ao-dai-3.jpg", tags: ["hiện đại", "cách tân"] },
    ],
    vest: [
      { id: 4, name: "Vest công sở đen", image: "/images/styles/vest-1.jpg", tags: ["công sở", "đen"] },
      { id: 5, name: "Vest cưới xám", image: "/images/styles/vest-2.jpg", tags: ["cưới", "xám"] },
      { id: 6, name: "Vest casual xanh navy", image: "/images/styles/vest-3.jpg", tags: ["casual", "xanh"] },
    ],
    dam: [
      { id: 7, name: "Đầm dạ hội đen", image: "/images/styles/dam-1.jpg", tags: ["dạ hội", "đen"] },
      { id: 8, name: "Đầm cocktail đỏ", image: "/images/styles/dam-2.jpg", tags: ["tiệc", "đỏ"] },
      { id: 9, name: "Váy maxi hoa", image: "/images/styles/dam-3.jpg", tags: ["thường ngày", "hoa"] },
    ],
  };

  const toggleStyleSelection = (style) => {
    setSelectedStyles(prev => {
      const exists = prev.find(s => s.id === style.id);
      if (exists) {
        return prev.filter(s => s.id !== style.id);
      }
      return [...prev, style].slice(0, 5); // Max 5 styles
    });
  };

  // ============================================
  // MEASUREMENT GUIDE DATA
  // ============================================
  const MEASUREMENT_GUIDES = {
    height: { name: "Chiều cao", video: "https://www.youtube.com/embed/example1", tip: "Đứng thẳng, không mang giày" },
    chest: { name: "Vòng ngực", video: "https://www.youtube.com/embed/example2", tip: "Đo vòng qua điểm cao nhất của ngực" },
    waist: { name: "Vòng eo", video: "https://www.youtube.com/embed/example3", tip: "Đo vòng nhỏ nhất của eo" },
    hips: { name: "Vòng mông", video: "https://www.youtube.com/embed/example4", tip: "Đo vòng lớn nhất của mông" },
    shoulder: { name: "Vai", video: "https://www.youtube.com/embed/example5", tip: "Đo từ đường vai này sang đường vai kia" },
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("measurements.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        measurements: { ...prev.measurements, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleProductTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      selectedProductType: type.id,
      productType: type.name,
      productName: prev.productName || type.name,
    }));
    setErrors(prev => ({ ...prev, productName: undefined }));
  };

  // ============================================
  // IMAGE UPLOAD HANDLERS
  // ============================================
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      const isSmallEnough = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValid && isSmallEnough;
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages(prev => {
          // Limit to 5 images
          const newImages = [...prev, e.target.result];
          return newImages.slice(0, 5);
        });
        // Set first image as product image if none exists
        if (!productImage) {
          setProductImage(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setUploadedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Update product image if removed
      if (prev[index] === productImage) {
        setProductImage(newImages[0] || productFromDetail?.image || null);
      }
      return newImages;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const selectMainImage = (imageUrl) => {
    setProductImage(imageUrl);
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleStepClick = (step) => {
    // Allow jumping to previously completed steps
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step === currentStep + 1 && validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  const toNumber = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(String(value).replace(/,/g, ""));
    return Number.isNaN(num) ? null : num;
  };

  // ============================================
  // MEASUREMENT HINTS
  // ============================================
  const measurementHints = {
    height: "Đứng thẳng, không đi giày, đo từ gót đến đỉnh đầu.",
    weight: "Cân trên cân điện tử, không mang nhiều đồ.",
    chest: "Quấn thước qua điểm nở nhất của ngực.",
    waist: "Đo ngang rốn (eo thật).",
    hips: "Đo qua điểm nở nhất của mông.",
    shoulder: "Đo ngang lưng từ mỏm vai trái sang phải.",
    sleeve: "Đo từ đỉnh vai xuống cổ tay.",
    neck: "Quấn thước quanh gốc cổ, chừa 1 ngón tay.",
  };

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < 4) {
      handleNext();
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = getCurrentUser();
      const parsedBudget = toNumber(formData.budget) || 0;

      const measurement = {
        chest: toNumber(formData.measurements.chest),
        waist: toNumber(formData.measurements.waist),
        hip: toNumber(formData.measurements.hips),
        shoulder: toNumber(formData.measurements.shoulder),
        sleeve: toNumber(formData.measurements.sleeve),
        bicep: toNumber(formData.measurements.bicep),
        height: toNumber(formData.measurements.height),
        weight: toNumber(formData.measurements.weight),
        neck: toNumber(formData.measurements.neck),
        thigh: toNumber(formData.measurements.thigh),
        crotch: toNumber(formData.measurements.crotch),
        ankle: toNumber(formData.measurements.ankle),
        shirtLength: toNumber(formData.measurements.shirtLength),
        pantsLength: toNumber(formData.measurements.pantsLength),
        note: formData.description || formData.notes || "",
      };

      const wizardOrder = {
        customerId: currentUser?.id || currentUser?.userId,
        contact: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        },
        product: {
          productName: formData.productName || formData.productType,
          productType: formData.productType,
          description: formData.description,
          budget: parsedBudget,
          dueDate: formData.dueDate || null,
          notes: formData.notes,
          appointmentType: formData.appointmentType,
          appointmentTime: formData.appointmentTime,
          promoCode: formData.promoCode,
        },
        measurement,
      };

      const response = await orderService.createWizard(wizardOrder);
      const responseData = response?.data ?? response?.responseData ?? response;
      const isSuccess = response?.success === true ||
        response?.responseStatus?.responseCode === "200" || !!responseData?.id;

      if (isSuccess) {
        // Handle referral
        const referralInput = formData.referralCode?.trim();
        if (referralInput) {
          const referralMeta = getReferralByCode(referralInput);
          if (referralMeta) {
            recordReferralOnOrderCreated({
              code: referralMeta.profile.code,
              orderId: responseData.id || responseData.orderId,
              referredName: formData.name,
            });
            setReferralVoucher(WELCOME_VOUCHER_CODE);
          }
        }

        // Save measurements
        if (currentUser && formData.measurements) {
          const customerId = currentUser.id || currentUser.userId || currentUser.phone;
          saveCustomerMeasurements(customerId, {
            ...formData.measurements,
            orderId: responseData.id,
          });
        }

        // Create appointment
        const appointmentDate = responseData?.appointmentDate || formData.dueDate;
        if (appointmentDate && currentUser) {
          addAppointment({
            customerId: currentUser.id || currentUser.userId,
            orderId: responseData.id,
            type: formData.appointmentType || "measure",
            status: "pending",
            appointmentDate,
          });
        }

        // Handle invoice
        if (responseData?.invoiceId) {
          setInvoiceId(responseData.invoiceId);
          setInvoiceCode(responseData.invoiceCode || `INV-${responseData.invoiceId}`);
        }

        setShowSuccess(true);
        setTimeout(() => {
          navigate("/customer/dashboard", { state: { orderCreated: true } });
        }, 3000);
      } else {
        alert("Đặt đơn không thành công. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // NOT LOGGED IN
  // ============================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <Header />
        <div className="pt-[180px] pb-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Vui lòng đăng nhập
              </h1>
              <p className="text-gray-600 mb-8">
                Để đặt may, bạn cần đăng nhập vào tài khoản
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/login/customer")}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="w-full py-3.5 px-6 border-2 border-amber-500 text-amber-600 font-semibold rounded-xl hover:bg-amber-50 transition-all"
                >
                  Đăng ký tài khoản mới
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // CALCULATE PROGRESS
  // ============================================
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  // ============================================
  // RENDER MAIN FORM
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <Header />

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Đặt may thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              Cảm ơn bạn đã tin tưởng. Chúng tôi sẽ liên hệ trong 24h.
            </p>
            {invoiceCode && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-emerald-700 text-sm">
                  Mã hóa đơn: <span className="font-bold">{invoiceCode}</span>
                </p>
              </div>
            )}
            {referralVoucher && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-amber-700 text-sm">
                  Mã ưu đãi: <span className="font-bold">{referralVoucher}</span> (-10%)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint Modal */}
      {hintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{hintModal.title}</h3>
              <button onClick={() => setHintModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-gray-600">{hintModal.content}</p>
            <button
              onClick={() => setHintModal(null)}
              className="mt-4 w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Draft Restore Prompt */}
      {showDraftPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Bạn có đơn hàng chưa hoàn tất
            </h3>
            <p className="text-gray-600 text-center text-sm mb-6">
              Chúng tôi đã lưu thông tin đơn hàng trước đó của bạn. Bạn muốn tiếp tục hay bắt đầu mới?
            </p>
            <div className="flex gap-3">
              <button
                onClick={clearDraft}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Bắt đầu mới
              </button>
              <button
                onClick={restoreDraft}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Guide Modal */}
      {showMeasurementGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Hướng dẫn lấy số đo</h3>
              <button onClick={() => setShowMeasurementGuide(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6">
              {/* Video placeholder */}
              <div className="bg-gray-100 rounded-xl aspect-video flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Video hướng dẫn đo cơ thể</p>
                  <p className="text-sm text-gray-400">Thời lượng: 60 giây</p>
                </div>
              </div>

              {/* Measurement tips */}
              <h4 className="font-semibold text-gray-900 mb-4">Các bước đo cơ bản</h4>
              <div className="grid gap-4">
                {Object.entries(MEASUREMENT_GUIDES).map(([key, guide]) => (
                  <div key={key} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-700 font-bold">{key.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{guide.name}</h5>
                      <p className="text-sm text-gray-600">{guide.tip}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800 mb-3">
                  <strong>Không muốn tự đo?</strong> Đặt lịch đến tiệm để được thợ may chuyên nghiệp đo miễn phí!
                </p>
                <button
                  onClick={() => {
                    setShowMeasurementGuide(false);
                    setFormData(prev => ({ ...prev, appointmentType: 'measure_at_shop' }));
                  }}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Đặt lịch đo tại tiệm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style Gallery Modal */}
      {showStyleGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chọn mẫu tham khảo</h3>
                <p className="text-sm text-gray-500">Chọn tối đa 5 mẫu để gửi cho thợ may</p>
              </div>
              <button onClick={() => setShowStyleGallery(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6">
              {/* Filter tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {Object.keys(STYLE_GALLERY).map(category => (
                  <button
                    key={category}
                    onClick={() => setFormData(prev => ({ ...prev, selectedProductType: category }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.selectedProductType === category
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {PRICE_DATA[category]?.label || category}
                  </button>
                ))}
              </div>

              {/* Gallery grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(STYLE_GALLERY[formData.selectedProductType] || []).map(style => {
                  const isSelected = selectedStyles.find(s => s.id === style.id);
                  return (
                    <div
                      key={style.id}
                      onClick={() => toggleStyleSelection(style)}
                      className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200 hover:border-amber-300'
                        }`}
                    >
                      <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">{style.name}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                      <div className="p-3">
                        <h5 className="font-medium text-gray-900 text-sm">{style.name}</h5>
                        <div className="flex gap-1 mt-1">
                          {style.tags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* External URL input */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hoặc dán link hình ảnh từ Pinterest/Instagram
                </label>
                <input
                  type="url"
                  placeholder="https://pinterest.com/pin/..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Selected styles count */}
              {selectedStyles.length > 0 && (
                <div className="mt-4 flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800">
                    Đã chọn <strong>{selectedStyles.length}</strong> mẫu
                  </p>
                  <button
                    onClick={() => setShowStyleGallery(false)}
                    className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="pt-[160px] md:pt-[180px] pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Đặt may theo số đo
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Điền thông tin bên dưới, chúng tôi sẽ liên hệ tư vấn và chốt lịch đo.
            </p>
          </div>

          {/* Quick Order Toggle & Auto-save indicator */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Quick Order Toggle */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm border border-white/50">
              <span className={`text-sm font-medium ${!isQuickOrder ? 'text-amber-600' : 'text-gray-400'}`}>
                Đầy đủ
              </span>
              <button
                type="button"
                onClick={() => setIsQuickOrder(!isQuickOrder)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isQuickOrder ? 'bg-green-500' : 'bg-gray-300'
                  }`}
              >
                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow ${isQuickOrder ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
              </button>
              <span className={`text-sm font-medium ${isQuickOrder ? 'text-green-600' : 'text-gray-400'}`}>
                Nhanh
              </span>
              {isQuickOrder && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-1">
                  Chỉ 30s
                </span>
              )}
            </div>

            {/* Auto-save indicator */}
            {lastSaved && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Đã lưu tự động
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8" id="progress-bar">
            <div className="flex justify-between items-center relative">
              {/* Progress line background */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 mx-12" />
              {/* Progress line filled */}
              <div
                className="absolute top-6 left-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-12 transition-all duration-500"
                style={{ width: `calc(${progressPercent}% - 6rem)` }}
              />

              {STEPS.map((step) => (
                <div
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  className={`relative z-10 flex flex-col items-center cursor-pointer group transition-all ${step.id <= currentStep ? "opacity-100" : "opacity-50"
                    }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold transition-all shadow-lg ${step.id === currentStep
                      ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white scale-110"
                      : step.id < currentStep
                        ? "bg-green-500 text-white"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                      }`}
                  >
                    {step.id < currentStep ? "✓" : step.id}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${step.id === currentStep ? "text-amber-600" : "text-gray-500"
                    }`}>
                    {step.label}
                  </span>
                  <span className="text-xs text-gray-400 hidden md:block">
                    {step.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-3">
              <form ref={formRef} onSubmit={handleSubmit}>
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 md:p-8">

                  {/* Step 1: Contact Info */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in-up">
                      <h2 className="text-xl font-bold text-gray-900">
                        Thông tin liên hệ
                      </h2>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="relative" id="name-input">
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur("name")}
                            className={`peer w-full px-4 pt-6 pb-2 border-2 rounded-xl focus:outline-none focus:border-amber-500 transition-colors ${errors.name && touched.name ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
                              }`}
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs transition-all">
                            Họ và tên <span className="text-red-500">*</span>
                          </label>
                          {errors.name && touched.name && (
                            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="relative" id="phone-input">
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur("phone")}
                            className={`peer w-full px-4 pt-6 pb-2 border-2 rounded-xl focus:outline-none focus:border-amber-500 transition-colors ${errors.phone && touched.phone ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
                              }`}
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs transition-all">
                            Số điện thoại <span className="text-red-500">*</span>
                          </label>
                          {errors.phone && touched.phone && (
                            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur("email")}
                            className={`peer w-full px-4 pt-6 pb-2 border-2 rounded-xl focus:outline-none focus:border-amber-500 transition-colors ${errors.email && touched.email ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
                              }`}
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs transition-all">
                            Email <span className="text-red-500">*</span>
                          </label>
                          {errors.email && touched.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                          )}
                        </div>

                        {/* Address */}
                        <div className="relative">
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs transition-all">
                            Địa chỉ
                          </label>
                        </div>
                      </div>

                      {/* Referral Code */}
                      <div className="relative" id="referral-input">
                        <input
                          type="text"
                          name="referralCode"
                          value={formData.referralCode}
                          onChange={(e) => {
                            setReferralError("");
                            handleInputChange({
                              target: { name: "referralCode", value: e.target.value.toUpperCase() }
                            });
                          }}
                          className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors bg-white"
                          placeholder=" "
                        />
                        <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs transition-all">
                          Mã giới thiệu (nếu có)
                        </label>
                        <p className="text-xs text-gray-400 mt-1">
                          Nhập mã bạn bè để nhận ưu đãi 10% đơn đầu tiên
                        </p>
                        {referralError && (
                          <p className="text-red-500 text-xs mt-1">{referralError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Product Selection */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in-up">
                      <h2 className="text-xl font-bold text-gray-900">
                        Bạn muốn may gì?
                      </h2>

                      {/* Product Type Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {PRODUCT_TYPES.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => handleProductTypeSelect(type)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${formData.selectedProductType === type.id
                              ? "border-amber-500 bg-amber-50 shadow-lg"
                              : "border-gray-200 bg-white hover:border-amber-300"
                              }`}
                          >
                            <div className="font-semibold text-gray-900 mb-1">{type.name}</div>
                            <div className="text-xs text-gray-500">{type.desc}</div>
                            <div className="text-xs text-amber-600 font-medium mt-2">{type.priceRange}</div>
                          </button>
                        ))}
                      </div>

                      {/* Custom Product Name */}
                      <div className="relative">
                        <input
                          type="text"
                          name="productName"
                          value={formData.productName}
                          onChange={handleInputChange}
                          className={`peer w-full px-4 pt-6 pb-2 border-2 rounded-xl focus:outline-none focus:border-amber-500 transition-colors ${errors.productName ? "border-red-400" : "border-gray-200"
                            } bg-white`}
                          placeholder=" "
                        />
                        <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs transition-all">
                          Tên sản phẩm cụ thể
                        </label>
                        {errors.productName && (
                          <p className="text-red-500 text-xs mt-1">{errors.productName}</p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mô tả chi tiết
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors bg-white"
                          placeholder="Mô tả màu sắc, kiểu dáng, chất liệu mong muốn..."
                        />
                      </div>

                      {/* Style Gallery Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowStyleGallery(true)}
                          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all group"
                        >
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">Chọn mẫu tham khảo</p>
                              <p className="text-xs text-gray-500">
                                {selectedStyles.length > 0
                                  ? `Đã chọn ${selectedStyles.length} mẫu`
                                  : 'Duyệt gallery các kiểu dáng phổ biến'}
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Image Upload Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ảnh tham khảo
                        </label>

                        {/* Product image from detail page */}
                        {productFromDetail?.image && !uploadedImages.length && (
                          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-xs text-amber-700 mb-2">Ảnh từ sản phẩm đã chọn:</p>
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                              <img
                                src={productFromDetail.image}
                                alt="Product"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* Uploaded images preview */}
                        {uploadedImages.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                              {uploadedImages.map((img, idx) => (
                                <div
                                  key={idx}
                                  className={`relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${productImage === img ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200 hover:border-amber-300'
                                    }`}
                                  onClick={() => selectMainImage(img)}
                                >
                                  <img
                                    src={img}
                                    alt={`Upload ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {productImage === img && (
                                    <div className="absolute top-1 left-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white">✓</span>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveImage(idx);
                                    }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Click vào ảnh để chọn làm ảnh chính. Tối đa 5 ảnh.
                            </p>
                          </div>
                        )}

                        {/* Upload dropzone */}
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragging
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50'
                            }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {isDragging ? 'Thả ảnh vào đây' : 'Kéo thả hoặc click để tải ảnh'}
                            </p>
                            <p className="text-xs text-gray-400">
                              PNG, JPG, WEBP (tối đa 10MB mỗi ảnh)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Budget & Due Date */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="relative">
                          <input
                            type="text"
                            name="budget"
                            value={formData.budget}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs transition-all">
                            Ngân sách dự kiến (VNĐ)
                          </label>
                        </div>
                        <div className="relative">
                          <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors bg-white"
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500">
                            Ngày cần nhận
                          </label>
                        </div>
                      </div>

                      {/* Promo Code */}
                      {promoCodeFromPromotions && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                          <p className="text-green-700 text-sm font-medium">
                            Mã giảm giá đã áp dụng: <span className="font-bold">{promoCodeFromPromotions}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Measurements */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-fade-in-up">
                      <h2 className="text-xl font-bold text-gray-900">
                        Số đo cơ thể
                      </h2>

                      {/* Measurement Guide Button */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setShowMeasurementGuide(true)}
                          className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition-all"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-blue-800">Xem hướng dẫn đo</p>
                            <p className="text-xs text-blue-600">Video 60s + hình minh họa</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, appointmentType: 'measure_at_shop' }))}
                          className={`flex-1 flex items-center gap-3 p-4 border rounded-xl transition-all ${formData.appointmentType === 'measure_at_shop'
                              ? 'bg-green-50 border-green-300'
                              : 'bg-gray-50 border-gray-200 hover:border-green-300'
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.appointmentType === 'measure_at_shop' ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                            <svg className={`w-5 h-5 ${formData.appointmentType === 'measure_at_shop' ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <p className={`font-medium ${formData.appointmentType === 'measure_at_shop' ? 'text-green-800' : 'text-gray-700'}`}>
                              Đo tại tiệm
                            </p>
                            <p className="text-xs text-gray-500">Đặt lịch miễn phí</p>
                          </div>
                        </button>
                      </div>

                      <p className="text-gray-600 text-sm">
                        Nếu chưa có số đo, chúng tôi sẽ đo khi bạn đến tiệm. Click vào
                        <span className="text-amber-600 font-medium"> ? </span>
                        để xem hướng dẫn.
                      </p>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Height & Weight */}
                        <div className="relative">
                          <input
                            type="number"
                            name="measurements.height"
                            value={formData.measurements.height}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 flex items-center gap-1">
                            Chiều cao (cm)
                            <span
                              className="text-amber-500 cursor-help"
                              onClick={() => setHintModal({ title: "Chiều cao", content: measurementHints.height })}
                            >?</span>
                          </label>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            name="measurements.weight"
                            value={formData.measurements.weight}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 flex items-center gap-1">
                            Cân nặng (kg)
                            <span
                              className="text-amber-500 cursor-help"
                              onClick={() => setHintModal({ title: "Cân nặng", content: measurementHints.weight })}
                            >?</span>
                          </label>
                        </div>

                        {/* Chest & Waist */}
                        <div className="relative">
                          <input
                            type="number"
                            name="measurements.chest"
                            value={formData.measurements.chest}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 flex items-center gap-1">
                            Vòng ngực (cm)
                            <span
                              className="text-amber-500 cursor-help"
                              onClick={() => setHintModal({ title: "Vòng ngực", content: measurementHints.chest })}
                            >?</span>
                          </label>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            name="measurements.waist"
                            value={formData.measurements.waist}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 flex items-center gap-1">
                            Vòng eo (cm)
                            <span
                              className="text-amber-500 cursor-help"
                              onClick={() => setHintModal({ title: "Vòng eo", content: measurementHints.waist })}
                            >?</span>
                          </label>
                        </div>

                        {/* Hips & Shoulder */}
                        <div className="relative">
                          <input
                            type="number"
                            name="measurements.hips"
                            value={formData.measurements.hips}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 flex items-center gap-1">
                            Vòng mông (cm)
                            <span
                              className="text-amber-500 cursor-help"
                              onClick={() => setHintModal({ title: "Vòng mông", content: measurementHints.hips })}
                            >?</span>
                          </label>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            name="measurements.shoulder"
                            value={formData.measurements.shoulder}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 flex items-center gap-1">
                            Vai (cm)
                            <span
                              className="text-amber-500 cursor-help"
                              onClick={() => setHintModal({ title: "Vai", content: measurementHints.shoulder })}
                            >?</span>
                          </label>
                        </div>

                        {/* Sleeve & Neck */}
                        <div className="relative">
                          <input
                            type="number"
                            name="measurements.sleeve"
                            value={formData.measurements.sleeve}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 flex items-center gap-1">
                            Dài tay (cm)
                            <span
                              className="text-amber-500 cursor-help"
                              onClick={() => setHintModal({ title: "Dài tay", content: measurementHints.sleeve })}
                            >?</span>
                          </label>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            name="measurements.neck"
                            value={formData.measurements.neck}
                            onChange={handleInputChange}
                            className="peer w-full px-4 pt-6 pb-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            placeholder=" "
                          />
                          <label className="absolute left-4 top-2 text-xs text-gray-500 flex items-center gap-1">
                            Vòng cổ (cm)
                            <span
                              className="text-amber-500 cursor-help"
                              onClick={() => setHintModal({ title: "Vòng cổ", content: measurementHints.neck })}
                            >?</span>
                          </label>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ghi chú thêm về số đo
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                          placeholder="VD: Tay trái ngắn hơn tay phải 1cm..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 4: Review */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-fade-in-up">
                      <h2 className="text-xl font-bold text-gray-900">
                        Xác nhận thông tin
                      </h2>

                      {/* Summary Cards */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Contact */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Thông tin liên hệ
                          </h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="text-gray-400">Họ tên:</span> {formData.name}</p>
                            <p><span className="text-gray-400">SĐT:</span> {formData.phone}</p>
                            <p><span className="text-gray-400">Email:</span> {formData.email}</p>
                            {formData.address && <p><span className="text-gray-400">Địa chỉ:</span> {formData.address}</p>}
                          </div>
                        </div>

                        {/* Product */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Sản phẩm
                          </h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="text-gray-400">Loại:</span> {formData.productType || formData.productName}</p>
                            {formData.budget && <p><span className="text-gray-400">Ngân sách:</span> {formData.budget} VNĐ</p>}
                            {formData.dueDate && <p><span className="text-gray-400">Cần nhận:</span> {formData.dueDate}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Measurements Summary */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Số đo đã nhập
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(formData.measurements)
                            .filter(([_, v]) => v)
                            .map(([key, value]) => (
                              <span key={key} className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border">
                                {key}: {value}cm
                              </span>
                            ))}
                          {Object.values(formData.measurements).every(v => !v) && (
                            <span className="text-sm text-amber-600">
                              Chưa có số đo - sẽ đo tại tiệm
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                        <p>
                          Bằng việc gửi đơn, bạn đồng ý để My Hiền Tailor liên hệ qua SĐT/Email đã cung cấp.
                          Chúng tôi sẽ phản hồi trong vòng 24h làm việc.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors flex items-center gap-2"
                      >
                        ← Quay lại
                      </button>
                    ) : (
                      <div />
                    )}

                    {currentStep < 4 ? (
                      <button
                        id="next-btn"
                        type="button"
                        onClick={handleNext}
                        className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
                      >
                        Tiếp theo →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            ✓ Gửi đơn đặt may
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Live Preview Sidebar */}
            <div className="lg:col-span-2 hidden lg:block" id="order-preview">
              <div className="sticky top-[200px]">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Đơn hàng của bạn
                  </h3>

                  {/* Product Preview */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 mb-4">
                    {/* Product Image */}
                    {productImage ? (
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3">
                        <img
                          src={productImage}
                          alt="Product Preview"
                          className="w-full h-full object-cover"
                        />
                        {uploadedImages.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            +{uploadedImages.length - 1} ảnh
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-amber-700 font-bold text-lg">
                              {formData.selectedProductType ? formData.selectedProductType.charAt(0).toUpperCase() : "?"}
                            </span>
                          </div>
                          <p className="text-xs text-amber-600">Chưa có ảnh</p>
                        </div>
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900">
                      {formData.productName || formData.productType || "Chưa chọn sản phẩm"}
                    </h4>
                    {formData.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {formData.description}
                      </p>
                    )}
                  </div>

                  {/* Customer Info */}
                  {formData.name && (
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Khách hàng:</span> {formData.name}
                      </p>
                      {formData.phone && (
                        <p className="text-sm text-gray-500">{formData.phone}</p>
                      )}
                    </div>
                  )}

                  {/* Budget & Date */}
                  <div className="space-y-2 text-sm">
                    {formData.budget && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ngân sách:</span>
                        <span className="font-medium text-amber-600">{formData.budget} VNĐ</span>
                      </div>
                    )}
                    {formData.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ngày nhận:</span>
                        <span className="font-medium">{formData.dueDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Promo */}
                  {(formData.promoCode || formData.referralCode) && (
                    <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-sm text-green-700 font-medium">
                        Mã ưu đãi: {formData.promoCode || formData.referralCode}
                      </p>
                    </div>
                  )}

                  {/* Price Estimator */}
                  {estimatedPrice.min > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Giá ước tính</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Tham khảo
                        </span>
                      </div>
                      <div className="text-xl font-bold text-amber-600">
                        {formatPrice(estimatedPrice.min)} - {formatPrice(estimatedPrice.max)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Giá chính xác sẽ được báo sau khi tư vấn
                      </p>
                    </div>
                  )}

                  {/* Selected Styles */}
                  {selectedStyles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Mẫu tham khảo ({selectedStyles.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedStyles.map(style => (
                          <div
                            key={style.id}
                            className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600"
                          >
                            {style.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trust badges */}
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                    <p className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Bảo hành form 90 ngày
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Tư vấn miễn phí
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Chỉnh sửa miễn phí
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Overlay - Game-like onboarding */}
      <TutorialOverlay
        steps={TUTORIAL_STEPS}
        storageKey="order-form-tutorial"
        showOnFirstVisit={true}
        onComplete={() => console.log("Tutorial completed!")}
      />
    </div>
  );
};

export default CustomerOrderPage;

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";
import { orderService } from "../services";
import { isAuthenticated, getCurrentUserRole, getCurrentUser, ROLES } from "../utils/authStorage";
import { saveCustomerMeasurements } from "../utils/customerMeasurementsStorage";
import {
  getReferralByCode,
  recordReferralOnOrderCreated,
} from "../utils/referralStorage.js";
import { addAppointment } from "../utils/appointmentStorage.js";
import usePageMeta from "../hooks/usePageMeta";

const WELCOME_VOUCHER_CODE = "FRIEND-10";

const CustomerOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const productFromDetail = location.state?.product;
  const promoCodeFromPromotions = location.state?.promoCode;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    productName: productFromDetail?.name || "",
    productType: productFromDetail?.tag || "",
    description: productFromDetail?.desc || productFromDetail?.description || "",
    budget: "",
    dueDate: "",
    notes: "",
    promoCode: promoCodeFromPromotions || "",
    measurements: {
      height: "",
      weight: "",
      neck: "",
      chest: "",
      waist: "",
      hips: "",
      bicep: "",
      shoulder: "",
      sleeve: "",
      pantsLength: "",
      shirtLength: "",
      thigh: "",
      crotch: "",
      ankle: "",
    },
    appointmentType: "pickup", // pickup hoặc delivery
    appointmentTime: "",
    referralCode: "",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [referralVoucher, setReferralVoucher] = useState("");
  const [hintModal, setHintModal] = useState(null); // { title, content }

  usePageMeta({
    title: "Form đặt may theo số đo | Đặt lịch tư vấn My Hiền Tailor",
    description:
      "Gửi yêu cầu may đo áo dài, vest, đầm cùng số đo, ngân sách và lịch hẹn tại My Hiền Tailor TP.HCM.",
  });

  // Kiểm tra đăng nhập khi component mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const userRole = getCurrentUserRole();
      
      // Cho phép nếu đã đăng nhập (bất kỳ role nào) hoặc chưa đăng nhập
      // Nhưng sẽ hiển thị thông báo nếu chưa đăng nhập
      setIsLoggedIn(authenticated);
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Prefill thông tin liên hệ từ profile sau khi đăng nhập
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("measurements.")) {
      const measurementKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        measurements: {
          ...prev.measurements,
          [measurementKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.name || !formData.phone || !formData.email) {
        alert("Vui lòng điền đầy đủ thông tin liên hệ");
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2
      if (!formData.productName) {
        alert("Vui lòng nhập tên sản phẩm");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const toNumber = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(String(value).replace(/,/g, ""));
    return Number.isNaN(num) ? null : num;
  };

  // Simple product type helpers to show relevant fields
  const productTypeText = (formData.productType || formData.productName || "").toLowerCase();
  const isShirt = /áo|shirt|sơ mi|vest/.test(productTypeText);
  const isPant = /quần|pant|trouser|jean/.test(productTypeText);

  const measurementHints = {
    height: "Đứng thẳng lưng, không đi giày, đo từ gót đến đỉnh đầu.",
    weight: "Cân trên cân điện tử, không mang nhiều đồ.",
    chest: "Quấn thước qua điểm nở nhất của ngực, thở bình thường.",
    waist: "Đo ngang rốn (eo thật). Với quần có thể đo thêm vị trí đeo thắt lưng thấp.",
    hip: "Đo qua điểm nở nhất của mông.",
    shoulder: "Đo ngang lưng từ mỏm vai trái sang mỏm vai phải.",
    sleeve: "Đo từ đỉnh vai xuống qua khuỷu đến xương cổ tay.",
    bicep: "Đo vòng qua điểm to nhất của bắp tay.",
    neck: "Quấn thước quanh gốc cổ, chừa 1 ngón tay để thoải mái.",
    shirtLength: "Đo từ đỉnh vai xuống vị trí mong muốn (thường qua mông).",
    thigh: "Đo vòng qua điểm to nhất của đùi.",
    crotch: "Đo từ cạp quần phía trước qua đáy lên cạp sau.",
    ankle: "Đo vòng ống tại gấu (cổ chân) hoặc độ rộng mong muốn.",
    pantsLength: "Đo từ cạp đến gấu theo chiều dài mong muốn.",
  };

  const renderLabelWithHint = (label, hintKey) => (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      {hintKey && (
        <span
          className="text-xs text-[#1B4332] bg-[#E6F4EA] rounded-full px-2 py-0.5 cursor-help"
          onClick={() =>
            setHintModal({
              title: label,
              content: measurementHints[hintKey] || "Hướng dẫn đang được cập nhật.",
            })
          }
        >
          ?
        </span>
      )}
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < 3) {
      setCurrentStep(3);
      return;
    }

    const measurementValues = Object.values(formData.measurements || {});
    const hasAnyMeasurement = measurementValues.some(
      (value) => value !== null && value !== undefined && String(value).trim() !== ""
    );
    if (!hasAnyMeasurement) {
      alert("Vui lòng nhập ít nhất một số đo trước khi gửi đơn.");
      return;
    }

    const currentUser = getCurrentUser();
    const appointmentDate =
      formData.appointmentTime?.split("T")[0] || formData.dueDate || "";

    const referralInput = formData.referralCode?.trim();
    let referralMeta = null;
    if (referralInput) {
      referralMeta = getReferralByCode(referralInput);
      if (!referralMeta) {
        setReferralError("Mã giới thiệu không hợp lệ hoặc đã hết hạn.");
        setCurrentStep(1);
        return;
      }
    }

    // Parse numeric fields
    const parsedBudget = toNumber(formData.budget) || 0;
    // Map measurement to backend expected keys (numbers)
    const measurement = {
      chest: toNumber(formData.measurements.chest),
      waist: toNumber(formData.measurements.waist),
      hip: toNumber(formData.measurements.hips || formData.measurements.hip),
      shoulder: toNumber(formData.measurements.shoulder),
      sleeve: toNumber(formData.measurements.sleeve || formData.measurements.sleeveLength),
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
      productName: formData.productName,
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

    try {
      const response = await orderService.createWizard(wizardOrder);
      const responseData = response?.data ?? response?.responseData ?? response;
      const isSuccess =
        response?.success === true ||
        response?.responseStatus?.responseCode === "200" ||
        !!responseData?.id;

      if (isSuccess) {
        // Save measurements locally for history
        if (referralMeta) {
          recordReferralOnOrderCreated({
            code: referralMeta.profile.code,
            orderId: responseData.id || responseData.orderId,
            referredName: formData.name,
          });
          setReferralVoucher(WELCOME_VOUCHER_CODE);
        } else {
          setReferralVoucher("");
        }

        if (currentUser && formData.measurements) {
          const customerId = currentUser.id || currentUser.userId || currentUser.username || currentUser.phone;
          const measurementsToSave = {
            ...formData.measurements,
            hip: formData.measurements.hips || formData.measurements.hip,
            sleeveLength: formData.measurements.sleeve || formData.measurements.sleeveLength,
            neck: formData.measurements.neck,
            thigh: formData.measurements.thigh,
            crotch: formData.measurements.crotch,
            ankle: formData.measurements.ankle,
            orderId: responseData.id || responseData.orderId,
          };
          saveCustomerMeasurements(customerId, measurementsToSave);
        }

        // Tự động tạo appointment nếu order có appointmentDate hoặc dueDate
        const appointmentDate = responseData.appointmentDate || responseData.dueDate || formData.dueDate;
        if (appointmentDate && currentUser) {
          const customerId = currentUser.id || currentUser.userId || currentUser.username || currentUser.phone;
          const orderId = responseData.id || responseData.orderId;
          
          // Xác định loại appointment dựa trên appointmentType hoặc mặc định là "measure"
          const appointmentType = formData.appointmentType || "measure";
          
          // Tạo appointment với thông tin từ order
          try {
            addAppointment({
              customerId: customerId,
              orderId: orderId,
              slotId: null, // Sẽ được gán sau khi có slot cụ thể
              type: appointmentType, // "consult", "measure", "fitting", "pickup"
              status: "pending",
              appointmentDate: appointmentDate, // Lưu ngày hẹn từ order
              appointmentTime: formData.appointmentTime || null, // Thời gian nếu có
            });
            console.log("Đã tạo appointment tự động cho order:", orderId);
          } catch (error) {
            console.error("Lỗi khi tạo appointment:", error);
            // Không block flow nếu tạo appointment lỗi
          }
        }

        setShowSuccess(true);
        setTimeout(() => {
          navigate("/customer/dashboard", { 
            state: { orderCreated: true, orderId: responseData.id } 
          });
        }, 2000);
      } else {
        alert("Đặt đơn không thành công. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Đặt đơn không thành công. Vui lòng thử lại.");
    }
  };

  // Nếu đang kiểm tra auth, hiển thị loading
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
        <Header />
        <div className="pt-[170px] md:pt-[190px] pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Đang kiểm tra...</p>
          </div>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị thông báo
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
        <Header />

        <div className="pt-[170px] md:pt-[190px] pb-16">
          <div className="max-w-2xl mx-auto px-5 lg:px-8">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm text-center">
              <div className="text-6xl mb-6">🔒</div>
              <h1 className="heading-font text-[24px] md:text-[28px] text-[#111827] mb-4">
                Vui lòng đăng nhập
              </h1>
              <p className="text-[14px] text-[#6B7280] mb-8 max-w-md mx-auto">
                Để đặt may, bạn cần đăng nhập vào tài khoản của mình. Nếu chưa
                có tài khoản, vui lòng đăng ký trước.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/login/customer")}
                  className="px-6 py-3 text-[14px] font-medium bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-all duration-300"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-6 py-3 text-[14px] font-medium border-2 border-[#1B4332] text-[#1B4332] rounded-full hover:bg-[#1B4332] hover:text-white transition-all duration-300"
                >
                  Đăng ký
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                <button
                  onClick={() => navigate(-1)}
                  className="text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  ← Quay lại trang trước
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header />

      {/* Popup thông báo đặt đơn thành công */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 max-w-sm w-full text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl text-green-600">✔</span>
            </div>
            <h2 className="text-lg font-semibold text-[#111827] mb-2">
              Đặt may thành công!
            </h2>
            <p className="text-sm text-[#6B7280] mb-3">
              Cảm ơn bạn đã tin tưởng. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
            </p>
            {referralVoucher && (
              <div className="text-sm text-[#065f46] bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3">
                Bạn vừa nhận mã ưu đãi{" "}
                <span className="font-semibold">{referralVoucher}</span> giảm 10%
                cho đơn kế tiếp. Đừng quên chia sẻ cho bạn bè nhé!
              </div>
            )}
            <p className="text-xs text-[#9CA3AF]">
              Hệ thống sẽ tự động chuyển bạn về trang quản lý đơn hàng sau giây lát...
            </p>
          </div>
        </div>
      )}

      {/* Hint modal */}
      {hintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[#111827]">{hintModal.title}</h3>
              <button
                onClick={() => setHintModal(null)}
                className="text-[#6B7280] hover:text-[#111827]"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[#374151] leading-relaxed">{hintModal.content}</p>
            <div className="mt-4 text-right">
              <button
                onClick={() => setHintModal(null)}
                className="px-4 py-2 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#14532d] transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-4xl mx-auto px-5 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <h1 className="heading-font text-[30px] md:text-[34px] text-[#111827]">
              Form đặt may theo số đo My Hiền Tailor
            </h1>
            <p className="text-[14px] text-[#6B7280]">
              Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại để tư vấn chi tiết
              và chốt lịch đo thử.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        currentStep >= step
                          ? "bg-[#1B4332] text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step}
                    </div>
                    <span className="text-xs mt-2 text-center text-[#6B7280]">
                      {step === 1 && "Thông tin"}
                      {step === 2 && "Sản phẩm"}
                      {step === 3 && "Số đo"}
                    </span>
                  </div>
                  {step < 3 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        currentStep > step ? "bg-[#1B4332]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            {/* Step 1: Thông tin liên hệ */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-[18px] font-semibold text-[#111827] mb-4">
                  Thông tin liên hệ
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Mã giới thiệu (nếu có)
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={(e) => {
                      setReferralError("");
                      handleInputChange({
                        target: {
                          name: "referralCode",
                          value: e.target.value.toUpperCase(),
                        },
                      });
                    }}
                    placeholder="Ví dụ: MYHI-ABCD"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] ${
                      referralError ? "border-red-400" : "border-[#E5E7EB]"
                    }`}
                  />
                  <p className="text-[12px] text-[#6B7280] mt-1">
                    Nhập mã do bạn bè chia sẻ để nhận ưu đãi 10% cho đơn đầu tiên.
                  </p>
                  {referralError && (
                    <p className="text-[12px] text-red-500 mt-1">{referralError}</p>
                  )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Thông tin sản phẩm */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-[18px] font-semibold text-[#111827] mb-4">
                  Thông tin sản phẩm
                </h2>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    placeholder="Ví dụ: Áo dài cưới, Vest công sở..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Loại sản phẩm
                  </label>
                  <input
                    type="text"
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    placeholder="Ví dụ: Áo dài, Vest, Đầm..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    placeholder="Mô tả về sản phẩm bạn muốn may, màu sắc, chất liệu mong muốn..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      Ngân sách dự kiến
                    </label>
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                      placeholder="Ví dụ: 2.500.000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      Ngày cần nhận
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Ghi chú thêm
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    placeholder="Bất kỳ yêu cầu đặc biệt nào khác..."
                  />
                </div>

                {/* Mã giảm giá */}
                {promoCodeFromPromotions && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">
                      🎁 Mã giảm giá đã được áp dụng
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700">Mã:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-mono font-semibold text-sm">
                        {promoCodeFromPromotions}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Mã giảm giá (nếu có)
                  </label>
                  <input
                    type="text"
                    name="promoCode"
                    value={formData.promoCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    placeholder="Nhập mã giảm giá"
                  />
                  {formData.promoCode && (
                    <p className="text-xs text-[#6B7280] mt-1">
                      Mã giảm giá sẽ được xác nhận khi chúng tôi liên hệ với bạn.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Số đo */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-[18px] font-semibold text-[#111827] mb-4">
                  Số đo (tùy chọn)
                </h2>
                <p className="text-sm text-[#6B7280] mb-6">
                  Nếu bạn đã có số đo, vui lòng điền vào. Nếu chưa, chúng tôi
                  sẽ đo khi bạn đến tiệm. Nhấn vào dấu ? để xem hướng dẫn nhanh.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Chiều cao (cm)", "height")}
                    </label>
                    <input
                      type="number"
                      name="measurements.height"
                      value={formData.measurements.height}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Cân nặng (kg)", "weight")}
                    </label>
                    <input
                      type="number"
                      name="measurements.weight"
                      value={formData.measurements.weight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Vòng ngực (cm)", "chest")}
                    </label>
                    <input
                      type="number"
                      name="measurements.chest"
                      value={formData.measurements.chest}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Vòng eo (cm)", "waist")}
                    </label>
                    <input
                      type="number"
                      name="measurements.waist"
                      value={formData.measurements.waist}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Vòng mông (cm)", "hip")}
                    </label>
                    <input
                      type="number"
                      name="measurements.hips"
                      value={formData.measurements.hips}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>

                  {(!isPant || isShirt) && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Vai (cm)", "shoulder")}
                    </label>
                    <input
                      type="number"
                      name="measurements.shoulder"
                      value={formData.measurements.shoulder}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                  )}

                  {(!isPant || isShirt) && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Tay áo (cm)", "sleeve")}
                    </label>
                    <input
                      type="number"
                      name="measurements.sleeve"
                      value={formData.measurements.sleeve}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                  )}

                  {(!isPant || isShirt) && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Bắp tay (cm)", "bicep")}
                    </label>
                    <input
                      type="number"
                      name="measurements.bicep"
                      value={formData.measurements.bicep}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                  )}

                  {(!isPant || isShirt) && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Vòng cổ (cm)", "neck")}
                    </label>
                    <input
                      type="number"
                      name="measurements.neck"
                      value={formData.measurements.neck}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                  )}

                  {(!isPant || isShirt) && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Dài áo (cm)", "shirtLength")}
                    </label>
                    <input
                      type="number"
                      name="measurements.shirtLength"
                      value={formData.measurements.shirtLength}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                  )}

                  {(isPant || !isShirt) && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Đùi (cm)", "thigh")}
                    </label>
                    <input
                      type="number"
                      name="measurements.thigh"
                      value={formData.measurements.thigh}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                  )}

                  {(isPant || !isShirt) && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Hạ đáy (cm)", "crotch")}
                    </label>
                    <input
                      type="number"
                      name="measurements.crotch"
                      value={formData.measurements.crotch}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                  )}

                  {(isPant || !isShirt) && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Ống quần (cm)", "ankle")}
                    </label>
                    <input
                      type="number"
                      name="measurements.ankle"
                      value={formData.measurements.ankle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                  )}

                  {(isPant || !isShirt) && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">
                      {renderLabelWithHint("Dài quần (cm)", "pantsLength")}
                    </label>
                    <input
                      type="number"
                      name="measurements.pantsLength"
                      value={formData.measurements.pantsLength}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                  </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-[#F9FAFB] rounded-lg">
                  <h3 className="text-sm font-semibold text-[#111827] mb-2">
                    Lịch hẹn
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        Cách nhận đồ
                      </label>
                      <select
                        name="appointmentType"
                        value={formData.appointmentType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                      >
                        <option value="pickup">Nhận tại tiệm</option>
                        <option value="delivery">Giao hàng tận nơi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        Thời gian hẹn (nếu nhận tại tiệm)
                      </label>
                      <input
                        type="datetime-local"
                        name="appointmentTime"
                        value={formData.appointmentTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-[#E5E7EB]">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 text-[14px] font-medium border-2 border-[#1B4332] text-[#1B4332] rounded-full hover:bg-[#1B4332] hover:text-white transition-all duration-300"
                >
                  ← Quay lại
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 text-[14px] font-medium bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-all duration-300"
                >
                  Tiếp theo →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 text-[14px] font-medium bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-all duration-300"
                >
                  Gửi đơn đặt may
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderPage;


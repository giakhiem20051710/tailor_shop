import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Scissors, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { authService, userService } from "../services";
import { showSuccess, showError } from "../components/NotificationToast.jsx";
import usePageMeta from "../hooks/usePageMeta";
import { events } from "../utils/analytics.js";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    rememberMe: false,
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  usePageMeta({
    title: authMode === "login" ? "Đăng nhập | My Hiền Tailor" : "Đăng ký | My Hiền Tailor",
    description: "Đăng nhập/Đăng ký để quản lý đơn hàng và hồ sơ của bạn.",
  });

  // Check for success message (reset password, etc.)
  useEffect(() => {
    if (location.state?.message) {
      showSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const currentErrors = {};

    const requireField = (field, label) => {
      if (!formData[field] || !formData[field].toString().trim()) {
        currentErrors[field] = `${label} không được để trống`;
      }
    };

    if (authMode === "login") {
      requireField("email", "Email / Số điện thoại");
      requireField("password", "Mật khẩu");
    } else {
      requireField("fullName", "Họ và tên");
      requireField("email", "Email");
      requireField("phone", "Số điện thoại");
      requireField("password", "Mật khẩu");
      if (!formData.acceptTerms) {
        currentErrors.acceptTerms = "Bạn cần đồng ý điều khoản";
      }
    }

    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (authMode === "login") {
        const response = await authService.login({
          phoneOrEmail: formData.email.trim(),
          password: formData.password,
        });

        const responseData = response?.data ?? response?.responseData ?? response;
        const isSuccess =
          response?.success === true ||
          response?.responseStatus?.responseCode === "200" ||
          !!responseData?.accessToken ||
          !!responseData?.token;

        if (isSuccess && responseData) {
          const token = responseData.token ?? responseData.accessToken;

          // Store token if returned in responseData
          if (token) {
            localStorage.setItem("token", token);
          }

          const profileResponse = await userService.getProfile();
          const userData = profileResponse.data ?? profileResponse;
          if (formData.rememberMe) {
            localStorage.setItem(
              "rememberedCredentials",
              JSON.stringify({ phoneOrEmail: formData.email })
            );
          } else {
            localStorage.removeItem("rememberedCredentials");
          }
          localStorage.setItem("userData", JSON.stringify(userData));
          localStorage.setItem("isAuthenticated", "true");

          // Hỗ trợ nhiều kiểu dữ liệu role trả về từ BE:
          // - roleCode: "admin" | "staff" | "customer" (ưu tiên)
          // - role là string: "admin", "staff", "customer"
          // - role là object: { code: "admin", name: "Quản trị" }
          const rawRole =
            userData.roleCode ||
            (userData.role && userData.role.code) ||
            userData.role ||
            "customer";
          const normalizedRole = String(rawRole).toLowerCase();
          const username =
            userData.username || userData.email || userData.phone || userData.fullName;
          localStorage.setItem("userRole", normalizedRole);
          if (username) {
            localStorage.setItem("username", username);
          }
          events.LOGIN("standard");

          const role = normalizedRole;
          const displayName = userData?.name || userData?.fullName || "bạn";

          // Điều hướng theo role:
          // - admin / staff: vào Admin Dashboard
          // - tailor: vào Tailor Dashboard
          // - customer: về trang chủ khách hàng (không phải admin dashboard)
          const dashboardRoutes = {
            admin: "/dashboard",
            staff: "/dashboard",
            tailor: "/tailor/dashboard",
            customer: "/customer-home",
          };
          const targetRoute = dashboardRoutes[role] || "/customer-home";
          showSuccess(`Xin chào, ${displayName}!`);
          navigate(targetRoute, { replace: true });
        } else {
          showError("Tên đăng nhập hoặc mật khẩu không đúng");
        }
      } else {
        // Register flow (best-effort; backend DTO may vary)
        const registerPayload = {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        };
        await authService.register(registerPayload);
        showSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
        setAuthMode("login");
      }
    } catch (error) {
      console.error(`${authMode} error:`, error);
      showError(error.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const FeatureItem = ({ number, title, description }) => (
    <div className="flex gap-4 items-start">
      <div className="text-amber-500 text-sm shrink-0 bg-amber-500/10 w-10 h-10 rounded-lg flex items-center justify-center">
        {number}
      </div>
      <div>
        <h3 className="text-white mb-1">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  );

  const TrustBadge = ({ number, label }) => (
    <div className="bg-white rounded-xl p-3 border border-slate-100">
      <div className="text-amber-600">{number}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1718184021018-d2158af6b321?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            alt="Luxury tailor fabric"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white">ELEGANCE TAILOR</h1>
                <p className="text-amber-400 text-sm">Bespoke Tailoring Studio</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-white mb-4">Nghệ Thuật May Đo</h2>
              <p className="text-slate-300 text-lg leading-relaxed max-w-md">
                Nơi mỗi đường kim mũi chỉ là một tác phẩm nghệ thuật.
                Chúng tôi tạo nên phong cách riêng biệt cho bạn.
              </p>
            </div>

            <div className="space-y-4">
              <FeatureItem number="01" title="Đo lường chính xác" description="Hệ thống đo 50+ số đo cơ thể" />
              <FeatureItem number="02" title="Vải cao cấp" description="Nhập khẩu từ Italy, Anh Quốc" />
              <FeatureItem number="03" title="Thợ may lành nghề" description="Kinh nghiệm 20+ năm trong nghề" />
            </div>
          </div>

          <div className="text-slate-400 text-sm">
            <p>&copy; 2025 Elegance Tailor. Crafted with precision.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-slate-900">ELEGANCE TAILOR</h2>
              <p className="text-amber-600 text-sm">Bespoke Tailoring Studio</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-slate-900 mb-2">
                {authMode === "login" ? "Chào Mừng Trở Lại" : "Tạo Tài Khoản"}
              </h2>
              <p className="text-slate-500">
                {authMode === "login"
                  ? "Đăng nhập để quản lý đơn hàng và hồ sơ của bạn"
                  : "Bắt đầu hành trình may đo cao cấp cùng chúng tôi"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {authMode === "register" && (
                <div>
                  <label htmlFor="fullName" className="block text-sm text-slate-700 mb-2">
                    Họ và Tên
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateFormData("fullName", e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none bg-slate-50 hover:bg-white"
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm text-slate-700 mb-2">
                  Email hoặc Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none bg-slate-50 hover:bg-white"
                    placeholder="email@example.com hoặc 0912345678"
                    autoComplete="username"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              {authMode === "register" && (
                <div>
                  <label htmlFor="phone" className="block text-sm text-slate-700 mb-2">
                    Số Điện Thoại
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none bg-slate-50 hover:bg-white"
                      placeholder="0912 345 678"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm text-slate-700 mb-2">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none bg-slate-50 hover:bg-white"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                    )}
                  </button>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
              </div>

              {authMode === "login" && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                      checked={formData.rememberMe}
                      onChange={(e) => updateFormData("rememberMe", e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-slate-600">Ghi nhớ đăng nhập</span>
                  </label>
                  <a href="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700 transition-colors">
                    Quên mật khẩu?
                  </a>
                </div>
              )}

              {authMode === "register" && (
                <div className="pt-1">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 cursor-pointer mt-0.5"
                      checked={formData.acceptTerms}
                      onChange={(e) => updateFormData("acceptTerms", e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-slate-600">
                      Tôi đồng ý với{" "}
                      <a href="#" className="text-amber-600 hover:text-amber-700">
                        Điều khoản dịch vụ
                      </a>{" "}
                      và{" "}
                      <a href="#" className="text-amber-600 hover:text-amber-700">
                        Chính sách bảo mật
                      </a>
                    </span>
                  </label>
                  {errors.acceptTerms && <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3.5 rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : authMode === "login" ? (
                  "Đăng Nhập"
                ) : (
                  "Tạo Tài Khoản"
                )}
              </button>
            </form>

            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-4 text-sm text-slate-400">hoặc</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                {authMode === "login" ? (
                  <>
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className="text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      Đăng ký ngay
                    </button>
                  </>
                ) : (
                  <>
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      Đăng nhập
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <TrustBadge number="20+" label="Năm kinh nghiệm" />
            <TrustBadge number="5000+" label="Khách hàng" />
            <TrustBadge number="100%" label="Hài lòng" />
          </div>
        </div>
      </div>
    </div>
  );
}

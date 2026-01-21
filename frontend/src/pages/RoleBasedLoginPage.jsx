import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { authService, userService } from "../services";
import usePageMeta from "../hooks/usePageMeta";
import { validators, validateForm } from "../utils/validation.js";
import { showSuccess, showError } from "../components/NotificationToast.jsx";
import { events } from "../utils/analytics.js";

export default function RoleBasedLoginPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    phoneOrEmail: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // No need to initialize default users - using backend API

  const normalizeRole = () => {
    const roleFromUrl = (role || "").toLowerCase();
    const allowedRoles = ["admin", "staff", "tailor", "customer"];
    if (allowedRoles.includes(roleFromUrl)) {
      return roleFromUrl;
    }
    return "customer";
  };

  const effectiveRole = normalizeRole();

  const getRoleInfo = (currentRole) => {
    const roleInfo = {
      admin: {
        title: "Quản trị viên",
        icon: "🔐",
        description: "Đăng nhập với tài khoản quản trị viên",
        bgColor: "from-red-50 via-white to-red-50",
        headerColor: "from-red-600 to-red-700",
        textColor: "text-red-700",
        buttonColor: "from-red-600 to-red-700 hover:from-red-700 hover:to-red-800",
      },
      staff: {
        title: "Nhân viên",
        icon: "👔",
        description: "Đăng nhập với tài khoản nhân viên",
        bgColor: "from-blue-50 via-white to-blue-50",
        headerColor: "from-blue-600 to-blue-700",
        textColor: "text-blue-700",
        buttonColor: "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
      },
      tailor: {
        title: "Thợ may",
        icon: "✂️",
        description: "Đăng nhập với tài khoản thợ may",
        bgColor: "from-purple-50 via-white to-purple-50",
        headerColor: "from-purple-600 to-purple-700",
        textColor: "text-purple-700",
        buttonColor: "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
      },
      customer: {
        title: "Khách hàng",
        icon: "👤",
        description: "Đăng nhập với tài khoản khách hàng",
        bgColor: "from-green-50 via-white to-green-50",
        headerColor: "from-green-600 to-green-700",
        textColor: "text-green-700",
        buttonColor: "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
      },
    };
    return roleInfo[currentRole] || roleInfo.customer;
  };

  const roleInfo = getRoleInfo(effectiveRole);

  usePageMeta({
    title: `Đăng nhập ${roleInfo.title} | My Hiền Tailor`,
    description: roleInfo.description,
  });

  // Load remembered credentials
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedCredentials");
    if (remembered) {
      try {
        const creds = JSON.parse(remembered);
        setFormData((prev) => ({
          ...prev,
          username: creds.username || "",
          rememberMe: true,
        }));
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const rules = {
      phoneOrEmail: [validators.required],
      password: [validators.required, validators.minLength(3)],
    };

    const { errors: validationErrors, isValid } = validateForm(formData, rules);
    setErrors(validationErrors);
    return isValid;
  };

  const getDashboardRoute = (userRole) => {
    const routes = {
      admin: "/dashboard",
      staff: "/dashboard",
      tailor: "/tailor/dashboard",
      customer: "/customer-home",
    };
    return routes[userRole] || "/customer-home";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API
      const response = await authService.login({
        phoneOrEmail: formData.phoneOrEmail?.trim(),
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
        if (token) {
          localStorage.setItem("token", token);
        }

        // Get user profile to determine role
        const profileResponse = await userService.getProfile();
        const userData = profileResponse.data ?? profileResponse;
        const displayName = userData?.name || userData?.fullName || "bạn";

        // Chuẩn hóa role giống LoginPage:
        // - roleCode: "admin" | "staff" | "customer"
        // - role là string: "admin", "staff", "customer"
        // - role là object: { code: "admin", name: "Quản trị" }
        const rawRole =
          userData.roleCode ||
          (userData.role && userData.role.code) ||
          userData.role ||
          effectiveRole ||
          "customer";
        const finalRole = String(rawRole).toLowerCase();

        // Remember credentials if checked
        if (formData.rememberMe) {
          localStorage.setItem("rememberedCredentials", JSON.stringify({
            phoneOrEmail: formData.phoneOrEmail,
          }));
        } else {
          localStorage.removeItem("rememberedCredentials");
        }

        // Store user data for UI
        localStorage.setItem("userData", JSON.stringify(userData));
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", finalRole);

        // Track login event
        events.LOGIN(effectiveRole);

        showSuccess(`Xin chào, ${displayName}!`);
        navigate(getDashboardRoute(finalRole), { replace: true });
      } else {
        setErrors({ password: "Tên đăng nhập hoặc mật khẩu không đúng" });
        showError("Tên đăng nhập hoặc mật khẩu không đúng");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ password: error.message || "Đăng nhập thất bại. Vui lòng thử lại." });
      showError(error.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${roleInfo.bgColor} flex items-center justify-center p-4 py-12`}>
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${roleInfo.headerColor} rounded-2xl shadow-lg mb-4`}>
            <span className="text-3xl">{roleInfo.icon}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {roleInfo.title}
          </h1>
          <p className="text-gray-600 text-sm">{roleInfo.description}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
                <label htmlFor="phoneOrEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại hoặc Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="phoneOrEmail"
                  name="phoneOrEmail"
                  type="text"
                  value={formData.phoneOrEmail}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] transition ${
                    errors.username ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Nhập số điện thoại hoặc email"
                  autoComplete="username"
                  aria-invalid={!!errors.phoneOrEmail}
                  aria-describedby={errors.phoneOrEmail ? "phoneOrEmail-error" : undefined}
          />
        </div>
              {errors.phoneOrEmail && (
                <p id="phoneOrEmail-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.phoneOrEmail}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 transition ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L3 3" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#1B4332] focus:ring-[#1B4332] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link
                to="/forgot-password"
                className={`text-sm font-medium ${roleInfo.textColor} hover:opacity-80 transition`}
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r ${roleInfo.buttonColor} text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

        {/* Back Button */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-800 transition flex items-center justify-center gap-1"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại chọn loại đăng nhập
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2025 My Hiền Tailor. Bản quyền thuộc về bạn.
        </p>
      </div>
    </div>
  );
}

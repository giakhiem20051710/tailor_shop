import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getUsersByRole, initializeDefaultUsers, ROLES } from "../utils/authStorage.js";
import usePageMeta from "../hooks/usePageMeta";
import { validators, validateForm } from "../utils/validation.js";
import { showSuccess, showError } from "../components/NotificationToast.jsx";
import { events } from "../utils/analytics.js";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  usePageMeta({
    title: "Đăng nhập | My Hiền Tailor",
    description: "Đăng nhập vào hệ thống My Hiền Tailor để quản lý đơn hàng, xem lịch hẹn và theo dõi đơn hàng của bạn.",
  });

  // Initialize default users on mount
  useEffect(() => {
    initializeDefaultUsers();
  }, []);

  // Check for success message from reset password
  useEffect(() => {
    if (location.state?.message) {
      showSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const rules = {
      username: [validators.required],
      password: [validators.required, validators.minLength(3)],
    };

    const { errors: validationErrors, isValid } = validateForm(formData, rules);
    setErrors(validationErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      let foundUser = null;
      let userRole = null;

      // Check registered users
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      foundUser = registeredUsers.find(
        (u) => u.username === formData.username && u.password === formData.password
      );

      // If not found, check role-based users
      if (!foundUser) {
        const roles = [ROLES.ADMIN, ROLES.STAFF, ROLES.TAILOR, ROLES.CUSTOMER];
        for (const role of roles) {
          const users = getUsersByRole(role);
          const user = users.find(
            (u) => u.username === formData.username && u.password === formData.password
          );
          if (user) {
            foundUser = user;
            userRole = role;
            break;
          }
        }
      } else {
        userRole = foundUser.role || null;
      }

      // Demo: Also accept any credentials for demo purposes
      if (foundUser || (formData.username && formData.password)) {
        const userData = foundUser || {
          username: formData.username,
          role: userRole || ROLES.CUSTOMER,
          name: formData.username,
        };

        const normalizedRole = userData.role ? userData.role.toLowerCase() : userData.role;
        
        // Store authentication
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", normalizedRole);
        localStorage.setItem("username", userData.username);
        localStorage.setItem("userData", JSON.stringify(userData));

        // Remember credentials if checked
        if (formData.rememberMe) {
          localStorage.setItem("rememberedCredentials", JSON.stringify({
            username: formData.username,
          }));
        } else {
          localStorage.removeItem("rememberedCredentials");
        }

        // Track login event
        events.LOGIN("standard");

        // Navigate to appropriate dashboard
        const dashboardRoutes = {
          [ROLES.ADMIN]: "/dashboard",
          [ROLES.STAFF]: "/dashboard",
          [ROLES.TAILOR]: "/tailor/dashboard",
          [ROLES.CUSTOMER]: "/customer/dashboard",
        };
        const targetRoute = dashboardRoutes[userData.role] || dashboardRoutes[normalizedRole] || "/dashboard";
        
        showSuccess("Đăng nhập thành công!");
        navigate(targetRoute, { replace: true });
      } else {
        setErrors({ password: "Tên đăng nhập hoặc mật khẩu không đúng" });
        showError("Tên đăng nhập hoặc mật khẩu không đúng");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#1B4332] to-[#2D5A47] rounded-2xl shadow-lg mb-4">
            <span className="text-3xl font-bold text-white">MH</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Hiền Tailor
          </h1>
          <p className="text-gray-600 text-sm">Fashion Design Studio</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
            <p className="text-sm text-gray-600">
              Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập hoặc Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] transition ${
                    errors.username ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Nhập tên đăng nhập hoặc email"
                  autoComplete="username"
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? "username-error" : undefined}
                />
              </div>
              {errors.username && (
                <p id="username-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.username}
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
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] transition ${
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
                className="text-sm font-medium text-[#1B4332] hover:text-[#14532d] transition"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#1B4332] to-[#2D5A47] text-white py-3 px-4 rounded-xl font-semibold hover:from-[#14532d] hover:to-[#1B4332] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">hoặc</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#1B4332] hover:text-[#14532d] transition"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Quick Login Options */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-3 text-center">
            Đăng nhập nhanh theo vai trò
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/login/admin"
              className="px-3 py-2 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-center"
            >
              🔐 Admin
            </Link>
            <Link
              to="/login/staff"
              className="px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-center"
            >
              👔 Nhân viên
            </Link>
            <Link
              to="/login/tailor"
              className="px-3 py-2 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-center"
            >
              ✂️ Thợ may
            </Link>
            <Link
              to="/login/customer"
              className="px-3 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-center"
            >
              👤 Khách hàng
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

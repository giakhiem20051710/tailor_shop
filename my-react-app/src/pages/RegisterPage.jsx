import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterHeader from "../components/register/RegisterHeader.jsx";
import RegisterForm from "../components/register/RegisterForm.jsx";
import usePageMeta from "../hooks/usePageMeta";
import { authService, userService } from "../services";
import { showSuccess, showError } from "../components/NotificationToast.jsx";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  usePageMeta({
    title: "Đăng ký tài khoản | Tiệm May Admin",
    description:
      "Tạo tài khoản mới để đăng nhập và quản lý đơn hàng trong hệ thống Tiệm May Admin.",
  });

  // No authentication check - users can access this page freely

  const handleSubmit = async (formData) => {
    setError("");
    setIsLoading(true);

    try {
      // Call backend API
      await authService.register({
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        name: formData.name || formData.username,
        // ... other fields if needed
      });

      showSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <RegisterHeader />

        {/* Register Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <RegisterForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
            error={error}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Tiệm May Admin. Bản quyền thuộc về bạn.
        </p>
      </div>
    </div>
  );
}


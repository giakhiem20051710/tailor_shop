import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResetPasswordHeader from "../components/forgot-password/ResetPasswordHeader.jsx";
import ResetPasswordForm from "../components/forgot-password/ResetPasswordForm.jsx";

export default function ResetPasswordPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user has valid reset password data
  useEffect(() => {
    const resetData = JSON.parse(localStorage.getItem("resetPasswordData") || "null");
    
    if (!resetData) {
      // No reset password session, redirect to forgot password
      navigate("/forgot-password", { replace: true });
      return;
    }

    // Check if OTP has expired
    if (Date.now() > resetData.expiresAt) {
      localStorage.removeItem("resetPasswordData");
      setError("Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.");
      setTimeout(() => {
        navigate("/forgot-password", { replace: true });
      }, 2000);
    }
  }, [navigate]);

  // No authentication check - users can access this page freely

  const handleSubmit = async (formData) => {
    setError("");
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const resetData = JSON.parse(localStorage.getItem("resetPasswordData") || "null");

      if (!resetData) {
        setError("Phiên đặt lại mật khẩu không hợp lệ. Vui lòng thử lại.");
        setIsLoading(false);
        navigate("/forgot-password", { replace: true });
        return;
      }

      // Check if OTP has expired
      if (Date.now() > resetData.expiresAt) {
        localStorage.removeItem("resetPasswordData");
        setError("Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.");
        setIsLoading(false);
        setTimeout(() => {
          navigate("/forgot-password", { replace: true });
        }, 2000);
        return;
      }

      // Verify OTP
      if (formData.otp !== resetData.otp) {
        setError("Mã xác nhận không đúng. Vui lòng thử lại.");
        setIsLoading(false);
        return;
      }

      // Update password in registered users
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      const userIndex = registeredUsers.findIndex((u) => u.email === resetData.email);

      if (userIndex === -1) {
        setError("Không tìm thấy tài khoản. Vui lòng thử lại.");
        setIsLoading(false);
        return;
      }

      // Update password
      registeredUsers[userIndex].password = formData.password;
      localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));

      // Clear reset password data
      localStorage.removeItem("resetPasswordData");

      // Show success message and redirect to login
      setError(""); // Clear any errors
      setIsLoading(false);

      // Navigate to login with success message
      navigate("/login", { 
        state: { message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới." },
        replace: true 
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ResetPasswordHeader />

        {/* Reset Password Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <ResetPasswordForm
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


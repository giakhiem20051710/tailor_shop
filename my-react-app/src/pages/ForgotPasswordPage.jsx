import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordHeader from "../components/forgot-password/ForgotPasswordHeader.jsx";
import ForgotPasswordForm from "../components/forgot-password/ForgotPasswordForm.jsx";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // No authentication check - users can access this page freely

  // Generate OTP (6-digit random number)
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (email) => {
    setError("");
    setSuccess(false);
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Check if email exists in registered users
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      const user = registeredUsers.find((u) => u.email === email);

      if (!user) {
        setError("Email không tồn tại trong hệ thống");
        setIsLoading(false);
        return;
      }

      // Generate OTP and store temporarily
      const otp = generateOTP();
      const resetData = {
        email: email,
        otp: otp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes from now
        username: user.username,
      };

      localStorage.setItem("resetPasswordData", JSON.stringify(resetData));

      // In production, you would send this OTP via email
      // For demo, we'll log it to console
      console.log(`Demo OTP for ${email}: ${otp}`);

      setSuccess(true);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ForgotPasswordHeader />

        {/* Forgot Password Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <ForgotPasswordForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            success={success}
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


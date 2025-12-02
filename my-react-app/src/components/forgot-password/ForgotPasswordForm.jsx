import { useState } from "react";
import { Link } from "react-router-dom";
import InputField from "../common/InputField.jsx";
import ErrorAlert from "../common/ErrorAlert.jsx";
import LoadingButton from "../common/LoadingButton.jsx";

export default function ForgotPasswordForm({ onSubmit, isLoading, error, success }) {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (validationError) setValidationError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    // Validation
    if (!email) {
      setValidationError("Vui lòng nhập email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("Email không hợp lệ");
      return;
    }

    onSubmit(email);
  };

  const EmailIcon = () => (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  if (success) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold mb-1">Email đã được gửi!</p>
              <p className="text-sm">
                Chúng tôi đã gửi mã xác nhận đến <strong>{email}</strong>. 
                Vui lòng kiểm tra email và nhập mã để đặt lại mật khẩu.
              </p>
            </div>
          </div>
        </div>
        <Link
          to="/reset-password"
          className="block w-full text-center bg-green-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-800 transition"
        >
          Tiếp tục đặt lại mật khẩu
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorAlert message={error || validationError} />

      <div>
        <p className="text-sm text-gray-600 mb-4">
          Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi mã xác nhận để bạn có thể đặt lại mật khẩu.
        </p>
        <InputField
          id="email"
          name="email"
          type="email"
          label="Email"
          value={email}
          onChange={handleChange}
          placeholder="example@email.com"
          required
          autoComplete="email"
          icon={<EmailIcon />}
        />
      </div>

      <LoadingButton type="submit" isLoading={isLoading}>
        Gửi mã xác nhận
      </LoadingButton>

      {/* Link to Login */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Nhớ mật khẩu?{" "}
          <Link
            to="/login"
            className="font-medium text-green-600 hover:text-green-700 transition"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </form>
  );
}


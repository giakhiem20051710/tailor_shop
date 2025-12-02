import { useState } from "react";
import { Link } from "react-router-dom";
import InputField from "../common/InputField.jsx";
import ErrorAlert from "../common/ErrorAlert.jsx";
import LoadingButton from "../common/LoadingButton.jsx";

export default function ResetPasswordForm({ onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.otp || formData.otp.length !== 6) {
      errors.otp = "Mã xác nhận phải có 6 chữ số";
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const LockIcon = () => (
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );

  const KeyIcon = () => (
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
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ErrorAlert message={error} />

      <div>
        <p className="text-sm text-gray-600 mb-4">
          Nhập mã xác nhận 6 chữ số đã được gửi đến email của bạn.
        </p>
        <InputField
          id="otp"
          name="otp"
          type="text"
          label="Mã xác nhận *"
          value={formData.otp}
          onChange={handleChange}
          placeholder="000000"
          required
          maxLength={6}
          icon={<KeyIcon />}
          className="text-center text-2xl tracking-widest font-mono"
        />
        {validationErrors.otp && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.otp}</p>
        )}
      </div>

      <InputField
        id="password"
        name="password"
        type="password"
        label="Mật khẩu mới *"
        value={formData.password}
        onChange={handleChange}
        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
        required
        autoComplete="new-password"
        icon={<LockIcon />}
      />
      {validationErrors.password && (
        <p className="text-red-500 text-xs -mt-3">{validationErrors.password}</p>
      )}

      <InputField
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Xác nhận mật khẩu mới *"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Nhập lại mật khẩu mới"
        required
        autoComplete="new-password"
        icon={<LockIcon />}
      />
      {validationErrors.confirmPassword && (
        <p className="text-red-500 text-xs -mt-3">{validationErrors.confirmPassword}</p>
      )}

      <LoadingButton type="submit" isLoading={isLoading}>
        Đặt lại mật khẩu
      </LoadingButton>

      {/* Links */}
      <div className="text-center pt-4 border-t border-gray-200 space-y-2">
        <p className="text-sm text-gray-600">
          Chưa nhận được mã?{" "}
          <Link
            to="/forgot-password"
            className="font-medium text-green-600 hover:text-green-700 transition"
          >
            Gửi lại mã
          </Link>
        </p>
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


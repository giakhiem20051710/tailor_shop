import { useState } from "react";
import { Link } from "react-router-dom";
import InputField from "../common/InputField.jsx";
import ErrorAlert from "../common/ErrorAlert.jsx";
import LoadingButton from "../common/LoadingButton.jsx";

export default function RegisterForm({ onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

    if (!formData.username || formData.username.length < 3) {
      errors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      errors.phone = "Số điện thoại phải có 10-11 chữ số";
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = "Bạn cần đồng ý với điều khoản sử dụng";
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

  // Icons
  const UserIcon = () => (
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );

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

  const PhoneIcon = () => (
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
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );

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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ErrorAlert message={error} />

      <InputField
        id="username"
        name="username"
        type="text"
        label="Tên đăng nhập *"
        value={formData.username}
        onChange={handleChange}
        placeholder="Nhập tên đăng nhập"
        required
        autoComplete="username"
        icon={<UserIcon />}
      />
      {validationErrors.username && (
        <p className="text-red-500 text-xs -mt-3">{validationErrors.username}</p>
      )}

      <InputField
        id="email"
        name="email"
        type="email"
        label="Email *"
        value={formData.email}
        onChange={handleChange}
        placeholder="example@email.com"
        required
        autoComplete="email"
        icon={<EmailIcon />}
      />
      {validationErrors.email && (
        <p className="text-red-500 text-xs -mt-3">{validationErrors.email}</p>
      )}

      <InputField
        id="phone"
        name="phone"
        type="tel"
        label="Số điện thoại"
        value={formData.phone}
        onChange={handleChange}
        placeholder="0123456789"
        autoComplete="tel"
        icon={<PhoneIcon />}
      />
      {validationErrors.phone && (
        <p className="text-red-500 text-xs -mt-3">{validationErrors.phone}</p>
      )}

      <InputField
        id="password"
        name="password"
        type="password"
        label="Mật khẩu *"
        value={formData.password}
        onChange={handleChange}
        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
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
        label="Xác nhận mật khẩu *"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Nhập lại mật khẩu"
        required
        autoComplete="new-password"
        icon={<LockIcon />}
      />
      {validationErrors.confirmPassword && (
        <p className="text-red-500 text-xs -mt-3">{validationErrors.confirmPassword}</p>
      )}

      {/* Agree Terms */}
      <div className="flex items-start">
        <input
          id="agree-terms"
          name="agreeTerms"
          type="checkbox"
          checked={formData.agreeTerms}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
        />
        <label
          htmlFor="agree-terms"
          className="ml-2 block text-sm text-gray-700"
        >
          Tôi đồng ý với{" "}
          <a href="#" className="text-green-600 hover:text-green-700 font-medium">
            điều khoản sử dụng
          </a>{" "}
          và{" "}
          <a href="#" className="text-green-600 hover:text-green-700 font-medium">
            chính sách bảo mật
          </a>
          *
        </label>
      </div>
      {validationErrors.agreeTerms && (
        <p className="text-red-500 text-xs -mt-3">{validationErrors.agreeTerms}</p>
      )}

      <LoadingButton type="submit" isLoading={isLoading}>
        Đăng ký
      </LoadingButton>

      {/* Link to Login */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Đã có tài khoản?{" "}
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


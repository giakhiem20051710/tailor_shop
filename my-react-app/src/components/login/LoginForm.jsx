import { useState } from "react";
import { Link } from "react-router-dom";
import InputField from "../common/InputField.jsx";
import ErrorAlert from "../common/ErrorAlert.jsx";
import LoadingButton from "../common/LoadingButton.jsx";

export default function LoginForm({ onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorAlert message={error} />

      <InputField
        id="username"
        name="username"
        type="text"
        label="Tên đăng nhập"
        value={formData.username}
        onChange={handleChange}
        placeholder="Nhập tên đăng nhập"
        required
        autoComplete="username"
        icon={<UserIcon />}
      />

      <InputField
        id="password"
        name="password"
        type="password"
        label="Mật khẩu"
        value={formData.password}
        onChange={handleChange}
        placeholder="Nhập mật khẩu"
        required
        autoComplete="current-password"
        icon={<LockIcon />}
      />

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-gray-700"
          >
            Ghi nhớ đăng nhập
          </label>
        </div>
        <div className="text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-green-600 hover:text-green-700 transition"
          >
            Quên mật khẩu?
          </Link>
        </div>
      </div>

      <LoadingButton type="submit" isLoading={isLoading}>
        Đăng nhập
      </LoadingButton>

      {/* Link to Register */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-medium text-green-600 hover:text-green-700 transition"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </form>
  );
}


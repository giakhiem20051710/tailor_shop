import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RegisterHeader from "../components/register/RegisterHeader.jsx";
import RegisterForm from "../components/register/RegisterForm.jsx";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // No authentication check - users can access this page freely

  const handleSubmit = async (formData) => {
    setError("");

    setIsLoading(true);

    // Simulate API call for registration
    setTimeout(() => {
      // Check if username already exists (demo - in production, check from API)
      const existingUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      const usernameExists = existingUsers.some(
        (user) => user.username === formData.username
      );
      const emailExists = existingUsers.some(
        (user) => user.email === formData.email
      );

      if (usernameExists) {
        setError("Tên đăng nhập đã được sử dụng");
        setIsLoading(false);
        return;
      }

      if (emailExists) {
        setError("Email đã được sử dụng");
        setIsLoading(false);
        return;
      }

      // Save new user to localStorage (demo)
      const newUser = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password, // In production, this should be hashed
        createdAt: new Date().toISOString(),
      };

      existingUsers.push(newUser);
      localStorage.setItem("registeredUsers", JSON.stringify(existingUsers));

      // Auto login after registration
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", formData.username);

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
      setIsLoading(false);
    }, 1500);
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


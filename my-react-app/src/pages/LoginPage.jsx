import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginHeader from "../components/login/LoginHeader.jsx";
import LoginForm from "../components/login/LoginForm.jsx";
import LoginFooter from "../components/login/LoginFooter.jsx";
import { getUsersByRole, initializeDefaultUsers, ROLES } from "../utils/authStorage.js";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize default users on mount
  useEffect(() => {
    initializeDefaultUsers();
  }, []);

  // No authentication check - users can access this page freely

  // Check for success message from reset password
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (formData) => {
    setError("");

    // Validation
    if (!formData.username || !formData.password) {
      setError("Vui lòng nhập đầy đủ thông tin đăng nhập");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      let foundUser = null;
      let userRole = null;

      // First, check registered users (legacy)
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      foundUser = registeredUsers.find(
        (u) => u.username === formData.username && u.password === formData.password
      );

      // If not found, check role-based users (admin, staff, tailor, customer)
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
        // If found in registeredUsers, try to determine role from user data
        userRole = foundUser.role || null;
      }

      // Demo: Also accept any credentials for demo purposes (but try to determine role)
      if (foundUser || (formData.username && formData.password)) {
        // If user found, use their data; otherwise create a basic user object
        const userData = foundUser || {
          username: formData.username,
          role: userRole || ROLES.STAFF, // Default to staff if role not found
          name: formData.username,
        };

        // Store authentication info - ensure role is normalized
        const normalizedRole = userData.role ? userData.role.toLowerCase() : userData.role;
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", normalizedRole);
        localStorage.setItem("username", userData.username);
        localStorage.setItem("userData", JSON.stringify(userData));

        // Debug log
        console.log("Login successful:", {
          username: userData.username,
          role: normalizedRole,
          userData: userData
        });

        // Navigate to appropriate dashboard based on role
        const dashboardRoutes = {
          [ROLES.ADMIN]: "/dashboard",
          [ROLES.STAFF]: "/dashboard",
          [ROLES.TAILOR]: "/tailor/dashboard",
          [ROLES.CUSTOMER]: "/customer/dashboard",
        };
        const targetRoute = dashboardRoutes[userData.role] || dashboardRoutes[normalizedRole] || "/dashboard";
        console.log("Navigating to:", targetRoute);
        navigate(targetRoute, { replace: true });
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không đúng");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginHeader />

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
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
                <p>{success}</p>
              </div>
            </div>
          )}
          <LoginForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
            error={error}
          />
        </div>

        <LoginFooter />
      </div>
    </div>
  );
}


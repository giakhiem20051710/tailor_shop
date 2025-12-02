import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import LoginForm from "../components/login/LoginForm.jsx";
import { authenticateUser, initializeDefaultUsers, ROLES } from "../utils/authStorage.js";

export default function RoleBasedLoginPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize default users on mount
  useEffect(() => {
    initializeDefaultUsers();
  }, []);

  // Helper functions - defined outside to avoid recreating on each render
  const getDashboardRoute = (userRole) => {
    const routes = {
      admin: "/dashboard",
      staff: "/dashboard",
      tailor: "/tailor/dashboard",
      customer: "/customer/dashboard",
    };
    return routes[userRole] || "/dashboard";
  };

  const normalizeRole = () => {
    const roleFromUrl = (role || "").toLowerCase();
    const allowedRoles = Object.values(ROLES);
    if (allowedRoles.includes(roleFromUrl)) {
      return roleFromUrl;
    }
    return ROLES.CUSTOMER;
  };

  const effectiveRole = normalizeRole();

  const getRoleInfo = (currentRole) => {
    const roleInfo = {
      admin: {
        title: "Quản trị viên",
        icon: "🔐",
        description: "Đăng nhập với tài khoản quản trị",
        bgColor: "from-red-50 via-white to-red-50",
        headerColor: "bg-red-900",
      },
      staff: {
        title: "Nhân viên",
        icon: "👔",
        description: "Đăng nhập với tài khoản nhân viên",
        bgColor: "from-blue-50 via-white to-blue-50",
        headerColor: "bg-blue-900",
      },
      tailor: {
        title: "Thợ may",
        icon: "✂️",
        description: "Đăng nhập với tài khoản thợ may",
        bgColor: "from-purple-50 via-white to-purple-50",
        headerColor: "bg-purple-900",
      },
      customer: {
        title: "Khách hàng",
        icon: "👤",
        description: "Đăng nhập với tài khoản khách hàng",
        bgColor: "from-green-50 via-white to-green-50",
        headerColor: "bg-green-900",
      },
    };
    return roleInfo[currentRole] || roleInfo.customer;
  };

  // No authentication check - users can access this page freely

  const handleSubmit = async (formData) => {
    setError("");

    if (!formData.username || !formData.password) {
      setError("Vui lòng nhập đầy đủ thông tin đăng nhập");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const user = authenticateUser(effectiveRole, formData.username, formData.password);

      if (user) {
        const finalRole = (user.role || effectiveRole || ROLES.CUSTOMER).toLowerCase();
        navigate(getDashboardRoute(finalRole), { replace: true });
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không đúng");
      }
      setIsLoading(false);
    }, 1000);
  };

  const roleInfo = getRoleInfo(effectiveRole);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${roleInfo.bgColor} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-block ${roleInfo.headerColor} p-4 rounded-2xl mb-4`}>
            <span className="text-4xl">{roleInfo.icon}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {roleInfo.title}
          </h1>
          <p className="text-gray-600">{roleInfo.description}</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <LoginForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
            error={error}
          />
        </div>

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-600 hover:text-gray-800 transition"
          >
            ← Quay lại chọn loại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}


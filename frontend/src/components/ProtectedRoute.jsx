import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { isAuthenticated, getCurrentUserRole, getCurrentUser } from "../utils/authStorage";

export default function ProtectedRoute({ requiredRole = null }) {
  const location = useLocation();
  const authenticated = isAuthenticated();
  let userRole = getCurrentUserRole();
  const currentUser = getCurrentUser();

  // If role is missing but userData exists, try to recover role from userData
  if (!userRole && currentUser) {
    const rawRole =
      currentUser.roleCode ||
      (currentUser.role && currentUser.role.code) ||
      currentUser.role ||
      null;
    if (rawRole) {
      const normalizedRole = String(rawRole).toLowerCase();
      localStorage.setItem("userRole", normalizedRole);
      userRole = normalizedRole;
    }
  }

  // Normalize roles for comparison
  const normalizedUserRole = userRole ? userRole.toLowerCase() : userRole;
  const normalizedRequiredRole = requiredRole ? requiredRole.toLowerCase() : requiredRole;

  // If not authenticated, redirect to login selection
  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  // If required role is specified, check if user has that role
  // Admin can access all pages
  if (requiredRole && normalizedUserRole !== normalizedRequiredRole && normalizedUserRole !== "admin") {
    // Get the appropriate dashboard route based on user's role
    const getDashboardRoute = () => {
      const routes = {
        admin: "/dashboard",
        staff: "/dashboard",
        tailor: "/tailor/dashboard",
        customer: "/customer-home",
      };
      return routes[normalizedUserRole] || "/customer-home";
    };

    // Get role display name
    const getRoleDisplayName = () => {
      if (!normalizedUserRole) {
        return "Chưa xác định";
      }
      const roleNames = {
        admin: "Quản trị viên",
        staff: "Nhân viên",
        tailor: "Thợ may",
        customer: "Khách hàng",
      };
      return roleNames[normalizedUserRole] || normalizedUserRole;
    };

    const getRequiredRoleDisplayName = () => {
      const roleNames = {
        admin: "Quản trị viên",
        staff: "Nhân viên",
        tailor: "Thợ may",
        customer: "Khách hàng",
      };
      return roleNames[requiredRole] || requiredRole;
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 mb-4">
            Bạn không có quyền truy cập trang này với vai trò hiện tại.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
            <p className="text-gray-700 mb-1">
              <span className="font-semibold">Vai trò hiện tại:</span> {getRoleDisplayName()}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Vai trò yêu cầu:</span> {getRequiredRoleDisplayName()}
            </p>
            {currentUser?.username && (
              <p className="text-gray-500 mt-2 text-xs">
                Tài khoản: {currentUser.username}
              </p>
            )}
          </div>
          <Link
            to={getDashboardRoute()}
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // If authenticated and role matches (or no role required), render the child routes
  return <Outlet />;
}

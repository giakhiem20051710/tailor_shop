/**
 * RoleGuard Component
 * Protects routes based on user roles
 * Redirects unauthorized users to login or shows access denied
 */

import { Navigate } from "react-router-dom";
import { isAuthenticated, getCurrentUserRole, ROLES } from "../utils/authStorage";

/**
 * RoleGuard - Wrapper component for role-based access control
 * @param {React.ReactNode} children - The protected content
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['admin', 'staff'])
 * @param {string} redirectTo - Where to redirect if not authenticated
 * @param {boolean} showAccessDenied - Show access denied page instead of redirect
 */
export default function RoleGuard({
    children,
    allowedRoles = [],
    redirectTo = "/login",
    showAccessDenied = true
}) {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        return <Navigate to={redirectTo} replace />;
    }

    // Get current user role
    const currentRole = getCurrentUserRole();

    // Check if user has required role
    const hasAccess = allowedRoles.length === 0 ||
        allowedRoles.some(role => role.toLowerCase() === currentRole?.toLowerCase());

    if (!hasAccess) {
        if (showAccessDenied) {
            return <AccessDeniedPage />;
        }
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}

/**
 * Access Denied Page Component
 */
function AccessDeniedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Truy cập bị từ chối
                </h1>
                <p className="text-gray-600 mb-6">
                    Bạn không có quyền truy cập trang này.
                    Vui lòng đăng nhập bằng tài khoản có quyền phù hợp.
                </p>
                <div className="space-y-3">
                    <a
                        href="/login"
                        className="block w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                        Đăng nhập
                    </a>
                    <a
                        href="/"
                        className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                        Về trang chủ
                    </a>
                </div>
            </div>
        </div>
    );
}

/**
 * Helper: Create a role-protected version of a component
 */
export function withRoleGuard(Component, allowedRoles) {
    return function ProtectedComponent(props) {
        return (
            <RoleGuard allowedRoles={allowedRoles}>
                <Component {...props} />
            </RoleGuard>
        );
    };
}

/**
 * Pre-defined guards for common role combinations
 */
export const AdminOnly = ({ children }) => (
    <RoleGuard allowedRoles={[ROLES.ADMIN]}>{children}</RoleGuard>
);

export const StaffAndAdmin = ({ children }) => (
    <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>{children}</RoleGuard>
);

export const TailorAndAbove = ({ children }) => (
    <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.STAFF, ROLES.TAILOR]}>{children}</RoleGuard>
);

export const AuthenticatedOnly = ({ children }) => (
    <RoleGuard allowedRoles={[]}>{children}</RoleGuard>
);

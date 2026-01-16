import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../services';

/**
 * Check if user is authenticated and has the right role
 */
const checkAuth = () => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const role = localStorage.getItem('userRole')?.toLowerCase() || '';
    const allowedRoles = ['admin', 'staff', 'tailor'];
    const hasAccess = isAuth && allowedRoles.includes(role);
    return { isAuth, hasAccess, role };
};

/**
 * Tailor Layout - Dedicated layout for tailors with custom sidebar
 * Completely separate from the admin/staff layout
 */
const TailorLayout = () => {
    // All hooks MUST be called at top level, before any returns
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const data = localStorage.getItem('userData');
        if (data) {
            try {
                setUserData(JSON.parse(data));
            } catch (e) {
                console.error('Failed to parse userData', e);
            }
        }
    }, []);

    // Check authorization AFTER hooks
    const { isAuth, hasAccess } = checkAuth();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/tailor/dashboard', label: 'Công việc', icon: '📋' },
        { path: '/tailor/schedule', label: 'Lịch hẹn', icon: '📅' },
        { path: '/profile', label: 'Hồ sơ', icon: '👤' },
    ];

    // Conditional returns AFTER all hooks
    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Truy cập bị từ chối</h1>
                    <p className="text-gray-500 mb-4">Bạn không có quyền truy cập khu vực thợ may</p>
                    <a href="/login" className="text-emerald-600 hover:underline">Đăng nhập</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Logo/Header */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                            🧵
                        </div>
                        {!sidebarCollapsed && (
                            <div>
                                <h1 className="font-bold text-white text-sm">THỢ MAY</h1>
                                <p className="text-xs text-slate-400">My Hiền Tailor</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* User Info */}
                {userData && (
                    <div className={`p-4 border-b border-slate-700/50 ${sidebarCollapsed ? 'text-center' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                                {userData.name?.[0]?.toUpperCase() || '👤'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{userData.name || 'Thợ may'}</p>
                                    <p className="text-xs text-slate-400 truncate">{userData.phone || ''}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                } ${sidebarCollapsed ? 'justify-center' : ''}`
                            }
                        >
                            <span className="text-lg">{item.icon}</span>
                            {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Toggle & Logout */}
                <div className="p-3 border-t border-slate-700/50 space-y-2">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                    >
                        {sidebarCollapsed ? '→' : '←'}
                        {!sidebarCollapsed && <span className="text-sm">Thu gọn</span>}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all"
                    >
                        <span>🚪</span>
                        {!sidebarCollapsed && <span className="text-sm">Đăng xuất</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <p className="text-sm text-gray-500">
                            Xin chào, <span className="font-medium text-gray-900">{userData?.name || 'Thợ may'}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">
                            {new Date().toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default TailorLayout;

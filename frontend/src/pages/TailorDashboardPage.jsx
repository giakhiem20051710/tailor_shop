import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import tailorService from '../services/tailorService';

/**
 * Tailor Dashboard Page - Professional Minimalist Design
 * Allows tailors to view and manage their assigned orders
 */
const TailorDashboardPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        unassigned: 0,
        inProgress: 0,
        fitting: 0,
        completed: 0
    });
    const [activeTab, setActiveTab] = useState('IN_PROGRESS');
    const [pagination, setPagination] = useState({ page: 0, totalPages: 0 });
    const [accepting, setAccepting] = useState(null);

    // Fetch statistics
    const fetchStats = useCallback(async () => {
        try {
            const response = await tailorService.getStats();
            const data = response?.responseData || response;
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, []);

    // Fetch orders based on active tab
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            if (activeTab === 'UNASSIGNED') {
                response = await tailorService.getUnassignedOrders({ page: pagination.page, size: 20 });
            } else {
                response = await tailorService.getMyOrders({
                    status: activeTab,
                    page: pagination.page,
                    size: 20
                });
            }

            const data = response?.responseData || response;
            const orderList = data?.content || data || [];
            setOrders(Array.isArray(orderList) ? orderList : []);
            setPagination(prev => ({
                ...prev,
                totalPages: data?.totalPages || 0
            }));
        } catch (err) {
            console.error('Error fetching orders:', err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab, pagination.page]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Handle accept order
    const handleAcceptOrder = async (orderId) => {
        if (accepting) return;
        setAccepting(orderId);
        try {
            await tailorService.acceptOrder(orderId);
            fetchStats();
            fetchOrders();
        } catch (err) {
            console.error('Error accepting order:', err);
            alert(err.response?.data?.message || 'Không thể nhận đơn hàng');
        } finally {
            setAccepting(null);
        }
    };

    // Status configurations
    const statusConfig = {
        CONFIRMED: { label: 'Chờ nhận', class: 'bg-amber-50 text-amber-700 border border-amber-200' },
        IN_PROGRESS: { label: 'Đang làm', class: 'bg-blue-50 text-blue-700 border border-blue-200' },
        FITTING: { label: 'Thử đồ', class: 'bg-purple-50 text-purple-700 border border-purple-200' },
        COMPLETED: { label: 'Hoàn thành', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
    };

    const getStatusConfig = (status) => statusConfig[status] || statusConfig.CONFIRMED;

    // Tab configuration
    const tabs = [
        { id: 'UNASSIGNED', label: 'Chờ nhận', count: stats.unassigned },
        { id: 'IN_PROGRESS', label: 'Đang làm', count: stats.inProgress },
        { id: 'FITTING', label: 'Thử đồ', count: stats.fitting },
        { id: 'COMPLETED', label: 'Hoàn thành', count: stats.completed }
    ];

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    // Check if due date is urgent (within 3 days)
    const isUrgent = (dueDate) => {
        if (!dueDate) return false;
        const due = new Date(dueDate);
        const now = new Date();
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                        Công việc của tôi
                    </h1>
                    <p className="text-gray-500 mt-1">Quản lý và theo dõi các đơn hàng may đo</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div
                        className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${activeTab === 'UNASSIGNED' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-100'}`}
                        onClick={() => setActiveTab('UNASSIGNED')}
                    >
                        <p className="text-sm font-medium text-gray-500 mb-1">Chờ nhận</p>
                        <p className="text-2xl font-semibold text-amber-600">{stats.unassigned}</p>
                    </div>
                    <div
                        className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${activeTab === 'IN_PROGRESS' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'}`}
                        onClick={() => setActiveTab('IN_PROGRESS')}
                    >
                        <p className="text-sm font-medium text-gray-500 mb-1">Đang làm</p>
                        <p className="text-2xl font-semibold text-blue-600">{stats.inProgress}</p>
                    </div>
                    <div
                        className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${activeTab === 'FITTING' ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-100'}`}
                        onClick={() => setActiveTab('FITTING')}
                    >
                        <p className="text-sm font-medium text-gray-500 mb-1">Thử đồ</p>
                        <p className="text-2xl font-semibold text-purple-600">{stats.fitting}</p>
                    </div>
                    <div
                        className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${activeTab === 'COMPLETED' ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-gray-100'}`}
                        onClick={() => setActiveTab('COMPLETED')}
                    >
                        <p className="text-sm font-medium text-gray-500 mb-1">Hoàn thành</p>
                        <p className="text-2xl font-semibold text-emerald-600">{stats.completed}</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-100 p-1 bg-gray-50/50">
                        <div className="flex flex-wrap gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setPagination(prev => ({ ...prev, page: 0 }));
                                    }}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === tab.id
                                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.id
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mb-2"></div>
                                <p className="text-gray-500 text-sm">Đang tải...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-gray-900 font-medium mb-1">
                                    {activeTab === 'UNASSIGNED'
                                        ? 'Không có đơn hàng chờ nhận'
                                        : 'Không có đơn hàng nào'}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    {activeTab === 'UNASSIGNED'
                                        ? 'Các đơn hàng mới sẽ hiển thị ở đây'
                                        : 'Chọn tab khác để xem đơn hàng'}
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                        <th className="px-6 py-4">Mã đơn / Khách hàng</th>
                                        <th className="px-6 py-4">Ngày hẹn giao</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map((order) => {
                                        const config = getStatusConfig(order.status);
                                        const urgent = isUrgent(order.dueDate);

                                        return (
                                            <tr key={order.id} className="group hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{order.code}</p>
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                            {order.customerName || 'Khách hàng'}
                                                            {order.customerPhone && ` • ${order.customerPhone}`}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={urgent ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                                            {formatDate(order.dueDate)}
                                                        </span>
                                                        {urgent && (
                                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded">
                                                                GẤP
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${config.class}`}>
                                                        {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {activeTab === 'UNASSIGNED' ? (
                                                            <button
                                                                onClick={() => handleAcceptOrder(order.id)}
                                                                disabled={accepting === order.id}
                                                                className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black disabled:opacity-50 transition-colors"
                                                            >
                                                                {accepting === order.id ? 'Đang xử lý...' : 'Nhận đơn'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => navigate(`/tailor/orders/${order.id}`)}
                                                                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                                            >
                                                                Chi tiết
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 0}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trang trước
                            </button>
                            <span className="text-sm text-gray-500">
                                Trang {pagination.page + 1} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages - 1}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trang sau
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TailorDashboardPage;

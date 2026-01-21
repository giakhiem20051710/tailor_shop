import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tailorService from '../services/tailorService';

/**
 * Tailor Order Detail Page
 * Allows tailors to view order details and update status
 */
const TailorOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusNote, setStatusNote] = useState('');
    const [targetStatus, setTargetStatus] = useState(null);

    // Fetch order detail
    const fetchOrder = useCallback(async () => {
        setLoading(true);
        try {
            const response = await tailorService.getOrderDetail(id);
            const data = response?.responseData || response;
            setOrder(data);
        } catch (err) {
            console.error('Error fetching order:', err);
            alert(err.response?.data?.message || 'Không thể tải đơn hàng');
            navigate('/tailor/dashboard');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    // Handle status update
    const handleUpdateStatus = async () => {
        if (!targetStatus) return;
        setUpdating(true);
        try {
            await tailorService.updateOrderStatus(id, targetStatus, statusNote || null);
            setShowStatusModal(false);
            setStatusNote('');
            setTargetStatus(null);
            fetchOrder();
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.response?.data?.message || 'Không thể cập nhật trạng thái');
        } finally {
            setUpdating(false);
        }
    };

    // Open status modal
    const openStatusModal = (status) => {
        setTargetStatus(status);
        setStatusNote('');
        setShowStatusModal(true);
    };

    // Status configurations
    const statusConfig = {
        CONFIRMED: { label: 'Chờ nhận', class: 'bg-amber-50 text-amber-700 border border-amber-200' },
        IN_PROGRESS: { label: 'Đang làm', class: 'bg-blue-50 text-blue-700 border border-blue-200' },
        FITTING: { label: 'Thử đồ', class: 'bg-purple-50 text-purple-700 border border-purple-200' },
        COMPLETED: { label: 'Hoàn thành', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
    };

    const getStatusConfig = (status) => statusConfig[status] || statusConfig.CONFIRMED;

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    // Get available next statuses
    const getNextStatuses = (currentStatus) => {
        switch (currentStatus) {
            case 'IN_PROGRESS':
                return [{ status: 'FITTING', label: 'Hoàn thành may → Thử đồ', color: 'purple' }];
            case 'FITTING':
                return [
                    { status: 'COMPLETED', label: 'Khách duyệt → Hoàn thành', color: 'emerald' },
                    { status: 'IN_PROGRESS', label: 'Cần sửa → Tiếp tục may', color: 'blue' }
                ];
            default:
                return [];
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mb-2"></div>
                    <p className="text-gray-500">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <p className="text-gray-500">Không tìm thấy đơn hàng</p>
            </div>
        );
    }

    const config = getStatusConfig(order.status);
    const nextStatuses = getNextStatuses(order.status);

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/tailor/dashboard')}
                        className="text-gray-500 hover:text-gray-900 text-sm mb-4 inline-flex items-center gap-1"
                    >
                        ← Quay lại
                    </button>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{order.code}</h1>
                            <p className="text-gray-500 mt-1">Tạo ngày {formatDateTime(order.createdAt)}</p>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold ${config.class}`}>
                            {config.label}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                {nextStatuses.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">Cập nhật trạng thái:</p>
                        <div className="flex flex-wrap gap-3">
                            {nextStatuses.map((next) => (
                                <button
                                    key={next.status}
                                    onClick={() => openStatusModal(next.status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${next.color === 'emerald'
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : next.color === 'purple'
                                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {next.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Customer Info */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                        Thông tin khách hàng
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Tên khách hàng</p>
                            <p className="font-medium text-gray-900">{order.customerName || '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Số điện thoại</p>
                            <p className="font-medium text-gray-900">{order.customerPhone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ngày hẹn giao</p>
                            <p className="font-medium text-gray-900">{formatDate(order.dueDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ngày hẹn thử</p>
                            <p className="font-medium text-gray-900">{formatDate(order.appointmentDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Measurements */}
                {order.measurement && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                            Số đo khách hàng (cm)
                        </h2>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                            {order.measurement.chest && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Ngực</p>
                                    <p className="text-lg font-semibold text-gray-900">{order.measurement.chest}</p>
                                </div>
                            )}
                            {order.measurement.waist && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Eo</p>
                                    <p className="text-lg font-semibold text-gray-900">{order.measurement.waist}</p>
                                </div>
                            )}
                            {order.measurement.hips && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Hông</p>
                                    <p className="text-lg font-semibold text-gray-900">{order.measurement.hips}</p>
                                </div>
                            )}
                            {order.measurement.shoulder && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Vai</p>
                                    <p className="text-lg font-semibold text-gray-900">{order.measurement.shoulder}</p>
                                </div>
                            )}
                            {order.measurement.armLength && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Dài tay</p>
                                    <p className="text-lg font-semibold text-gray-900">{order.measurement.armLength}</p>
                                </div>
                            )}
                            {order.measurement.inseam && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Dài chân</p>
                                    <p className="text-lg font-semibold text-gray-900">{order.measurement.inseam}</p>
                                </div>
                            )}
                            {order.measurement.neck && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Cổ</p>
                                    <p className="text-lg font-semibold text-gray-900">{order.measurement.neck}</p>
                                </div>
                            )}
                            {order.measurement.height && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Chiều cao</p>
                                    <p className="text-lg font-semibold text-gray-900">{order.measurement.height}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                            Sản phẩm đặt may
                        </h2>
                        <div className="space-y-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                        {item.productImage ? (
                                            <img src={item.productImage} alt="" className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <span className="text-2xl">👔</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.productName || 'Sản phẩm'}</p>
                                        {item.styleName && (
                                            <p className="text-sm text-gray-500">Kiểu: {item.styleName}</p>
                                        )}
                                        {item.fabricName && (
                                            <p className="text-sm text-gray-500">Vải: {item.fabricName}</p>
                                        )}
                                        <p className="text-sm text-gray-500">Số lượng: {item.quantity || 1}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">
                                            {item.price?.toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {order.note && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                            Ghi chú
                        </h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{order.note}</p>
                    </div>
                )}

                {/* Attachments */}
                {order.attachments && order.attachments.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                            Hình ảnh tham khảo
                        </h2>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                            {order.attachments.map((att, idx) => (
                                <a
                                    key={idx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                                >
                                    <img
                                        src={att.url}
                                        alt={att.fileName || 'Attachment'}
                                        className="w-full h-full object-cover"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                {order.timeline && order.timeline.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                            Lịch sử cập nhật
                        </h2>
                        <div className="space-y-4">
                            {order.timeline.map((entry, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{entry.note}</p>
                                        <p className="text-xs text-gray-500">{formatDateTime(entry.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}></div>
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Cập nhật trạng thái</h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Chuyển sang: <span className="font-medium">{statusConfig[targetStatus]?.label}</span>
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ghi chú (tùy chọn)
                            </label>
                            <textarea
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                                rows={3}
                                placeholder="VD: Đã hoàn thành may áo vest, chờ khách đến thử..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:outline-none resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={updating}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black disabled:opacity-50"
                            >
                                {updating ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TailorOrderDetailPage;

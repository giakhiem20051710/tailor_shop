import React, { useState, useEffect, useCallback } from 'react';
import flashSaleService from '../services/flashSaleService';
import fabricService from '../services/fabricService';

/**
 * Flash Sale Management Page - Premium Admin View
 * Features: Modern UI, Statistics, Status management
 */
const FlashSaleManagementPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 0, totalPages: 0 });
    const [statusFilter, setStatusFilter] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [fabrics, setFabrics] = useState([]);
    const [formData, setFormData] = useState({
        fabricId: '',
        name: '',
        description: '',
        flashPrice: '',
        totalQuantity: '',
        maxPerUser: '5',
        minPurchase: '0.5',
        startTime: '',
        endTime: '',
        priority: '0',
        isFeatured: false
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Statistics
    const [stats, setStats] = useState({
        active: 0,
        scheduled: 0,
        ended: 0,
        totalSold: 0
    });

    // Fetch flash sales
    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                size: 20
            };
            if (statusFilter) {
                params.statuses = [statusFilter];
            }

            const response = await flashSaleService.listAll(params);

            // Parse CommonResponse structure
            const responseData = response?.responseData || response?.data || response;
            const salesData = responseData?.content || responseData || [];

            setSales(Array.isArray(salesData) ? salesData : []);
            setPagination(prev => ({
                ...prev,
                totalPages: responseData?.totalPages || 0
            }));

            // Calculate stats
            const allSales = Array.isArray(salesData) ? salesData : [];
            setStats({
                active: allSales.filter(s => s.status === 'ACTIVE').length,
                scheduled: allSales.filter(s => s.status === 'SCHEDULED').length,
                ended: allSales.filter(s => s.status === 'ENDED' || s.status === 'SOLD_OUT').length,
                totalSold: allSales.reduce((sum, s) => sum + (s.totalOrders || 0), 0)
            });
        } catch (err) {
            console.error('Error fetching flash sales:', err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, statusFilter]);

    // Fetch fabrics for dropdown
    const fetchFabrics = useCallback(async () => {
        try {
            const response = await fabricService.list({ page: 0, size: 100 });
            const fabricList = response?.responseData?.content ||
                response?.data?.content ||
                response?.content ||
                response?.data ||
                [];
            setFabrics(fabricList);
        } catch (err) {
            console.error('Error fetching fabrics:', err);
        }
    }, []);

    useEffect(() => {
        fetchSales();
        fetchFabrics();
    }, [fetchSales, fetchFabrics]);

    // Open create modal
    const handleCreate = () => {
        setEditingSale(null);
        setFormData({
            fabricId: '',
            name: '',
            description: '',
            flashPrice: '',
            totalQuantity: '',
            maxPerUser: '5',
            minPurchase: '0.5',
            startTime: '',
            endTime: '',
            priority: '0',
            isFeatured: false
        });
        setFormError('');
        setShowModal(true);
    };

    // Open edit modal
    const handleEdit = (sale) => {
        setEditingSale(sale);
        setFormData({
            fabricId: sale.fabricId?.toString() || '',
            name: sale.name || '',
            description: sale.description || '',
            flashPrice: sale.flashPrice?.toString() || '',
            totalQuantity: sale.totalQuantity?.toString() || '',
            maxPerUser: sale.maxPerUser?.toString() || '5',
            minPurchase: sale.minPurchase?.toString() || '0.5',
            startTime: formatDateTimeLocal(sale.startTime),
            endTime: formatDateTimeLocal(sale.endTime),
            priority: sale.priority?.toString() || '0',
            isFeatured: sale.isFeatured || false
        });
        setFormError('');
        setShowModal(true);
    };

    // Format datetime for input
    const formatDateTimeLocal = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        try {
            // Validate required fields
            if (!formData.fabricId) throw new Error('Vui lòng chọn vải');
            if (!formData.name?.trim()) throw new Error('Vui lòng nhập tên flash sale');
            if (!formData.flashPrice || parseFloat(formData.flashPrice) <= 0) throw new Error('Vui lòng nhập giá hợp lệ');
            if (!formData.totalQuantity || parseFloat(formData.totalQuantity) <= 0) throw new Error('Vui lòng nhập số lượng hợp lệ');
            if (!formData.startTime) throw new Error('Vui lòng chọn thời gian bắt đầu');
            if (!formData.endTime) throw new Error('Vui lòng chọn thời gian kết thúc');

            const startDate = new Date(formData.startTime);
            const endDate = new Date(formData.endTime);

            if (isNaN(startDate.getTime())) throw new Error('Thời gian bắt đầu không hợp lệ');
            if (isNaN(endDate.getTime())) throw new Error('Thời gian kết thúc không hợp lệ');
            if (endDate <= startDate) throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');

            const payload = {
                fabricId: parseInt(formData.fabricId),
                name: formData.name.trim(),
                description: formData.description?.trim() || '',
                flashPrice: parseFloat(formData.flashPrice),
                totalQuantity: parseFloat(formData.totalQuantity),
                maxPerUser: parseFloat(formData.maxPerUser) || 5,
                minPurchase: parseFloat(formData.minPurchase) || 0.5,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                priority: parseInt(formData.priority) || 0,
                isFeatured: formData.isFeatured || false
            };

            if (editingSale) {
                await flashSaleService.update(editingSale.id, payload);
            } else {
                await flashSaleService.create(payload);
            }

            setShowModal(false);
            fetchSales();
        } catch (err) {
            console.error('Save error:', err);
            setFormError(err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    // Handle cancel sale
    const handleCancel = async (sale) => {
        if (!window.confirm(`Bạn có chắc muốn hủy flash sale "${sale.name}"?`)) return;

        try {
            await flashSaleService.cancel(sale.id);
            fetchSales();
        } catch (err) {
            console.error('Cancel error:', err);
            alert(err.response?.data?.message || 'Không thể hủy flash sale');
        }
    };

    // Status configurations - Minimalist
    const statusConfig = {
        SCHEDULED: {
            label: 'Sắp diễn ra',
            class: 'bg-blue-50 text-blue-700 border border-blue-100'
        },
        ACTIVE: {
            label: 'Đang diễn ra',
            class: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        },
        ENDED: {
            label: 'Đã kết thúc',
            class: 'bg-gray-50 text-gray-600 border border-gray-200'
        },
        CANCELLED: {
            label: 'Đã hủy',
            class: 'bg-red-50 text-red-600 border border-red-100'
        },
        SOLD_OUT: {
            label: 'Hết hàng',
            class: 'bg-orange-50 text-orange-700 border border-orange-100'
        }
    };

    const getStatusConfig = (status) => statusConfig[status] || statusConfig.ENDED;

    // Filter tabs - Clean text
    const filterTabs = [
        { value: '', label: 'Tất cả' },
        { value: 'ACTIVE', label: 'Đang diễn ra' },
        { value: 'SCHEDULED', label: 'Sắp diễn ra' },
        { value: 'ENDED', label: 'Đã kết thúc' },
        { value: 'SOLD_OUT', label: 'Hết hàng' },
        { value: 'CANCELLED', label: 'Đã hủy' }
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Quản lý Flash Sale</h1>
                        <p className="text-gray-500 mt-1">Theo dõi và quản lý các chiến dịch khuyến mãi</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        + Tạo chiến dịch mới
                    </button>
                </div>

                {/* Statistics - Simple Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Đang diễn ra</p>
                        <p className="text-2xl font-semibold text-emerald-600">{stats.active}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Sắp diễn ra</p>
                        <p className="text-2xl font-semibold text-blue-600">{stats.scheduled}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Đã kết thúc</p>
                        <p className="text-2xl font-semibold text-gray-700">{stats.ended}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Đơn hàng</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.totalSold}</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Filters */}
                    <div className="border-b border-gray-100 p-1 bg-gray-50/50">
                        <div className="flex flex-wrap gap-1">
                            {filterTabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setStatusFilter(tab.value)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${statusFilter === tab.value
                                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mb-2"></div>
                                <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
                            </div>
                        ) : sales.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-gray-900 font-medium mb-1">Chưa có Flash Sale nào</p>
                                <p className="text-gray-500 text-sm">Bắt đầu bằng việc tạo một chiến dịch mới.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                        <th className="px-6 py-4 w-[40%]">Chiến dịch / Sản phẩm</th>
                                        <th className="px-6 py-4 w-[15%] text-right">Giá</th>
                                        <th className="px-6 py-4 w-[20%]">Thời gian</th>
                                        <th className="px-6 py-4 w-[15%]">Tiến độ</th>
                                        <th className="px-6 py-4 w-[10%] text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sales.map((sale) => {
                                        const config = getStatusConfig(sale.status);
                                        const soldPercent = sale.totalQuantity > 0
                                            ? Math.round((sale.soldQuantity / sale.totalQuantity) * 100)
                                            : 0;

                                        return (
                                            <tr key={sale.id} className="group hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex gap-4">
                                                        <img
                                                            src={sale.fabricImage || '/placeholder.jpg'}
                                                            alt=""
                                                            className="w-12 h-12 rounded bg-gray-100 object-cover border border-gray-100"
                                                            onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${config.class}`}>
                                                                    {config.label}
                                                                </span>
                                                                {sale.isFeatured && (
                                                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                                        FEATURED
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="font-medium text-gray-900">{sale.name}</p>
                                                            <p className="text-sm text-gray-500 mt-0.5">{sale.fabricName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top text-right">
                                                    <div>
                                                        <span className="block font-medium text-gray-900">
                                                            {sale.flashPrice?.toLocaleString('vi-VN')}đ
                                                        </span>
                                                        <span className="block text-xs text-gray-400 line-through mt-0.5">
                                                            {sale.originalPrice?.toLocaleString('vi-VN')}đ
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <p><span className="text-gray-400 w-8 inline-block">Từ:</span> {new Date(sale.startTime).toLocaleString('vi-VN')}</p>
                                                        <p><span className="text-gray-400 w-8 inline-block">Đến:</span> {new Date(sale.endTime).toLocaleString('vi-VN')}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="w-full max-w-[140px]">
                                                        <div className="flex justify-between text-xs mb-1.5">
                                                            <span className="text-gray-500">Đã bán {soldPercent}%</span>
                                                            <span className="text-gray-900 font-medium">{sale.soldQuantity}/{sale.totalQuantity}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gray-800 rounded-full"
                                                                style={{ width: `${soldPercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {(sale.status === 'SCHEDULED' || sale.status === 'ACTIVE') && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(sale)}
                                                                    className="text-gray-400 hover:text-blue-600 font-medium text-sm transition-colors"
                                                                >
                                                                    Sửa
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancel(sale)}
                                                                    className="text-gray-400 hover:text-red-600 font-medium text-sm transition-colors"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            </>
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
                </div>
            </div>

            {/* Modal - Minimalist */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingSale ? 'Cập nhật chiến dịch' : 'Tạo chiến dịch mới'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            {formError && (
                                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Section: Thông tin cơ bản */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Thông tin cơ bản</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sản phẩm áp dụng</label>
                                            <select
                                                value={formData.fabricId}
                                                onChange={(e) => setFormData({ ...formData, fabricId: e.target.value })}
                                                required
                                                disabled={!!editingSale}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors disabled:opacity-60"
                                            >
                                                <option value="">Chọn vải...</option>
                                                {fabrics.map((fabric) => (
                                                    <option key={fabric.id} value={fabric.id}>
                                                        {fabric.name} ({fabric.pricePerMeter?.toLocaleString('vi-VN')}đ)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên chiến dịch</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả (tùy chọn)</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-2"></div>

                                {/* Section: Thiết lập giá & Số lượng */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Giá & Số lượng</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá Flash Sale (đ)</label>
                                            <input
                                                type="number"
                                                value={formData.flashPrice}
                                                onChange={(e) => setFormData({ ...formData, flashPrice: e.target.value })}
                                                required
                                                min="1000"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tổng số lượng (m)</label>
                                            <input
                                                type="number"
                                                value={formData.totalQuantity}
                                                onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                                                required
                                                min="1"
                                                step="0.1"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Max/người (m)</label>
                                            <input
                                                type="number"
                                                value={formData.maxPerUser}
                                                onChange={(e) => setFormData({ ...formData, maxPerUser: e.target.value })}
                                                min="0.1"
                                                step="0.1"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Min/người (m)</label>
                                            <input
                                                type="number"
                                                value={formData.minPurchase}
                                                onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                                                min="0.1"
                                                step="0.1"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-2"></div>

                                {/* Section: Thời gian */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Thời gian áp dụng</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bắt đầu</label>
                                            <input
                                                type="datetime-local"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kết thúc</label>
                                            <input
                                                type="datetime-local"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="pt-2">
                                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.isFeatured}
                                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Đánh dấu là nổi bật (Featured)</span>
                                    </label>
                                </div>
                            </div>
                        </form>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-medium bg-gray-900 text-white hover:bg-black rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                {editingSale ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashSaleManagementPage;

import { useState, useEffect } from "react";
import { workingSlotService, userService } from "../../services";
import { showSuccess, showError } from "../NotificationToast";

export default function ScheduleSettingsModal({ onClose, tailors = [] }) {
    const [activeTab, setActiveTab] = useState("hours"); // hours, bulk, close
    const [loading, setLoading] = useState(false);

    // Common State
    const [selectedStaffId, setSelectedStaffId] = useState(tailors.length > 0 ? tailors[0].id : "");

    // Tab 1: Working Hours State
    const [workingHours, setWorkingHours] = useState(null);

    // Tab 2: Bulk Create State
    const [bulkForm, setBulkForm] = useState({
        daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        startTime: "08:00",
        endTime: "17:00",
        breakStartTime: "12:00",
        breakEndTime: "13:00",
        capacity: 1,
        isActive: true,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] // Default 1 year
    });

    // Tab 3: Close Dates State
    const [closeForm, setCloseForm] = useState({
        type: "single", // single, range
        date: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: "Nghỉ phép",
    });

    const daysOptions = [
        { value: "MONDAY", label: "Thứ 2" },
        { value: "TUESDAY", label: "Thứ 3" },
        { value: "WEDNESDAY", label: "Thứ 4" },
        { value: "THURSDAY", label: "Thứ 5" },
        { value: "FRIDAY", label: "Thứ 6" },
        { value: "SATURDAY", label: "Thứ 7" },
        { value: "SUNDAY", label: "Chủ nhật" },
    ];

    // --- TAB 1: WORKING HOURS LOGIC ---
    const fetchWorkingHours = async () => {
        if (!selectedStaffId) return;
        setLoading(true);
        try {
            const response = await workingSlotService.getHours(selectedStaffId);
            const data = response?.data ?? response?.responseData ?? response;
            setWorkingHours(data);
        } catch (error) {
            console.error("Error fetching working hours:", error);
            showError("Không thể tải lịch làm việc");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "hours" && selectedStaffId) {
            fetchWorkingHours();
        }
    }, [activeTab, selectedStaffId]);

    const handleResetDefaults = async () => {
        if (!window.confirm("Bạn có chắc muốn đặt lại về giờ mặc định (7:00 - 23:00)? Tất cả các ca tùy chỉnh sẽ bị xóa.")) return;

        setLoading(true);
        try {
            await workingSlotService.resetToDefault(selectedStaffId);
            showSuccess("Đã đặt lại giờ làm việc mặc định");
            fetchWorkingHours();
        } catch (error) {
            console.error("Error resetting defaults:", error);
            showError("Lỗi khi đặt lại giờ mặc định");
        } finally {
            setLoading(false);
        }
    };

    // --- TAB 2: BULK CREATE LOGIC ---
    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStaffId) return showError("Vui lòng chọn nhân viên");
        if (bulkForm.daysOfWeek.length === 0) return showError("Vui lòng chọn ít nhất một ngày");

        setLoading(true);
        try {
            await workingSlotService.createBulk({
                staffId: selectedStaffId,
                daysOfWeek: bulkForm.daysOfWeek,
                startTime: bulkForm.startTime,
                endTime: bulkForm.endTime,
                breakStartTime: bulkForm.breakStartTime,
                breakEndTime: bulkForm.breakEndTime,
                capacity: bulkForm.capacity,
                isActive: bulkForm.isActive,
                effectiveFrom: bulkForm.effectiveFrom,
                effectiveTo: bulkForm.effectiveTo
            });
            showSuccess("Đã tạo lịch làm việc hàng loạt thành công");
            // Optional: switch to hours view to see result
            setActiveTab("hours");
        } catch (error) {
            console.error("Error creating bulk slots:", error);
            showError("Lỗi khi tạo lịch hàng loạt");
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day) => {
        setBulkForm(prev => {
            const exists = prev.daysOfWeek.includes(day);
            if (exists) return { ...prev, daysOfWeek: prev.daysOfWeek.filter(d => d !== day) };
            return { ...prev, daysOfWeek: [...prev.daysOfWeek, day] };
        });
    };

    // --- TAB 3: CLOSE DATES LOGIC ---
    const handleCloseSubmit = async (e) => {
        e.preventDefault();
        e.preventDefault();
        // Validation: If NOT Shop Holiday (staffId is set), rely on selectedStaffId. 
        // If Shop Holiday (staffId is empty), it's valid for this tab.
        if (activeTab !== "close" && !selectedStaffId) return showError("Vui lòng chọn nhân viên");
        // For close tab, empty staffId means "Entire Shop", which is valid.

        const payload = {
            staffId: selectedStaffId || null,
            reason: closeForm.reason
        };

        if (closeForm.type === 'single') {
            payload.singleDate = closeForm.date;
        } else if (closeForm.type === 'range') {
            payload.dates = []; // You might need to generate dates or backend handles range
            // If backend supports from/to in CloseDateRequest, use that.
            // Assuming CloseDateRequest supports list of dates or ranges.
            // Based on user request description: "dates = [...]" or "weekStart...". 
            // Let's implement range generation for simplicity if backend expects dates list, 
            // or check backend DTO. Assuming backend handles logic.
            // Re-reading user request: "singleDate = ...", "dates = [...]", "weekStart...", "year/month".
            // Let's construct a list of dates for 'range' type to be safe, or separate fields if DTO matches.

            // Generating dates between start and end
            const dates = [];
            let currentDate = new Date(closeForm.startDate);
            const end = new Date(closeForm.endDate);
            while (currentDate <= end) {
                dates.push(currentDate.toISOString().split('T')[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            payload.dates = dates;
        }

        setLoading(true);
        try {
            await workingSlotService.closeDates(payload);
            showSuccess(`Đã đóng cửa ${closeForm.type === 'single' ? 'ngày ' + closeForm.date : 'khoảng thời gian'}`);
            setCloseForm(prev => ({ ...prev, reason: "" }));
        } catch (error) {
            console.error("Error closing dates:", error);
            showError("Lỗi khi đóng ngày làm việc");
        } finally {
            setLoading(false);
        }
    };

    const renderStaffSelect = () => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên áp dụng</label>
            <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : "")}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            >
                {/* Only show 'Entire Shop' option in Close Dates tab */}
                {activeTab === "close" && (
                    <option value="" className="font-bold text-red-600">-- 🏢 Toàn bộ cửa hàng (Ngày nghỉ lễ) --</option>
                )}
                {/* If activeTab is NOT close, and no staff selected, show prompt */}
                {activeTab !== "close" && <option value="" disabled>-- Chọn nhân viên --</option>}

                {tailors.map(t => (
                    <option key={t.id} value={t.id}>{t.name || t.username} (ID: {t.id})</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Quản lý Lịch làm việc</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6 mt-2">
                    <button
                        onClick={() => setActiveTab("hours")}
                        className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "hours" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Lịch hiện tại
                    </button>
                    <button
                        onClick={() => setActiveTab("bulk")}
                        className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "bulk" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Tạo hàng loạt
                    </button>
                    <button
                        onClick={() => setActiveTab("close")}
                        className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "close" ? "border-red-600 text-red-700" : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Đóng cửa / Nghỉ phép
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {renderStaffSelect()}

                    {activeTab === "hours" && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-gray-600">Xem lịch làm việc cấu hình hiện tại cho nhân viên.</p>
                                <button
                                    onClick={handleResetDefaults}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
                                >
                                    ↺ Đặt lại mặc định
                                </button>
                            </div>

                            {loading && !workingHours ? (
                                <div className="text-center py-10 text-gray-500">Đang tải...</div>
                            ) : workingHours ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thứ</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giờ làm việc</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nghỉ trưa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {workingHours.workingHours?.map((day, idx) => (
                                                <tr key={idx} className={day.working ? "" : "bg-gray-50"}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {daysOptions.find(d => d.value === day.dayOfWeek)?.label || day.dayOfWeek}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {day.working ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                Làm việc
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                                Nghỉ
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {day.working ? `${day.startTime} - ${day.endTime}` : "-"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {day.working && day.breakStartTime ? `${day.breakStartTime} - ${day.breakEndTime}` : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">Không có dữ liệu</div>
                            )}
                        </div>
                    )}

                    {activeTab === "bulk" && (
                        <form onSubmit={handleBulkSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Áp dụng cho ngày</label>
                                <div className="flex flex-wrap gap-2">
                                    {daysOptions.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => toggleDay(option.value)}
                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${bulkForm.daysOfWeek.includes(option.value)
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày (Hiệu lực)</label>
                                    <input
                                        type="date"
                                        required
                                        value={bulkForm.effectiveFrom}
                                        onChange={(e) => setBulkForm({ ...bulkForm, effectiveFrom: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày (Hiệu lực)</label>
                                    <input
                                        type="date"
                                        required
                                        value={bulkForm.effectiveTo}
                                        onChange={(e) => setBulkForm({ ...bulkForm, effectiveTo: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Giờ làm việc</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Bắt đầu</label>
                                            <input
                                                type="time"
                                                required
                                                value={bulkForm.startTime}
                                                onChange={(e) => setBulkForm({ ...bulkForm, startTime: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Kết thúc</label>
                                            <input
                                                type="time"
                                                required
                                                value={bulkForm.endTime}
                                                onChange={(e) => setBulkForm({ ...bulkForm, endTime: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Giờ nghỉ trưa (Tùy chọn)</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Bắt đầu nghỉ</label>
                                            <input
                                                type="time"
                                                value={bulkForm.breakStartTime}
                                                onChange={(e) => setBulkForm({ ...bulkForm, breakStartTime: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Kết thúc nghỉ</label>
                                            <input
                                                type="time"
                                                value={bulkForm.breakEndTime}
                                                onChange={(e) => setBulkForm({ ...bulkForm, breakEndTime: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số khách tối đa / slot</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bulkForm.capacity}
                                    onChange={(e) => setBulkForm({ ...bulkForm, capacity: Number(e.target.value) })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 max-w-[100px]"
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
                                >
                                    {loading ? "Đang xử lý..." : "Lưu cấu hình"}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === "close" && (
                        <form onSubmit={handleCloseSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setCloseForm({ ...closeForm, type: 'single' })}
                                    className={`p-4 border-2 rounded-xl text-center transition ${closeForm.type === 'single' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="text-2xl mb-2">📅</div>
                                    <div className="font-semibold">Một ngày</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCloseForm({ ...closeForm, type: 'range' })}
                                    className={`p-4 border-2 rounded-xl text-center transition ${closeForm.type === 'range' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="text-2xl mb-2">📆</div>
                                    <div className="font-semibold">Khoảng thời gian</div>
                                </button>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                {closeForm.type === 'single' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn ngày nghỉ</label>
                                        <input
                                            type="date"
                                            required
                                            value={closeForm.date}
                                            onChange={(e) => setCloseForm({ ...closeForm, date: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                                            <input
                                                type="date"
                                                required
                                                value={closeForm.startDate}
                                                onChange={(e) => setCloseForm({ ...closeForm, startDate: e.target.value })}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                                            <input
                                                type="date"
                                                required
                                                value={closeForm.endDate}
                                                onChange={(e) => setCloseForm({ ...closeForm, endDate: e.target.value })}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lý do (Tùy chọn)</label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: Nghỉ phép, Đám cưới..."
                                        value={closeForm.reason}
                                        onChange={(e) => setCloseForm({ ...closeForm, reason: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-md transition disabled:opacity-50"
                                >
                                    {loading ? "Đang xử lý..." : "Xác nhận Đóng cửa"}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}

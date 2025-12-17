import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import ActionMenu from "../components/orders/ActionMenu";
import DeleteConfirmModal from "../components/orders/DeleteConfirmModal";
import { orderService, userService } from "../services";
import { showSuccess, showError } from "../components/NotificationToast.jsx";

export default function OrderListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, order: null });
    const [tailors, setTailors] = useState([]);

    useEffect(() => {
        loadTailors();
    }, []);

    useEffect(() => {
        loadOrders();
    }, [location]);

    const loadTailors = async () => {
        try {
            const response = await userService.listTailors({ page: 0, size: 100 });
            if (response.success && response.data) {
                setTailors(response.data.content || []);
            }
        } catch (error) {
            console.error("Error loading tailors:", error);
        }
    };

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await orderService.list({ page: 0, size: 100 });
            const responseData = response?.data ?? response?.responseData ?? response;
            const isSuccess =
                response?.success === true ||
                response?.responseStatus?.responseCode === "200" ||
                !!responseData?.content;
            if (isSuccess && responseData) {
                setOrders(responseData.content || responseData.items || []);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
            showError("Không thể tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    // FILTER STATES
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Tất cả");
    const [receiveDate, setReceiveDate] = useState("");
    const [dueDate, setDueDate] = useState("");

    // PAGINATION
    const [page, setPage] = useState(1);
    const pageSize = 5;

    // FILTER LOGIC
    const filtered = useMemo(() => {
        return orders.filter((o) => {
            // search (id, name, phone, code)
            const searchLower = search.toLowerCase();
            const orderId = String(o.id || o.code || "");
            const orderName = String(o.name || o.customerName || o.customer?.name || "");
            const orderPhone = String(o.phone || o.customerPhone || o.customer?.phone || "");
            const orderCode = String(o.code || "");
            
            const matchSearch =
                orderId.toLowerCase().includes(searchLower) ||
                orderCode.toLowerCase().includes(searchLower) ||
                orderName.toLowerCase().includes(searchLower) ||
                orderPhone.includes(search);

            // status filter
            const matchStatus =
                statusFilter === "Tất cả" || o.status === statusFilter;

            // date filters
            const matchReceive =
                receiveDate === "" || o.receive === receiveDate;

            const matchDue = dueDate === "" || o.due === dueDate;

            return matchSearch && matchStatus && matchReceive && matchDue;
        });
    }, [search, statusFilter, receiveDate, dueDate, orders]);

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount) return "0 đ";
        if (typeof amount === "string" && amount.includes("đ")) return amount;
        return `${Number(amount).toLocaleString("vi-VN")} đ`;
    };

    // Get tailor name
    const getTailorName = (tailorId) => {
        if (!tailorId) return "-";
        const tailor = tailors.find(t => t.id === tailorId);
        return tailor ? (tailor.name || tailor.username) : "-";
    };

    // Handle update status
    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await orderService.updateStatus(orderId, { status: newStatus });
            await loadOrders(); // Refresh
            showSuccess("Cập nhật trạng thái thành công");
        } catch (error) {
            console.error("Error updating order status:", error);
            showError("Không thể cập nhật trạng thái");
        }
    };

    // Handle delete (Note: Backend may not have delete endpoint, only cancel/void)
    const handleDeleteClick = (orderId) => {
        const order = orders.find((o) => o.id === orderId);
        setDeleteModal({ isOpen: true, order });
    };

    const handleDeleteConfirm = async () => {
        if (deleteModal.order) {
            try {
                // Try to cancel order instead of delete (if status allows)
                if (deleteModal.order.status === 'NEW' || deleteModal.order.status === 'PENDING') {
                    await orderService.updateStatus(deleteModal.order.id, { status: 'CANCELLED' });
                    showSuccess("Đã hủy đơn hàng");
                } else {
                    showError("Không thể xóa đơn hàng đã được xử lý");
                }
                await loadOrders(); // Refresh
                setDeleteModal({ isOpen: false, order: null });
            } catch (error) {
                console.error("Error deleting order:", error);
                showError("Không thể xóa đơn hàng");
            }
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, order: null });
    };

    // PAGINATION LOGIC
    const start = (page - 1) * pageSize;
    const paginatedData = filtered.slice(start, start + pageSize);

    return (
        <div className="space-y-10">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-semibold text-gray-700">Đơn đặt may</h1>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate("/schedule")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        📅 Lịch hẹn
                    </button>
                    <button
                        onClick={() => navigate("/orders/new")}
                        className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition"
                    >
                        + Tạo đơn mới
                    </button>
                </div>
            </div>

            {/* FILTERS */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">

                {/* ROW 1 */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm text-gray-600">Tìm kiếm</label>
                        <input
                            type="text"
                            placeholder="Mã đơn / Tên / SĐT..."
                            className="w-full p-2.5 border rounded-lg focus:ring-green-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Trạng thái</label>
                        <select
                            className="w-full p-2.5 border rounded-lg focus:ring-green-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option>Tất cả</option>
                            <option>Mới</option>
                            <option>Đang may</option>
                            <option>Hoàn thành</option>
                            <option>Hủy</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Ngày khách tới đo / đặt may</label>
                        <input
                            type="date"
                            className="w-full p-2.5 border rounded-lg focus:ring-green-500"
                            value={receiveDate}
                            onChange={(e) => setReceiveDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* ROW 2 */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm text-gray-600">Ngày hẹn</label>
                        <input
                            type="date"
                            className="w-full p-2.5 border rounded-lg focus:ring-green-500"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                            <th className="p-3 text-left">Mã đơn</th>
                            <th className="p-3 text-left">Khách hàng</th>
                            <th className="p-3 text-left">SĐT</th>
                            <th className="p-3 text-left">Thợ may</th>
                            <th className="p-3 text-left">Ngày khách tới đo / đặt may</th>
                            <th className="p-3 text-left">Ngày hẹn</th>
                            <th className="p-3 text-left">Trạng thái</th>
                            <th className="p-3 text-left">Tổng tiền</th>
                            <th className="p-3 text-center w-40">Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-gray-500">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-gray-500">
                                    Không có đơn hàng nào
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, i) => (
                                <tr key={row.id || i} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{row.code || row.id}</td>
                                    <td className="p-3">{row.customerName || row.customer?.name || "-"}</td>
                                    <td className="p-3">{row.customerPhone || row.customer?.phone || "-"}</td>
                                    <td className="p-3">
                                        <span className="text-sm text-gray-600">
                                            {getTailorName(row.assignedTailorId || row.tailorId)}
                                        </span>
                                    </td>
                                    <td className="p-3">{row.appointmentDate || row.receiveDate || "-"}</td>
                                    <td className="p-3">{row.dueDate || row.due || "-"}</td>
                                    <td className="p-3">
                                        <StatusBadge luxury status={row.status} />
                                    </td>
                                    <td className="p-3">{formatCurrency(row.totalAmount || row.total)}</td>
                                    <td className="p-3">
                                        <ActionMenu
                                            order={row}
                                            onUpdateStatus={handleUpdateStatus}
                                            onDelete={handleDeleteClick}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* PAGINATION */}
                <div className="flex justify-between items-center mt-4 text-gray-600">
                    <p>
                        Showing {start + 1} to {start + paginatedData.length} of {filtered.length} entries
                    </p>

                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            className={`px-3 py-1 border rounded ${page === 1 ? "text-gray-300 border-gray-200" : "hover:bg-gray-100"
                                }`}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </button>

                        <button className="px-3 py-1 bg-blue-600 text-white rounded">
                            {page}
                        </button>

                        <button
                            disabled={start + pageSize >= filtered.length}
                            className={`px-3 py-1 border rounded ${start + pageSize >= filtered.length
                                    ? "text-gray-300 border-gray-200"
                                    : "hover:bg-gray-100"
                                }`}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                orderInfo={deleteModal.order}
            />
        </div>
    );
}

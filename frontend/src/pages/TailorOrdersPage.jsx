import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { orderService, userService } from "../services";
import { getCurrentUserRole, getCurrentUser, ROLES } from "../utils/authStorage";
import StatusBadge from "../components/StatusBadge";

export default function TailorOrdersPage() {
  const navigate = useNavigate();
  const { tailorId } = useParams();
  const [orders, setOrders] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [selectedTailor, setSelectedTailor] = useState(tailorId || "");
  const [statusFilter, setStatusFilter] = useState("Tất cả");

  useEffect(() => {
    loadData();
  }, [tailorId]);

  const loadData = async () => {
    try {
      // Load tailors
      const tailorsRes = await userService.listTailors({ page: 0, size: 200 });
      const tailorsData = tailorsRes?.data ?? tailorsRes?.responseData ?? tailorsRes;
      const tailorsOk =
        tailorsRes?.success === true ||
        tailorsRes?.responseStatus?.responseCode === "200" ||
        !!tailorsData?.content;
      if (tailorsOk && tailorsData) {
        setTailors(tailorsData.content || tailorsData.items || []);
      }

      // Determine default tailor
      if (tailorId) {
        setSelectedTailor(tailorId);
      } else {
        const currentUser = getCurrentUser();
        if (currentUser?.role === ROLES.TAILOR) {
          setSelectedTailor(currentUser.username || currentUser.id);
        }
      }

      // Load orders
      const currentTailor = tailorId || getCurrentUser()?.username || getCurrentUser()?.id;
      const response = await orderService.list({ assignedTailor: currentTailor, page: 0, size: 500 });
      const responseData = response?.data ?? response?.responseData ?? response;
      const isSuccess =
        response?.success === true ||
        response?.responseStatus?.responseCode === "200" ||
        !!responseData?.content;
      if (isSuccess && responseData) {
        setOrders(responseData.content || responseData.items || []);
      }
    } catch (error) {
      console.error("Error loading tailor orders:", error);
    }
  };

  // Filter orders by selected tailor
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      if (!selectedTailor) return false;
      return order.assignedTailor === selectedTailor || order.assignedTailor === Number(selectedTailor);
    });

    // Apply status filter
    if (statusFilter !== "Tất cả") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    return filtered;
  }, [orders, selectedTailor, statusFilter]);

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    if (typeof amount === "string" && amount.includes("đ")) return amount;
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

  const getTailorName = (tailorId) => {
    if (!tailorId) return "Chưa phân công";
    const tailor = tailors.find(t => t.username === tailorId || t.id === tailorId);
    return tailor ? tailor.name : tailorId;
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-700">Đơn hàng của thợ may</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/tailors/completed")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            ✅ Đồ đã may
          </button>
          <button
            onClick={() => navigate("/schedule")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            📅 Xem lịch hẹn
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 block mb-2">Chọn thợ may</label>
            <select
              value={selectedTailor}
              onChange={(e) => {
                setSelectedTailor(e.target.value);
                if (e.target.value) {
                  navigate(`/tailors/orders/${e.target.value}`, { replace: true });
                }
              }}
              className="w-full p-2.5 border rounded-lg focus:ring-green-500"
            >
              <option value="">-- Chọn thợ may --</option>
              {tailors.map((tailor) => (
                <option key={tailor.username || tailor.id} value={tailor.username || tailor.id}>
                  {tailor.name} ({tailor.username || tailor.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-green-500"
            >
              <option>Tất cả</option>
              <option>Mới</option>
              <option>Đang may</option>
              <option>Hoàn thành</option>
              <option>Hủy</option>
            </select>
          </div>
        </div>

        {selectedTailor && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Thợ may:</span> {getTailorName(selectedTailor)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Tổng số đơn: <span className="font-semibold">{filteredOrders.length}</span>
            </p>
          </div>
        )}
      </div>

      {/* Orders Table */}
      {selectedTailor ? (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Không có đơn hàng nào</p>
            </div>
          ) : (
            <>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                    <th className="p-3 text-left">Mã đơn</th>
                    <th className="p-3 text-left">Khách hàng</th>
                    <th className="p-3 text-left">SĐT</th>
                    <th className="p-3 text-left">Ngày khách tới đo / đặt may</th>
                    <th className="p-3 text-left">Ngày hẹn</th>
                    <th className="p-3 text-left">Trạng thái</th>
                    <th className="p-3 text-left">Tổng tiền</th>
                    <th className="p-3 text-left">Ghi chú sửa</th>
                    <th className="p-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="p-3">{order.id}</td>
                      <td className="p-3">{order.name}</td>
                      <td className="p-3">{order.phone}</td>
                      <td className="p-3">{order.receive}</td>
                      <td className="p-3">{order.due}</td>
                      <td className="p-3">
                        <StatusBadge luxury status={order.status} />
                      </td>
                      <td className="p-3">{formatCurrency(order.total)}</td>
                      <td className="p-3">
                        {order.correctionNotes ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            Có ghi chú
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="Mới">Mới</option>
                          <option value="Đang may">Đang may</option>
                          <option value="Hoàn thành">Hoàn thành</option>
                          <option value="Hủy">Hủy</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">Vui lòng chọn thợ may để xem danh sách đơn hàng</p>
        </div>
      )}
    </div>
  );
}


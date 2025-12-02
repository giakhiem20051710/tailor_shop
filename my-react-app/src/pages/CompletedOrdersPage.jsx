import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders } from "../utils/orderStorage";
import { getUsersByRole, ROLES } from "../utils/authStorage";
import StatusBadge from "../components/StatusBadge";

export default function CompletedOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [selectedTailor, setSelectedTailor] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const allOrders = getOrders();
    setOrders(allOrders);
    
    const tailorUsers = getUsersByRole(ROLES.TAILOR);
    setTailors(tailorUsers);
  }, []);

  // Filter completed orders
  const completedOrders = useMemo(() => {
    let filtered = orders.filter(order => order.status === "Hoàn thành");

    // Filter by tailor
    if (selectedTailor !== "all") {
      filtered = filtered.filter(order => order.assignedTailor === selectedTailor);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.name?.toLowerCase().includes(query) ||
        order.phone?.includes(query) ||
        order.id?.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(order => {
        if (!order.due) return false;
        return order.due >= dateFrom;
      });
    }

    if (dateTo) {
      filtered = filtered.filter(order => {
        if (!order.due) return false;
        return order.due <= dateTo;
      });
    }

    // Sort by due date (newest first)
    return filtered.sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return b.due.localeCompare(a.due);
    });
  }, [orders, selectedTailor, searchQuery, dateFrom, dateTo]);

  // Statistics
  const statistics = useMemo(() => {
    const totalOrders = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => {
      const amount = typeof order.total === "string" 
        ? parseFloat(order.total.replace(/,/g, "")) 
        : parseFloat(order.total) || 0;
      return sum + amount;
    }, 0);

    const ordersByTailor = {};
    completedOrders.forEach(order => {
      const tailorId = order.assignedTailor || "Chưa phân công";
      if (!ordersByTailor[tailorId]) {
        ordersByTailor[tailorId] = 0;
      }
      ordersByTailor[tailorId]++;
    });

    return {
      totalOrders,
      totalRevenue,
      ordersByTailor,
    };
  }, [completedOrders]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-700">Danh sách đồ đã may</h1>
        <button
          onClick={() => navigate("/tailors/orders")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          ← Quay lại đơn hàng
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng số đơn đã may</p>
              <p className="text-3xl font-bold text-gray-700">{statistics.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng doanh thu</p>
              <p className="text-3xl font-bold text-gray-700">{formatCurrency(statistics.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Số thợ may</p>
              <p className="text-3xl font-bold text-gray-700">{Object.keys(statistics.ordersByTailor).length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="text-sm text-gray-600 block mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên, SĐT, Mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-green-500"
            />
          </div>

          {/* Tailor Filter */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Thợ may</label>
            <select
              value={selectedTailor}
              onChange={(e) => setSelectedTailor(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-green-500"
            >
              <option value="all">Tất cả</option>
              {tailors.map((tailor) => (
                <option key={tailor.username || tailor.id} value={tailor.username || tailor.id}>
                  {tailor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm text-gray-600 block mb-2">Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-green-500"
            />
          </div>

          {/* Clear Filters */}
          {(selectedTailor !== "all" || searchQuery || dateFrom || dateTo) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedTailor("all");
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                ✕ Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        {completedOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">Không có đơn hàng nào đã hoàn thành</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Hiển thị <span className="font-semibold">{completedOrders.length}</span> đơn hàng
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                    <th className="p-3 text-left">Mã đơn</th>
                    <th className="p-3 text-left">Khách hàng</th>
                    <th className="p-3 text-left">SĐT</th>
                    <th className="p-3 text-left">Thợ may</th>
                    <th className="p-3 text-left">Ngày khách tới đo / đặt may</th>
                    <th className="p-3 text-left">Ngày hẹn</th>
                    <th className="p-3 text-left">Ngày hoàn thành</th>
                    <th className="p-3 text-left">Tổng tiền</th>
                    <th className="p-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="p-3 font-medium">{order.id}</td>
                      <td className="p-3">{order.name}</td>
                      <td className="p-3">{order.phone}</td>
                      <td className="p-3">
                        <span className="text-sm text-gray-600">
                          {getTailorName(order.assignedTailor)}
                        </span>
                      </td>
                      <td className="p-3">{order.receive}</td>
                      <td className="p-3">{order.due}</td>
                      <td className="p-3">
                        {order.completedAt 
                          ? new Date(order.completedAt).toLocaleDateString("vi-VN")
                          : order.due || "-"}
                      </td>
                      <td className="p-3 font-semibold text-green-600">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


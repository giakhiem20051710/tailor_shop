import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders } from "../utils/orderStorage";
import { getUsersByRole, ROLES } from "../utils/authStorage";

export default function SchedulePage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [tailors, setTailors] = useState([]);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState("all"); // all, fitting, pickup
  const [tailorFilter, setTailorFilter] = useState("all"); // all or tailor ID
  const [statusFilter, setStatusFilter] = useState("all"); // all or status
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("day"); // day, week

  useEffect(() => {
    const allOrders = getOrders();
    setOrders(allOrders);
    
    // Load tailors
    const tailorUsers = getUsersByRole(ROLES.TAILOR);
    setTailors(tailorUsers);
  }, []);

  // Get date range for week view
  const getDateRange = () => {
    if (viewMode === "week") {
      const date = new Date(selectedDate + "T00:00:00");
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Get Monday (or previous Monday if Sunday)
      const monday = new Date(date);
      monday.setDate(diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split("T")[0],
        end: sunday.toISOString().split("T")[0],
      };
    }
    return { start: selectedDate, end: selectedDate };
  };

  // Get appointments for selected date(s)
  const appointments = useMemo(() => {
    const dateRange = getDateRange();
    return orders.filter(order => {
      if (!order.appointmentDate) return false;
      
      // Check if appointment date is in range
      const appointmentDate = order.appointmentDate;
      const inRange = appointmentDate >= dateRange.start && appointmentDate <= dateRange.end;
      
      if (!inRange) return false;

      // Filter by type
      if (typeFilter !== "all" && order.appointmentType !== typeFilter) return false;

      // Filter by tailor
      if (tailorFilter !== "all" && order.assignedTailor !== tailorFilter) return false;

      // Filter by status
      if (statusFilter !== "all" && order.status !== statusFilter) return false;

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = order.name?.toLowerCase().includes(query);
        const matchesPhone = order.phone?.includes(query);
        const matchesId = order.id?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesId) return false;
      }

      return true;
    });
  }, [orders, selectedDate, typeFilter, tailorFilter, statusFilter, searchQuery, viewMode]);

  // Group appointments by type
  const appointmentsByType = useMemo(() => {
    const groups = {
      fitting: [], // Thử đồ
      pickup: [],  // Nhận đồ
    };

    appointments.forEach(order => {
      if (order.appointmentType === "fitting") {
        groups.fitting.push(order);
      } else if (order.appointmentType === "pickup") {
        groups.pickup.push(order);
      }
    });

    // Sort by appointment time
    const sortByTime = (a, b) => {
      if (!a.appointmentTime && !b.appointmentTime) return 0;
      if (!a.appointmentTime) return 1;
      if (!b.appointmentTime) return -1;
      return a.appointmentTime.localeCompare(b.appointmentTime);
    };

    groups.fitting.sort(sortByTime);
    groups.pickup.sort(sortByTime);

    return groups;
  }, [appointments]);

  // Quick date navigation
  const navigateDate = (direction) => {
    const date = new Date(selectedDate);
    if (viewMode === "week") {
      date.setDate(date.getDate() + (direction * 7));
    } else {
      date.setDate(date.getDate() + direction);
    }
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const getTailorName = (tailorId) => {
    if (!tailorId) return "Chưa phân công";
    const tailor = tailors.find(t => t.username === tailorId || t.id === tailorId);
    return tailor ? tailor.name : tailorId;
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    if (typeof amount === "string" && amount.includes("đ")) return amount;
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-700">Lịch hẹn</h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => navigate("/orders/new")}
            className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition"
          >
            + Tạo đơn mới
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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

          {/* Type Filter */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Loại lịch</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-green-500"
            >
              <option value="all">Tất cả</option>
              <option value="fitting">Thử đồ</option>
              <option value="pickup">Nhận đồ</option>
            </select>
          </div>

          {/* Tailor Filter */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Thợ may</label>
            <select
              value={tailorFilter}
              onChange={(e) => setTailorFilter(e.target.value)}
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

          {/* Status Filter */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-green-500"
            >
              <option value="all">Tất cả</option>
              <option value="Mới">Mới</option>
              <option value="Đang may">Đang may</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Hủy">Hủy</option>
            </select>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                viewMode === "day"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Theo ngày
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                viewMode === "week"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Theo tuần
            </button>
          </div>

          {/* Clear Filters Button */}
          {(typeFilter !== "all" || tailorFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter("all");
                setTailorFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
            >
              ✕ Xóa bộ lọc
            </button>
          )}

          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => navigateDate(-1)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              ← {viewMode === "week" ? "Tuần trước" : "Hôm qua"}
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Hôm nay
            </button>
            <button
              onClick={() => navigateDate(1)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {viewMode === "week" ? "Tuần sau" : "Ngày mai"} →
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-1.5 border rounded-lg focus:ring-green-500"
          />
        </div>
      </div>

      {/* Date Display */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm opacity-90">
                {viewMode === "week" ? "Tuần được chọn" : "Ngày được chọn"}
              </p>
              <p className="text-xl font-semibold">
                {viewMode === "week" ? (
                  <>
                    {new Date(getDateRange().start).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "long"
                    })} - {new Date(getDateRange().end).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </>
                ) : (
                  new Date(selectedDate).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Tổng số lịch hẹn</p>
            <p className="text-2xl font-bold">{appointments.length}</p>
          </div>
        </div>
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fitting Appointments - Thử đồ */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Thử đồ</h2>
                <p className="text-sm text-gray-500">{appointmentsByType.fitting.length} khách hàng</p>
              </div>
            </div>
            {viewMode === "week" && appointmentsByType.fitting.length > 0 && (
              <span className="text-xs text-gray-400">
                {new Set(appointmentsByType.fitting.map(o => o.appointmentDate)).size} ngày
              </span>
            )}
          </div>

          {appointmentsByType.fitting.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Không có lịch thử đồ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointmentsByType.fitting.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-700">{order.name}</p>
                      <p className="text-sm text-gray-500">{order.phone}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {order.id}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <p>Thợ may: <span className="font-medium">{getTailorName(order.assignedTailor)}</span></p>
                      {viewMode === "week" && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {new Date(order.appointmentDate).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    {order.appointmentTime && (
                      <p>Giờ hẹn: <span className="font-medium">{order.appointmentTime}</span></p>
                    )}
                    {order.correctionNotes && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          <span className="font-semibold">Ghi chú sửa:</span> {order.correctionNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pickup Appointments - Nhận đồ */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-700">Nhận đồ</h2>
                <p className="text-sm text-gray-500">{appointmentsByType.pickup.length} khách hàng</p>
              </div>
            </div>
            {viewMode === "week" && appointmentsByType.pickup.length > 0 && (
              <span className="text-xs text-gray-400">
                {new Set(appointmentsByType.pickup.map(o => o.appointmentDate)).size} ngày
              </span>
            )}
          </div>

          {appointmentsByType.pickup.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Không có lịch nhận đồ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointmentsByType.pickup.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-700">{order.name}</p>
                      <p className="text-sm text-gray-500">{order.phone}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {order.id}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <p>Thợ may: <span className="font-medium">{getTailorName(order.assignedTailor)}</span></p>
                      {viewMode === "week" && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {new Date(order.appointmentDate).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    {order.appointmentTime && (
                      <p>Giờ hẹn: <span className="font-medium">{order.appointmentTime}</span></p>
                    )}
                    <p className="text-green-600 font-medium">
                      Tổng tiền: {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


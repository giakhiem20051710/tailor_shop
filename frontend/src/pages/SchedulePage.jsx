import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { orderService, appointmentService, userService, workingSlotService } from "../services";
import { SlotDetailModal, ScheduleTutorial, shouldShowScheduleTutorial, ScheduleSettingsModal } from "../components/schedule";
import { showSuccess, showError } from "../components/NotificationToast.jsx";

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
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "21:30",
    breakStartTime: "12:00",
    breakEndTime: "13:00",
    type: "consult",
    tailorId: "all",
    capacity: 1,
  });
  const [workingSlots, setWorkingSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [slotDetail, setSlotDetail] = useState(null);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [weeklyModalDate, setWeeklyModalDate] = useState(selectedDate);
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(false);

  // Show tutorial on first visit
  useEffect(() => {
    if (shouldShowScheduleTutorial()) {
      setShowTutorial(true);
    }
  }, []);

  // Load data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load orders from API
      const orderResponse = await orderService.list({}, { page: 0, size: 100 });
      const orderData = orderResponse?.data ?? orderResponse?.responseData ?? orderResponse;
      const ordersList = orderData?.content ?? orderData?.data ?? [];
      setOrders(ordersList);

      // Load working slots from API
      const slotsResponse = await workingSlotService.list(
        { date: selectedDate },
        { page: 0, size: 100 }
      );
      const slotsData = slotsResponse?.data ?? slotsResponse?.responseData ?? slotsResponse;
      const slotsList = slotsData?.content ?? slotsData?.data ?? slotsData ?? [];
      setWorkingSlots(Array.isArray(slotsList) ? slotsList : []);

      // Load appointments from API
      const aptsResponse = await appointmentService.list(
        { date: selectedDate },
        { page: 0, size: 100 }
      );
      const aptsData = aptsResponse?.data ?? aptsResponse?.responseData ?? aptsResponse;
      const aptsList = aptsData?.content ?? aptsData?.data ?? aptsData ?? [];
      setAppointments(Array.isArray(aptsList) ? aptsList : []);

      // Load tailors (staff users)
      try {
        // Try listTailors first
        let tailorList = [];
        try {
          const tailorResponse = await userService.listTailors({ size: 100 });
          const tailorData = tailorResponse?.data ?? tailorResponse?.responseData ?? tailorResponse;
          tailorList = tailorData?.content ?? tailorData?.data ?? tailorData ?? [];
        } catch (e1) {
          // If tailors endpoint fails, try list with role filter
          try {
            const listResponse = await userService.list({ role: 'TAILOR', size: 100 });
            const listData = listResponse?.data ?? listResponse?.responseData ?? listResponse;
            tailorList = listData?.content ?? listData?.data ?? listData ?? [];
          } catch (e2) {
            console.warn("Could not load tailors from any API endpoint");
          }
        }

        // If API returns empty, use fallback from localStorage (legacy support)
        if (!tailorList || tailorList.length === 0) {
          const { getUsersByRole, ROLES } = await import("../utils/authStorage");
          const localTailors = getUsersByRole(ROLES.TAILOR);
          if (localTailors && localTailors.length > 0) {
            // Ensure IDs are numbers
            tailorList = localTailors.map((t, idx) => ({
              ...t,
              id: typeof t.id === 'number' ? t.id : idx + 1,
            }));
            console.log("Using tailors from localStorage fallback:", tailorList);
          }
        }

        // Last resort: hardcoded tailors (for demo/testing when not logged in)
        if (!tailorList || tailorList.length === 0) {
          console.warn("No tailors from API or localStorage. Please login first or add tailors to database.");
          // Note: These IDs must exist in your database!
          // You should add real tailors via admin panel or API
          showError("Vui lòng đăng nhập để xem danh sách thợ may.");
        }

        setTailors(Array.isArray(tailorList) ? tailorList : []);
        console.log("Final tailors list:", tailorList);
      } catch (e) {
        console.warn("Could not load tailors:", e);
        setTailors([]);
      }
    } catch (error) {
      console.error("Error loading schedule data:", error);
      showError("Không thể tải dữ liệu lịch hẹn");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Map appointments with slot info
  const appointmentsView = useMemo(() => {
    return appointments
      .map((app) => {
        const slot = workingSlots.find((s) => s.id === app.slotId);
        if (!slot) return null;
        return { ...app, slot };
      })
      .filter(Boolean);
  }, [appointments, workingSlots]);

  // Get appointments for selected date(s) with filters
  const filteredAppointments = useMemo(() => {
    const dateRange = getDateRange();
    return appointmentsView.filter((app) => {
      const { slot } = app;
      const inRange =
        slot.date >= dateRange.start && slot.date <= dateRange.end;
      if (!inRange) return false;

      if (typeFilter !== "all" && slot.type !== typeFilter) return false;

      if (tailorFilter !== "all" && slot.tailorId !== tailorFilter) return false;

      if (statusFilter !== "all" && app.status !== statusFilter) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = app.customerId?.toLowerCase().includes(query);
        const matchesPhone = app.phone?.includes(query);
        const matchesId = app.id?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesId) return false;
      }

      return true;
    });
  }, [
    appointmentsView,
    selectedDate,
    typeFilter,
    tailorFilter,
    statusFilter,
    searchQuery,
    viewMode,
  ]);

  // Group appointments by type (for the two cards)
  const appointmentsByType = useMemo(() => {
    const groups = {
      fitting: [],
      pickup: [],
    };
    filteredAppointments.forEach((app) => {
      if (app.slot.type === "fitting") groups.fitting.push(app);
      if (app.slot.type === "pickup") groups.pickup.push(app);
    });
    const sortByTime = (a, b) => {
      const ta = a.slot.startTime || "";
      const tb = b.slot.startTime || "";
      return ta.localeCompare(tb);
    };
    groups.fitting.sort(sortByTime);
    groups.pickup.sort(sortByTime);
    return groups;
  }, [filteredAppointments]);

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

  // Get tailor name from staffId or tailorId (supports both API and legacy data)
  const getTailorName = (staffIdOrTailorId) => {
    if (!staffIdOrTailorId) return "Chưa phân công";
    const id = Number(staffIdOrTailorId);
    const tailor = tailors.find(t =>
      t.id === id ||
      t.id === staffIdOrTailorId ||
      t.username === staffIdOrTailorId
    );
    return tailor ? (tailor.name || tailor.username) : `Thợ #${staffIdOrTailorId}`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    if (typeof amount === "string" && amount.includes("đ")) return amount;
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

  // Map slotId -> appointments
  const slotBookings = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (a.status === "cancelled") return;
      if (!map[a.slotId]) map[a.slotId] = [];
      map[a.slotId].push(a);
    });
    return map;
  }, [appointments]);

  // Pending/confirmed count per slot for capacity display
  const pendingCountBySlot = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (a.status === "pending" || a.status === "confirmed") {
        map[a.slotId] = (map[a.slotId] || 0) + 1;
      }
    });
    return map;
  }, [appointments]);

  const recalcSlotStatus = (slotId) => {
    const slot = workingSlots.find((s) => s.id === slotId);
    if (!slot) return;
    const active = pendingCountBySlot[slotId] || 0;
    const capacity = slot.capacity || 1;
    const status =
      slot.status === "blocked"
        ? "blocked"
        : active >= capacity
          ? "booked"
          : "available";
    const updated = updateWorkingSlot(slotId, {
      bookedCount: active,
      status,
    });
    if (updated) {
      setWorkingSlots((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    }
  };

  const handleSlotFormChange = (e) => {
    const { name, value } = e.target;
    setSlotForm((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value || 1) : value,
    }));
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) return;
    if (slotForm.endTime <= slotForm.startTime) {
      showError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    if (slotForm.tailorId === "all" || !slotForm.tailorId) {
      showError("Vui lòng chọn thợ phụ trách.");
      return;
    }

    // Validate staffId is a valid number
    const staffId = Number(slotForm.tailorId);
    if (isNaN(staffId) || staffId <= 0) {
      showError("Thợ may không hợp lệ. Vui lòng chọn lại.");
      return;
    }

    const toMinutes = (time) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(slotForm.startTime);
    const newEnd = toMinutes(slotForm.endTime);

    // Check for conflicts in current slots
    const conflict = workingSlots.some((slot) => {
      // Compare with the slot's staffId (from API) - handle both staff object and staffId number
      const slotStaffId = slot.staff?.id || slot.staffId;
      if (
        slotStaffId !== staffId ||
        slot.date !== slotForm.date
      ) {
        return false;
      }
      const start = toMinutes(slot.startTime);
      const end = toMinutes(slot.endTime);
      return newStart < end && newEnd > start;
    });

    if (conflict) {
      showError("Ca rảnh này bị trùng với một ca đã tồn tại của thợ. Vui lòng chọn giờ khác.");
      return;
    }

    // Calculate DayOfWeek string (MONDAY, TUESDAY, etc.)
    const dateObj = new Date(slotForm.date);
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = days[dateObj.getDay()];

    try {
      const response = await workingSlotService.create({
        dayOfWeek: dayOfWeek,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        breakStartTime: slotForm.breakStartTime || null,
        breakEndTime: slotForm.breakEndTime || null,
        // For a single day slot, effectiveFrom and effectiveTo are the same
        effectiveFrom: slotForm.date,
        effectiveTo: slotForm.date,
        type: slotForm.type.toUpperCase(),
        staffId: staffId, // Use validated staffId
        capacity: slotForm.capacity || 1,
        isActive: true
      });
      const created = response?.data ?? response?.responseData ?? response;
      showSuccess("Đã tạo ca rảnh mới");
      setShowSlotForm(false);
      loadData(); // Reload data from API
    } catch (error) {
      console.error("Error creating working slot:", error);
      showError("Không thể tạo ca rảnh. Vui lòng thử lại.");
    }
  };

  const toggleSlotStatus = async (slot) => {
    const newStatus = slot.status === "BLOCKED" ? "AVAILABLE" : "BLOCKED";
    try {
      await workingSlotService.update(slot.id, {
        ...slot,
        status: newStatus,
      });
      showSuccess(newStatus === "BLOCKED" ? "Đã chặn ca rảnh" : "Đã mở lại ca rảnh");
      loadData(); // Reload data from API
    } catch (error) {
      console.error("Error updating slot status:", error);
      showError("Không thể cập nhật trạng thái ca rảnh");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-700">
          Lịch hẹn
        </h1>
        <div className="flex gap-2 sm:gap-3 items-center">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition text-sm flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Quản lý</span>
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition text-sm flex items-center gap-1.5"
            title="Hướng dẫn sử dụng"
          >
            <span>❓</span>
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>
          <button
            onClick={() => setShowSlotForm(true)}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg shadow hover:bg-emerald-800 transition text-sm md:text-base"
          >
            + Thêm ca rảnh
          </button>
          <button
            onClick={() => navigate("/orders/new")}
            className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition text-sm md:text-base"
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
              className={`px-3 py-1.5 rounded-lg text-sm transition ${viewMode === "day"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Theo ngày
            </button>
            <button
              onClick={() => {
                setWeeklyModalDate(selectedDate);
                setShowWeeklyModal(true);
              }}
              className="px-3 py-1.5 rounded-lg text-sm transition bg-gradient-to-r from-[#1B4332] to-[#2D5A47] text-white hover:from-[#14532d] hover:to-[#1B4332] shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Xem lịch tuần
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
            <p className="text-2xl font-bold">{filteredAppointments.length}</p>
          </div>
        </div>
      </div>

      {/* Working slots grid for tuần/ngày */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Ca rảnh của thợ
            </h2>
            <p className="text-xs text-gray-500">
              Nhấn vào ca để xem chi tiết, lịch đã đặt và chặn/mở giờ
            </p>
          </div>
        </div>
        {viewMode === "week" ? (
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
            {(() => {
              const range = getDateRange();
              const startDate = new Date(range.start + "T00:00:00");
              return Array.from({ length: 7 }).map((_, idx) => {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + idx);
                const dateStr = d.toISOString().split("T")[0];
                const daySlots = workingSlots.filter(
                  (s) => s.date === dateStr
                );
                const isToday = dateStr === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={dateStr}
                    className={`border-2 rounded-xl p-3 space-y-2 min-h-[120px] transition-all ${isToday
                      ? "border-[#1B4332] bg-[#1B4332]/5 shadow-md"
                      : "border-gray-200 bg-gray-50/50"
                      }`}
                  >
                    <div className={`text-xs font-bold flex justify-between items-center pb-2 border-b ${isToday ? "text-[#1B4332] border-[#1B4332]/20" : "text-gray-700 border-gray-200"
                      }`}>
                      <span className="uppercase">
                        {d.toLocaleDateString("vi-VN", {
                          weekday: "short",
                        })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${isToday ? "bg-[#1B4332] text-white" : "bg-gray-200 text-gray-600"
                        }`}>
                        {d.getDate().toString().padStart(2, "0")}
                      </span>
                    </div>
                    {daySlots.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-2xl mb-1 opacity-30">📅</div>
                        <p className="text-[10px] text-gray-400">Chưa có ca</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {daySlots
                          .slice()
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((slot) => {
                            const booked = pendingCountBySlot[slot.id] || 0;
                            const tailorName = (tailors.find(
                              (t) =>
                                t.username === slot.tailorId ||
                                t.id === slot.tailorId
                            ) || {}).name || "Thợ";

                            const slotConfig = {
                              consult: {
                                gradient: "from-sky-500 to-blue-600",
                                bg: "bg-gradient-to-br from-sky-50 to-blue-50",
                                border: "border-sky-300",
                                text: "text-sky-800",
                                icon: "💬",
                                label: "Tư vấn",
                              },
                              measure: {
                                gradient: "from-purple-500 to-indigo-600",
                                bg: "bg-gradient-to-br from-purple-50 to-indigo-50",
                                border: "border-purple-300",
                                text: "text-purple-800",
                                icon: "📏",
                                label: "Đo số đo",
                              },
                              fitting: {
                                gradient: "from-amber-500 to-orange-600",
                                bg: "bg-gradient-to-br from-amber-50 to-orange-50",
                                border: "border-amber-300",
                                text: "text-amber-800",
                                icon: "👔",
                                label: "Thử đồ",
                              },
                              pickup: {
                                gradient: "from-emerald-500 to-green-600",
                                bg: "bg-gradient-to-br from-emerald-50 to-green-50",
                                border: "border-emerald-300",
                                text: "text-emerald-800",
                                icon: "✅",
                                label: "Nhận đồ",
                              },
                            };

                            const config = slot.status === "blocked"
                              ? {
                                gradient: "from-gray-400 to-gray-500",
                                bg: "bg-gray-100",
                                border: "border-gray-300",
                                text: "text-gray-600",
                                icon: "🚫",
                                label: "Đã chặn",
                              }
                              : slotConfig[slot.type] || slotConfig.consult;

                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() =>
                                  setSlotDetail({
                                    slot,
                                    apps: slotBookings[slot.id] || [],
                                  })
                                }
                                className={`w-full ${config.bg} ${config.border} border-2 rounded-lg p-2 hover:shadow-md transition-all duration-200 group`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center text-sm flex-shrink-0 shadow-sm`}>
                                    {config.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className={`font-bold text-xs ${config.text}`}>
                                        {slot.startTime}–{slot.endTime}
                                      </p>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${slot.status === "blocked"
                                        ? "bg-gray-200 text-gray-600"
                                        : booked >= (slot.capacity || 1)
                                          ? "bg-red-100 text-red-700"
                                          : "bg-green-100 text-green-700"
                                        }`}>
                                        {slot.status === "blocked"
                                          ? "🚫"
                                          : `${booked}/${slot.capacity || 1}`}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-gray-600 truncate">
                                      {tailorName}
                                    </p>
                                    <p className={`text-[10px] ${config.text} font-medium mt-0.5`}>
                                      {config.label}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const daySlots = workingSlots.filter(
                (s) => s.date === selectedDate
              );
              if (daySlots.length === 0) {
                return (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="text-5xl mb-3 opacity-30">📅</div>
                    <p className="text-gray-500 font-medium mb-1">
                      Chưa có ca rảnh nào
                    </p>
                    <p className="text-sm text-gray-400">
                      Nhấn "+ Thêm ca rảnh" để tạo ca làm việc mới
                    </p>
                  </div>
                );
              }
              return daySlots
                .slice()
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((slot) => {
                  const booked = pendingCountBySlot[slot.id] || 0;
                  const tailorName = (tailors.find(
                    (t) =>
                      t.username === slot.tailorId ||
                      t.id === slot.tailorId
                  ) || {}).name || "Thợ";

                  const slotConfig = {
                    consult: {
                      gradient: "from-sky-500 to-blue-600",
                      bg: "bg-gradient-to-br from-sky-50 to-blue-50",
                      border: "border-sky-300",
                      text: "text-sky-800",
                      icon: "💬",
                      label: "Tư vấn / chọn mẫu",
                      lightBg: "bg-sky-100",
                    },
                    measure: {
                      gradient: "from-purple-500 to-indigo-600",
                      bg: "bg-gradient-to-br from-purple-50 to-indigo-50",
                      border: "border-purple-300",
                      text: "text-purple-800",
                      icon: "📏",
                      label: "Đo số đo",
                      lightBg: "bg-purple-100",
                    },
                    fitting: {
                      gradient: "from-amber-500 to-orange-600",
                      bg: "bg-gradient-to-br from-amber-50 to-orange-50",
                      border: "border-amber-300",
                      text: "text-amber-800",
                      icon: "👔",
                      label: "Thử đồ",
                      lightBg: "bg-amber-100",
                    },
                    pickup: {
                      gradient: "from-emerald-500 to-green-600",
                      bg: "bg-gradient-to-br from-emerald-50 to-green-50",
                      border: "border-emerald-300",
                      text: "text-emerald-800",
                      icon: "✅",
                      label: "Nhận đồ",
                      lightBg: "bg-emerald-100",
                    },
                  };

                  const config = slot.status === "blocked"
                    ? {
                      gradient: "from-gray-400 to-gray-500",
                      bg: "bg-gray-100",
                      border: "border-gray-300",
                      text: "text-gray-600",
                      icon: "🚫",
                      label: "Đã chặn",
                      lightBg: "bg-gray-200",
                    }
                    : slotConfig[slot.type] || slotConfig.consult;

                  const isFull = booked >= (slot.capacity || 1);
                  const isAvailable = slot.status !== "blocked" && !isFull;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() =>
                        setSlotDetail({
                          slot,
                          apps: slotBookings[slot.id] || [],
                        })
                      }
                      className={`w-full ${config.bg} ${config.border} border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200 group relative overflow-hidden`}
                    >
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>

                      <div className="relative flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className={`text-lg font-bold ${config.text} mb-1`}>
                                {slot.startTime}–{slot.endTime}
                              </p>
                              <p className={`text-sm font-semibold ${config.text}`}>
                                {config.label}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${slot.status === "blocked"
                                ? "bg-gray-200 text-gray-700"
                                : isFull
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                                }`}>
                                {slot.status === "blocked"
                                  ? "🚫 Đã chặn"
                                  : isFull
                                    ? "✅ Đã đầy"
                                    : "🟢 Còn chỗ"}
                              </span>
                              <span className="text-xs text-gray-600 font-medium">
                                {booked}/{slot.capacity || 1} khách
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/50">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full ${config.lightBg || "bg-white/50"} flex items-center justify-center`}>
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {tailorName}
                              </span>
                            </div>
                            {isAvailable && (
                              <div className="ml-auto">
                                <span className="text-xs text-gray-500 bg-white/70 px-2 py-1 rounded-full">
                                  Có thể đặt lịch
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0">
                          <svg className={`w-6 h-6 ${config.text} group-hover:translate-x-1 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                });
            })()}
          </div>
        )}
      </section>

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
              {appointmentsByType.fitting.map((app) => (
                <div
                  key={app.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-700">
                        {app.customerId || "Khách lẻ"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {app.slot.date}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {app.id}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <p>Thợ may: <span className="font-medium">{getTailorName(app.slot.tailorId)}</span></p>
                      {viewMode === "week" && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {new Date(app.slot.date).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    {app.slot.startTime && (
                      <p>Giờ hẹn: <span className="font-medium">{app.slot.startTime}–{app.slot.endTime}</span></p>
                    )}
                    <p className="text-xs text-gray-500">Trạng thái: {app.status}</p>
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
              {appointmentsByType.pickup.map((app) => (
                <div
                  key={app.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-700">
                        {app.customerId || "Khách lẻ"}
                      </p>
                      <p className="text-sm text-gray-500">{app.slot.date}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {app.id}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <p>Thợ may: <span className="font-medium">{getTailorName(app.slot.tailorId)}</span></p>
                      {viewMode === "week" && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {new Date(app.slot.date).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    {app.slot.startTime && (
                      <p>Giờ hẹn: <span className="font-medium">{app.slot.startTime}–{app.slot.endTime}</span></p>
                    )}
                    <p className="text-xs text-gray-500">Trạng thái: {app.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Schedule Modal */}
      {showWeeklyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWeeklyModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[98vw] max-h-[95vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              // Get week range
              const getWeekDates = () => {
                const date = new Date(weeklyModalDate + "T00:00:00");
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Get Monday
                const monday = new Date(date);
                monday.setDate(diff);

                const weekDates = [];
                for (let i = 0; i < 7; i++) {
                  const d = new Date(monday);
                  d.setDate(monday.getDate() + i);
                  weekDates.push(d.toISOString().split("T")[0]);
                }
                return weekDates;
              };

              const navigateWeek = (direction) => {
                const date = new Date(weeklyModalDate + "T00:00:00");
                date.setDate(date.getDate() + (direction * 7));
                setWeeklyModalDate(date.toISOString().split("T")[0]);
              };

              const goToTodayWeek = () => {
                setWeeklyModalDate(new Date().toISOString().split("T")[0]);
              };

              const weekDates = getWeekDates();
              const isToday = (dateStr) => dateStr === new Date().toISOString().split("T")[0];
              const isSelected = (dateStr) => dateStr === selectedDate;

              // Generate time slots from 8:00 to 22:00
              const timeSlots = [];
              for (let hour = 8; hour <= 22; hour++) {
                timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
              }

              // Helper to convert time to minutes
              const timeToMinutes = (timeStr) => {
                const [h, m] = timeStr.split(":").map(Number);
                return h * 60 + m;
              };

              // Helper to calculate position and height
              const getAppointmentStyle = (app) => {
                const startMinutes = timeToMinutes(app.slot.startTime);
                const endMinutes = timeToMinutes(app.slot.endTime);
                const duration = endMinutes - startMinutes;

                // Timeline starts at 8:00 (480 minutes)
                const startOffset = startMinutes - 480;
                const totalMinutes = 14 * 60; // 8:00 to 22:00 = 14 hours

                // Each hour slot is 48px (h-12)
                const totalHeight = timeSlots.length * 48;
                const topPx = (startOffset / totalMinutes) * totalHeight;
                const heightPx = (duration / totalMinutes) * totalHeight;

                return {
                  top: `${topPx}px`,
                  height: `${heightPx}px`,
                };
              };

              const slotConfig = {
                consult: {
                  gradient: "from-sky-500 to-blue-600",
                  bg: "bg-gradient-to-br from-sky-50 to-blue-50",
                  border: "border-sky-300",
                  text: "text-sky-800",
                  icon: "💬",
                  label: "Tư vấn",
                },
                measure: {
                  gradient: "from-purple-500 to-indigo-600",
                  bg: "bg-gradient-to-br from-purple-50 to-indigo-50",
                  border: "border-purple-300",
                  text: "text-purple-800",
                  icon: "📏",
                  label: "Đo số đo",
                },
                fitting: {
                  gradient: "from-amber-500 to-orange-600",
                  bg: "bg-gradient-to-br from-amber-50 to-orange-50",
                  border: "border-amber-300",
                  text: "text-amber-800",
                  icon: "👔",
                  label: "Thử đồ",
                },
                pickup: {
                  gradient: "from-emerald-500 to-green-600",
                  bg: "bg-gradient-to-br from-emerald-50 to-green-50",
                  border: "border-emerald-300",
                  text: "text-emerald-800",
                  icon: "✅",
                  label: "Nhận đồ",
                },
              };

              // Get appointments for each day
              const getDayAppointments = (dateStr) => {
                return appointmentsView
                  .filter((a) => a.slot.date === dateStr)
                  .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
              };

              const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

              return (
                <>
                  {/* Modal Header */}
                  <div className="bg-gradient-to-br from-[#1B4332] via-[#2D5A47] to-[#1B4332] text-white p-4 flex items-center justify-between border-b-2 border-white/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold">Lịch hẹn theo tuần</h2>
                          <p className="text-xs text-white/80 mt-0.5">
                            {new Date(weekDates[0]).toLocaleDateString("vi-VN", { day: "numeric", month: "long" })} - {new Date(weekDates[6]).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                        {/* Week Navigation */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigateWeek(-1)}
                            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
                            aria-label="Tuần trước"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={goToTodayWeek}
                            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-xs font-medium transition-colors"
                          >
                            Hôm nay
                          </button>
                          <button
                            onClick={() => navigateWeek(1)}
                            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
                            aria-label="Tuần sau"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Week dates header */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {weekDates.map((dateStr, idx) => {
                          const d = new Date(dateStr + "T00:00:00");
                          const dayAppointments = getDayAppointments(dateStr);
                          const isSelectedDay = isSelected(dateStr);
                          const isTodayDay = isToday(dateStr);

                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => {
                                setSelectedDate(dateStr);
                                setShowWeeklyModal(false);
                              }}
                              className={`text-center p-2 rounded-lg transition-all duration-200 ${isSelectedDay
                                ? "bg-white text-[#1B4332] shadow-lg transform scale-105"
                                : isTodayDay
                                  ? "bg-white/25 backdrop-blur-sm hover:bg-white/30"
                                  : "bg-white/10 backdrop-blur-sm hover:bg-white/20"
                                }`}
                            >
                              <p className={`text-[10px] font-semibold mb-1 uppercase tracking-wide ${isSelectedDay ? "text-[#1B4332]/70" : "text-white/80"
                                }`}>
                                {dayNames[idx]}
                              </p>
                              <p className={`text-lg font-bold mb-0.5 ${isSelectedDay ? "text-[#1B4332]" : "text-white"
                                }`}>
                                {d.getDate()}
                              </p>
                              <p className={`text-[10px] mb-1 ${isSelectedDay ? "text-[#1B4332]/70" : "text-white/70"
                                }`}>
                                {d.toLocaleDateString("vi-VN", { month: "short" })}
                              </p>
                              {dayAppointments.length > 0 && (
                                <div className="mt-1">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelectedDay
                                    ? "bg-[#1B4332] text-white"
                                    : "bg-white/30 text-white backdrop-blur-sm"
                                    }`}>
                                    {dayAppointments.length}
                                  </span>
                                </div>
                              )}
                              {isTodayDay && !isSelectedDay && (
                                <div className="mt-0.5">
                                  <span className="text-[8px] text-white/60">Hôm nay</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col items-end gap-2">
                      <button
                        onClick={() => setShowWeeklyModal(false)}
                        className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
                        aria-label="Đóng"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="text-right bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                        <p className="text-[10px] text-white/80 mb-0.5 font-medium">Tổng lịch</p>
                        <p className="text-2xl font-bold">
                          {filteredAppointments.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Content - Timetable */}
                  <div className="flex-1 overflow-auto bg-gray-50">
                    <div className="min-w-[1200px]">
                      {/* Header Row */}
                      <div className="grid grid-cols-8 bg-white border-b-2 border-gray-300 sticky top-0 z-20 shadow-sm">
                        {/* Time column header */}
                        <div className="border-r-2 border-gray-300 bg-gradient-to-br from-gray-100 to-gray-50 p-2 font-bold text-gray-800 text-xs">
                          <div className="flex items-center justify-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Giờ
                          </div>
                        </div>

                        {/* Day column headers */}
                        {weekDates.map((dateStr, idx) => {
                          const d = new Date(dateStr + "T00:00:00");
                          const dayAppointments = getDayAppointments(dateStr);
                          const isSelectedDay = isSelected(dateStr);
                          const isTodayDay = isToday(dateStr);

                          return (
                            <div
                              key={dateStr}
                              className={`border-r-2 border-gray-300 p-2 text-center transition-all ${isSelectedDay
                                ? "bg-gradient-to-br from-[#1B4332] to-[#2D5A47] text-white shadow-lg"
                                : isTodayDay
                                  ? "bg-gradient-to-br from-blue-100 to-blue-50"
                                  : "bg-gradient-to-br from-gray-100 to-gray-50"
                                }`}
                            >
                              <p className={`text-[10px] font-semibold mb-0.5 ${isSelectedDay ? "text-white/90" : "text-gray-600"
                                }`}>
                                {dayNames[idx]}
                              </p>
                              <p className={`text-sm font-bold mb-0.5 ${isSelectedDay ? "text-white" : isTodayDay ? "text-blue-700" : "text-gray-900"
                                }`}>
                                {d.getDate()}
                              </p>
                              <p className={`text-[10px] mb-1 ${isSelectedDay ? "text-white/80" : "text-gray-500"
                                }`}>
                                {d.toLocaleDateString("vi-VN", { month: "short" })}
                              </p>
                              {dayAppointments.length > 0 && (
                                <div className="mt-1">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelectedDay
                                    ? "bg-white/20 text-white border border-white/30"
                                    : isTodayDay
                                      ? "bg-blue-200 text-blue-800"
                                      : "bg-gray-200 text-gray-700"
                                    }`}>
                                    {dayAppointments.length}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Timeline Grid */}
                      <div className="grid grid-cols-8">
                        {/* Time column */}
                        <div className="border-r-2 border-gray-300 bg-white">
                          {timeSlots.map((time) => (
                            <div
                              key={time}
                              className="border-b border-gray-200 h-12 flex items-center justify-end pr-2 bg-gray-50/50"
                            >
                              <span className="text-[10px] font-semibold text-gray-600">
                                {time}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Day columns with appointments */}
                        {weekDates.map((dateStr) => {
                          const dayAppointments = getDayAppointments(dateStr);
                          const isSelectedDay = isSelected(dateStr);
                          const isTodayDay = isToday(dateStr);

                          return (
                            <div
                              key={dateStr}
                              className={`border-r-2 border-gray-300 relative ${isSelectedDay ? "bg-white" : isTodayDay ? "bg-blue-50/30" : "bg-white"
                                }`}
                            >
                              {/* Time grid cells */}
                              <div className="relative" style={{ minHeight: `${timeSlots.length * 48}px` }}>
                                {timeSlots.map((time) => (
                                  <div
                                    key={time}
                                    className="border-b border-gray-200 h-12 hover:bg-gray-50/50 transition-colors"
                                  />
                                ))}

                                {/* Appointments overlay */}
                                {dayAppointments.map((app) => {
                                  const config = slotConfig[app.slot.type] || slotConfig.consult;
                                  const style = getAppointmentStyle(app);
                                  const tailorName = getTailorName(app.slot.tailorId);

                                  return (
                                    <button
                                      key={app.id}
                                      type="button"
                                      onClick={() => {
                                        setSlotDetail({
                                          slot: app.slot,
                                          apps: [app],
                                        });
                                        setShowWeeklyModal(false);
                                      }}
                                      className={`absolute left-0.5 right-0.5 ${config.bg} ${config.border} border rounded-md p-1.5 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer z-10 overflow-hidden`}
                                      style={style}
                                    >
                                      {/* Gradient overlay on hover */}
                                      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>

                                      <div className="relative flex items-start gap-1.5">
                                        <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${config.gradient} flex items-center justify-center text-[10px] flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                                          {config.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-0.5">
                                            <p className={`font-bold text-[10px] ${config.text}`}>
                                              {app.slot.startTime} - {app.slot.endTime}
                                            </p>
                                            <span className={`text-[8px] px-1 py-0.5 rounded-full font-semibold ${app.status === "pending"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : app.status === "confirmed"
                                                ? "bg-blue-100 text-blue-700"
                                                : app.status === "done"
                                                  ? "bg-green-100 text-green-700"
                                                  : "bg-gray-100 text-gray-700"
                                              }`}>
                                              {app.status === "pending" ? "Chờ" :
                                                app.status === "confirmed" ? "OK" :
                                                  app.status === "done" ? "Xong" :
                                                    app.status === "cancelled" ? "Hủy" : app.status}
                                            </span>
                                          </div>
                                          <p className="font-semibold text-gray-900 text-[10px] truncate mb-0.5">
                                            {app.customerId || "Khách lẻ"}
                                          </p>
                                          <div className="flex items-center gap-1 text-[9px] text-gray-600">
                                            <span className="font-medium">{config.label}</span>
                                            <span>•</span>
                                            <span className="truncate">{tailorName}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}


      {/* Slot form modal */}
      {showSlotForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Thêm ca rảnh cho thợ
              </h2>
              <button
                type="button"
                onClick={() => setShowSlotForm(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleCreateSlot}
              className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
            >
              <div>
                <label className="block mb-1 text-slate-600">Ngày</label>
                <input
                  type="date"
                  name="date"
                  value={slotForm.date}
                  onChange={handleSlotFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Thợ phụ trách</label>
                <select
                  name="tailorId"
                  value={slotForm.tailorId}
                  onChange={handleSlotFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">-- Chọn thợ may --</option>
                  {tailors.map((tailor) => (
                    <option
                      key={tailor.id}
                      value={tailor.id}
                    >
                      {tailor.name || tailor.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Giờ bắt đầu</label>
                <input
                  type="time"
                  name="startTime"
                  value={slotForm.startTime}
                  onChange={handleSlotFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Giờ kết thúc</label>
                <input
                  type="time"
                  name="endTime"
                  value={slotForm.endTime}
                  onChange={handleSlotFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
                <div>
                  <label className="block mb-1 text-slate-600 text-xs">Giờ nghỉ (Từ)</label>
                  <input
                    type="time"
                    name="breakStartTime"
                    value={slotForm.breakStartTime}
                    onChange={handleSlotFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 text-xs">Giờ nghỉ (Đến)</label>
                  <input
                    type="time"
                    name="breakEndTime"
                    value={slotForm.breakEndTime}
                    onChange={handleSlotFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Loại lịch</label>
                <select
                  name="type"
                  value={slotForm.type}
                  onChange={handleSlotFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="consult">Tư vấn / chọn mẫu</option>
                  <option value="measure">Đo số đo</option>
                  <option value="fitting">Thử đồ</option>
                  <option value="pickup">Nhận đồ</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-slate-600">
                  Số khách tối đa
                </label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={slotForm.capacity}
                  onChange={handleSlotFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSlotForm(false)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 shadow"
                >
                  Lưu ca rảnh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Slot detail modal */}
      {slotDetail && (
        <SlotDetailModal
          slot={slotDetail.slot}
          appointments={slotDetail.apps}
          tailors={tailors}
          onClose={() => setSlotDetail(null)}
          onUpdateStatus={async (appId, newStatus) => {
            try {
              await appointmentService.updateStatus(appId, { status: newStatus });
              showSuccess(`Đã cập nhật trạng thái: ${newStatus === "done" ? "Hoàn thành" : "Đã hủy"}`);

              // Also update order status if applicable
              const apt = slotDetail.apps?.find(a => a.id === appId);
              if (apt?.orderId) {
                const nextStatus =
                  newStatus === "done"
                    ? apt.type === "pickup" || apt.type === "PICKUP"
                      ? "Hoàn thành"
                      : "Đang may"
                    : undefined;
                if (nextStatus) {
                  try {
                    await orderService.updateStatus(apt.orderId, { status: nextStatus });
                  } catch (error) {
                    console.error("Error updating order status:", error);
                  }
                }
              }

              // Reload appointments after update
              loadData();
            } catch (error) {
              console.error(error);
              showError("Không thể cập nhật trạng thái");
            }
          }}
          onToggleBlock={() => {
            toggleSlotStatus(slotDetail.slot);
            setSlotDetail(null);
          }}
        />
      )}

      {/* Schedule Settings Modal */}
      {showSettingsModal && (
        <ScheduleSettingsModal
          onClose={() => {
            setShowSettingsModal(false);
            loadData(); // Reload data in case settings changed
          }}
          tailors={tailors}
        />
      )}
    </div>
  );
}

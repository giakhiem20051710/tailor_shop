import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../utils/authStorage";
import { orderService, appointmentService, measurementService, userService, workingSlotService } from "../services";
import Header from "../components/Header.jsx";
import CustomerHistory from "../components/CustomerHistory.jsx";
import { showSuccess, showError } from "../components/NotificationToast.jsx";
import {
  Tag, ProgressSteps, StatCard, TabPill,
  OrdersTab, AppointmentsTab, ProfileTab, BookingModal
} from "../components/dashboard";

function CustomerDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [showBooking, setShowBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingType, setBookingType] = useState("consult");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [bookingTime, setBookingTime] = useState(null);
  const [secondaryTypes, setSecondaryTypes] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [customerAppointments, setCustomerAppointments] = useState([]);
  const [slotMap, setSlotMap] = useState({});
  const [tailors, setTailors] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [referralProfile, setReferralProfile] = useState(null);

  // Set page title
  useEffect(() => {
    document.title = "Dashboard khách hàng - My Hiền Tailor";
  }, []);

  const customerId = useMemo(() => user?.username || user?.phone || null, [user]);
  const displayName = useMemo(() => user?.name || user?.username || "Khách hàng", [user]);

  const loadOrdersFromAPI = async (customerId) => {
    try {
      setLoadingOrders(true);
      const response = await orderService.list({ customerId }, { page: 0, size: 100 });
      const responseData = response?.data ?? response?.responseData ?? response;
      const ordersList = responseData?.content ?? responseData?.data ?? [];

      const mappedOrders = ordersList.map((order) => {
        const totalAmount = order.total && Number(order.total) > 0
          ? Number(order.total)
          : (order.expectedBudget ? Number(order.expectedBudget) : 0);

        const rawCreatedAt = order.createdAt || order.appointmentDate || order.dueDate || null;
        const createdAtDate = rawCreatedAt ? (typeof rawCreatedAt === "string" ? new Date(rawCreatedAt) : new Date(rawCreatedAt)) : null;

        return {
          id: order.id,
          code: order.code || `ORD-${order.id}`,
          status: mapOrderStatus(order.status),
          statusRaw: order.status,
          total: totalAmount,
          expectedBudget: order.expectedBudget ? Number(order.expectedBudget) : null,
          receive: createdAtDate ? createdAtDate.toISOString().split("T")[0] : null,
          due: order.dueDate || order.appointmentDate || null,
          appointmentDate: order.appointmentDate,
          productName: order.items?.[0]?.productName || (order.note ? extractProductNameFromNote(order.note) : "Sản phẩm may đo"),
          productType: order.items?.[0]?.productType || extractProductTypeFromNote(order.note),
          description: order.note || "",
          notes: order.note || "",
          customerId: order.customer?.id || customerId,
          measurement: order.measurement ? mapMeasurementFromBE(order.measurement) : null,
          isFabricOrder: false,
          sampleImages: order.attachments?.map(a => a.url) || [],
          createdAt: order.createdAt,
          depositAmount: order.depositAmount ? Number(order.depositAmount) : 0,
          invoiceId: order.invoiceId || null,
          invoiceCode: order.invoiceCode || null
        };
      });

      setOrders(mappedOrders);

      // Measurements are already saved in backend when order is created
      // No need to save again here
    } catch (error) {
      console.error("Error loading orders:", error);
      showError("Không thể tải danh sách đơn hàng.");
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const mapOrderStatus = (status) => {
    if (!status) return "Mới";
    const statusMap = {
      "DRAFT": "Mới",
      "WAITING_FOR_QUOTE": "Chờ báo giá",
      "CONFIRMED": "Đã xác nhận",
      "IN_PROGRESS": "Đang may",
      "FITTING": "Thử đồ",
      "COMPLETED": "Hoàn thành",
      "CANCELLED": "Hủy",
    };
    return statusMap[status] || status;
  };

  const mapMeasurementFromBE = (measurement) => {
    if (!measurement) return null;
    return {
      height: measurement.height,
      weight: measurement.weight,
      neck: measurement.neck,
      chest: measurement.chest,
      waist: measurement.waist,
      hip: measurement.hip,
      shoulder: measurement.shoulder,
      sleeve: measurement.sleeve,
      bicep: measurement.bicep,
      thigh: measurement.thigh,
      crotch: measurement.crotch,
      ankle: measurement.ankle,
      shirtLength: measurement.shirtLength,
      pantsLength: measurement.pantsLength,
      sleeveLength: measurement.sleeve,
      hips: measurement.hip,
    };
  };

  const extractProductNameFromNote = (note) => {
    if (!note) return "Sản phẩm may đo";
    const patterns = [/Product:\s*([^.,\n]*)/i, /Sản phẩm[:\s]+([^.,\n]*)/i];
    for (const pattern of patterns) {
      const match = note.match(pattern);
      if (match && match[1]?.trim()) return match[1].trim();
    }
    return "Sản phẩm may đo";
  };

  const extractProductTypeFromNote = (note) => {
    if (!note) return null;
    const patterns = [/Type:\s*([^.,\n]*)/i, /Loại[:\s]+([^.,\n]*)/i];
    for (const pattern of patterns) {
      const match = note.match(pattern);
      if (match && match[1]?.trim()) return match[1].trim();
    }
    return null;
  };

  // Load tailors from API
  const loadTailors = async () => {
    try {
      const response = await userService.listTailors({ page: 0, size: 100 });
      const responseData = response?.data ?? response?.responseData ?? response;
      const tailorsList = responseData?.content ?? responseData?.data ?? [];
      setTailors(tailorsList);
    } catch (error) {
      console.error("Error loading tailors:", error);
      setTailors([]);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser?.id || currentUser?.userId) {
      loadOrdersFromAPI(currentUser.id || currentUser.userId);
    } else {
      setOrders([]);
    }
    loadTailors();
  }, []);

  useEffect(() => {
    if (location.state?.orderCreated && user) {
      const customerId = user.id || user.userId;
      if (customerId) loadOrdersFromAPI(customerId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user]);

  // Load appointments and working slots from API
  const loadAppointmentsAndSlots = async () => {
    if (!user?.id) return;

    try {
      // Load appointments
      const apptResponse = await appointmentService.list({ customerId: user.id }, { page: 0, size: 100 });
      const apptResponseData = apptResponse?.data ?? apptResponse?.responseData ?? apptResponse;
      const beApps = apptResponseData?.content || apptResponseData?.items || [];

      const mappedApps = beApps.map((appt) => ({
        id: appt.id,
        customerId: appt.customer?.id || user.id,
        orderId: appt.order?.id || null,
        slotId: appt.workingSlot?.id || null,
        type: appt.type || "fitting",
        status: appt.status || "pending",
        appointmentDate: appt.appointmentDate,
        appointmentTime: appt.appointmentTime,
        durationMinutes: appt.durationMinutes,
        estimatedEndTime: appt.estimatedEndTime,
        notes: appt.notes
      }));

      setCustomerAppointments(mappedApps);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setCustomerAppointments([]);
    }

    try {
      // Load working slots (available slots for booking)
      const slotsResponse = await workingSlotService.list({}, { page: 0, size: 500 });
      const slotsResponseData = slotsResponse?.data ?? slotsResponse?.responseData ?? slotsResponse;
      const slotsList = slotsResponseData?.content || slotsResponseData?.data || [];

      // Convert dayOfWeek templates to specific date slots for the next 14 days
      const dayOfWeekMap = {
        'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3, 'THURSDAY': 4,
        'FRIDAY': 5, 'SATURDAY': 6, 'SUNDAY': 0
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const next14Days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
      });

      const generatedSlots = [];

      for (const template of slotsList) {
        if (!template.isActive) continue;

        const templateDayNum = dayOfWeekMap[template.dayOfWeek];
        if (templateDayNum === undefined) continue;

        // Check effectiveFrom/effectiveTo
        const effectiveFrom = template.effectiveFrom ? new Date(template.effectiveFrom) : null;
        const effectiveTo = template.effectiveTo ? new Date(template.effectiveTo) : null;

        for (const date of next14Days) {
          // Check if this date matches the day of week
          if (date.getDay() !== templateDayNum) continue;

          // Check if date is within effective range
          if (effectiveFrom && date < effectiveFrom) continue;
          if (effectiveTo && date > effectiveTo) continue;

          const dateStr = date.toISOString().split('T')[0];

          generatedSlots.push({
            id: `${template.id}-${dateStr}`, // unique ID per date
            templateId: template.id,
            date: dateStr,
            startTime: template.startTime?.substring(0, 5) || "08:00",
            endTime: template.endTime?.substring(0, 5) || "17:00",
            status: "available",
            capacity: template.capacity || 1,
            bookedCount: template.bookedCount || 0,
            tailorId: template.staff?.id || template.staffId,
            tailorName: template.staffName || template.staff?.name,
          });
        }
      }

      console.log('[DEBUG] Generated date slots from templates:', generatedSlots.length);
      console.log('[DEBUG] Sample slot:', generatedSlots[0]);

      setSlotMap(Object.fromEntries(generatedSlots.map(s => [s.id, s])));
      setAvailableSlots(generatedSlots);
    } catch (error) {
      console.error("Error loading working slots:", error);
      setAvailableSlots([]);
      setSlotMap({});
    }
  };

  useEffect(() => {
    loadAppointmentsAndSlots();
  }, [user?.id]);

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    if (typeof amount === "string" && amount.includes("đ")) return amount;
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

  const parseAmount = (val) => Number(val) || 0;

  const formatDateVN = (val) => {
    if (!val) return "—";
    try {
      return new Date(val).toLocaleDateString("vi-VN");
    } catch {
      return val;
    }
  };

  const customerAppointmentsDisplay = useMemo(() => {
    return customerAppointments.map((a) => {
      const slot = a.slotId ? slotMap[a.slotId] : null;
      if (a.slotId && !slot) return null;
      if (!slot && !a.appointmentDate) return null;
      const tailor = slot ? tailors.find(t => t.username === slot.tailorId || t.id === slot.tailorId) || {} : {};
      return {
        id: a.id,
        type: a.type,
        status: a.status,
        date: a.appointmentDate || (slot ? slot.date : ""),
        time: (a.appointmentTime && a.estimatedEndTime)
          ? `${a.appointmentTime.slice(0, 5)} - ${a.estimatedEndTime.slice(0, 5)}`
          : (slot ? `${slot.startTime}–${slot.endTime}` : (a.appointmentTime || "—")),
        duration: a.durationMinutes ? `${a.durationMinutes}p` : "",
        tailorName: tailor.name || "Thợ may",
        location: "123 Nguyễn Thị Minh Khai, Q.1, TP.HCM",
        orderId: a.orderId,
      };
    }).filter(Boolean);
  }, [customerAppointments, slotMap, tailors]);

  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return customerAppointmentsDisplay.filter(a => {
      if (a.status === "done" || a.status === "cancelled") return false;
      return new Date(a.date + "T00:00:00") >= today;
    }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  }, [customerAppointmentsDisplay]);

  const latestOrder = useMemo(() => {
    if (!orders.length) return null;
    return [...orders].sort((a, b) => (b.id || "").toString().localeCompare((a.id || "").toString()))[0];
  }, [orders]);

  const stats = useMemo(() => ({
    totalOrders: orders.length,
    inProgress: orders.filter(o => ["Đang may", "IN_PROGRESS"].includes(o.statusRaw)).length,
    completed: orders.filter(o => ["Hoàn thành", "COMPLETED"].includes(o.statusRaw)).length,
    upcoming: upcomingAppointments.length
  }), [orders, upcomingAppointments]);

  const loyaltyTiers = [
    { id: "silver", name: "Silver", min: 0, benefits: ["Tích 1 điểm / 10k", "Ưu tiên chỉnh sửa"], color: "from-gray-200 to-gray-100", textColor: "text-gray-700" },
    { id: "gold", name: "Gold", min: 15000000, benefits: ["Là hơi & bảo quản", "Ưu tiên lịch cuối tuần"], color: "from-amber-200 to-amber-100", textColor: "text-amber-800" },
    { id: "platinum", name: "Platinum", min: 30000000, benefits: ["Stylist riêng", "Giảm 10% vải premium"], color: "from-slate-200 to-slate-100", textColor: "text-slate-800" }
  ];

  const loyaltyInfo = useMemo(() => {
    const totalSpent = orders.reduce((sum, o) => sum + parseAmount(o.total), 0);
    const points = Math.floor(totalSpent / 10000);
    const sorted = [...loyaltyTiers].sort((a, b) => a.min - b.min);
    let current = sorted[0];
    sorted.forEach(t => { if (totalSpent >= t.min) current = t; });
    const next = sorted.find(t => t.min > current.min) || null;
    const progress = next ? Math.min(100, Math.round(((totalSpent - current.min) / (next.min - current.min)) * 100)) : 100;
    return { totalSpent, points, currentTier: current, nextTier: next, progressToNext: progress };
  }, [orders]);

  // Loyalty and referral are calculated from orders, no need to save to storage
  // They can be stored in backend if needed in the future
  useEffect(() => {
    // Loyalty info is calculated from orders, no storage needed
    // Referral profile can be loaded from backend if API exists
  }, [customerId, loyaltyInfo, displayName]);

  const openBooking = async () => {
    setShowBooking(true);
    setBookingStep(1);
    setBookingType("consult");
    setSecondaryTypes([]);
    setBookingDate("");
    setBookingSlotId(null);
    setBookingTime(null);
    // Reload slots to get latest availability
    await loadAppointmentsAndSlots();
  };

  const bookingTypeLabel = (t) => {
    const labels = { consult: "Tư vấn", measure: "Đo", fitting: "Thử", pickup: "Nhận" };
    return labels[t] || t;
  };

  const handleConfirmBooking = async () => {
    if (!bookingSlotId || !user) return;
    const slot = availableSlots.find(s => s.id === bookingSlotId);
    if (!slot || slot.status !== "available") return;

    try {
      // Create appointment via API
      // Use templateId (original numeric ID) for backend, not the composite string ID
      const appointmentData = {
        workingSlotId: slot.templateId || slot.id, // templateId is the original numeric ID
        appointmentDate: bookingDate,
        appointmentTime: bookingTime + ":00", // Format as HH:mm:ss
        type: bookingType,
        secondaryTypes: secondaryTypes.length > 0 ? secondaryTypes : undefined,
        notes: `Đặt lịch ${bookingTypeLabel(bookingType)} lúc ${bookingTime}${secondaryTypes.length > 0 ? ' + ' + secondaryTypes.map(t => bookingTypeLabel(t)).join(', ') : ''}`
        // orderId, customerId are handled by backend or auth context
      };

      await appointmentService.createByCustomer(appointmentData);

      // Update working slot booked count via API (use templateId)
      const slotIdForUpdate = slot.templateId || slot.id;
      const updatedBookedCount = (slot.bookedCount || 0) + 1;
      await workingSlotService.update(slotIdForUpdate, {
        bookedCount: updatedBookedCount,
        status: updatedBookedCount >= slot.capacity ? "BOOKED" : "AVAILABLE"
      });

      // Reload appointments and slots
      await loadAppointmentsAndSlots();

      // Update order if needed
      if (latestOrder && !latestOrder.appointmentDate) {
        await orderService.update(latestOrder.id, {
          appointmentDate: slot.date,
          note: latestOrder.notes || ""
        });
        const customerIdForOrder = user.id || user.userId;
        if (customerIdForOrder) {
          await loadOrdersFromAPI(customerIdForOrder);
        }
      }

      showSuccess(`Đã đặt lịch ${bookingTypeLabel(bookingType)} vào ${slot.date}`);
      setShowBooking(false);
    } catch (error) {
      console.error("Error confirming booking:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể đặt lịch. Vui lòng thử lại.";
      showError(errorMessage);
    }
  };

  const next14Days = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, []);

  const handleLogout = () => {
    // Only clear auth-related localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const getProgressStep = (status) => {
    if (!status) return 1;
    const statusLower = status.toLowerCase();
    if (statusLower.includes("hoàn thành") || statusLower.includes("completed")) return 3;
    if (statusLower.includes("thử đồ") || statusLower.includes("fitting")) return 2.5;
    if (statusLower.includes("đang may") || statusLower.includes("in_progress") || statusLower.includes("progress")) return 2;
    if (statusLower.includes("xác nhận") || statusLower.includes("confirmed") || statusLower.includes("chờ báo giá") || statusLower.includes("waiting")) return 1.5;
    return 1; // Mới / DRAFT
  };

  const latestStep = latestOrder ? getProgressStep(latestOrder.status) : 0;

  // Lấy các đơn hàng gần đây (tối đa 3 đơn)
  const recentOrders = useMemo(() => {
    if (!orders.length) return [];
    return [...orders]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.receive || 0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.receive || 0);
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-slate-50 text-[#1F2933] body-font antialiased">
      <Header currentPage="/customer/dashboard" />
      <div className="pt-[170px] md:pt-[190px] pb-16">
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <section className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="bg-white/80 rounded-3xl p-6 md:p-8 shadow-sm border border-amber-100">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs uppercase tracking-widest text-amber-600">Customer Dashboard</p>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-amber-700 px-3 py-1 border border-amber-200 rounded-full hover:bg-amber-50"
                >
                  Đăng xuất
                </button>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 leading-tight">
                Chào {displayName},<br />cùng My Hiền Tailor theo dõi đơn may.
              </h1>
              <div className="mt-5 flex gap-3 text-xs flex-wrap">
                <Tag>May theo số đo</Tag>
                <Tag>Giữ số đo an toàn</Tag>
              </div>
              <button
                onClick={openBooking}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700 text-white font-semibold hover:bg-emerald-800 text-xs"
              >
                <span>📅</span> Đặt lịch hẹn
              </button>
            </div>

            {upcomingAppointments.length > 0 ? (
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
                <p className="text-xs uppercase tracking-widest text-emerald-100">Lịch hẹn sắp tới</p>
                <p className="mt-3 text-lg font-semibold">{bookingTypeLabel(upcomingAppointments[0].type)}</p>
                <p className="mt-1 text-sm text-emerald-50">
                  {formatDateVN(upcomingAppointments[0].date)} • {upcomingAppointments[0].time}
                </p>
                <button
                  onClick={() => setActiveTab("appointments")}
                  className="mt-5 bg-white text-emerald-700 px-4 py-2 rounded-full text-xs font-semibold"
                >
                  Xem tất cả
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
                <p className="text-xs uppercase tracking-widest text-amber-200 mb-3">Đơn hàng gần nhất</p>
                {latestOrder ? (
                  <>
                    <p className="text-lg font-semibold mb-2">
                      {latestOrder.code || `Đơn #${latestOrder.id}`}
                    </p>
                    <div className="mt-4 mb-4">
                      <ProgressSteps currentStep={latestStep} />
                    </div>
                    <p className="text-xs text-amber-100 mb-4">
                      Trạng thái: <b>{latestOrder.status}</b>
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-300 mb-4">Bạn chưa có đơn hàng nào.</p>
                )}
                <button
                  onClick={() => navigate("/customer/order")}
                  className="w-full bg-amber-400 text-slate-900 px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-amber-300 transition-all"
                >
                  + Đặt may mới
                </button>
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Tổng đơn"
              value={stats.totalOrders}
              subtitle="Tất cả đơn"
              color="from-slate-900/90 to-slate-800"
              textColor="text-white"
            />
            <StatCard
              label="Đang may"
              value={stats.inProgress}
              subtitle="Đang xử lý"
              color="from-amber-500 to-amber-600"
              textColor="text-white"
            />
            <StatCard
              label="Hoàn thành"
              value={stats.completed}
              subtitle="Đã giao"
              color="from-emerald-500 to-emerald-600"
              textColor="text-white"
            />
            <StatCard
              label="Lịch hẹn"
              value={stats.upcoming}
              subtitle="Sắp tới"
              color="from-rose-400 to-rose-500"
              textColor="text-white"
            />
          </section>

          {/* HÀNH TRÌNH ĐƠN HÀNG GẦN ĐÂY */}
          {recentOrders.length > 0 && (
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-[30px] p-6 md:p-8 shadow-[0_18px_40px_rgba(0,0,0,0.3)] border border-slate-700 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="pointer-events-none absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-12 top-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-amber-200 mb-1">
                      Hành trình đơn hàng
                    </p>
                    <h2 className="heading-font text-[24px] md:text-[28px] text-white font-semibold">
                      Đơn hàng gần đây
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[12px] font-semibold hover:bg-white/20 transition-all"
                  >
                    Xem tất cả →
                  </button>
                </div>

                <div className="space-y-5">
                  {recentOrders.map((order, index) => {
                    const progressStep = getProgressStep(order.status);
                    const orderTypeLabel = order.isFabricOrder ? "Mua vải" : "Đặt may";

                    return (
                      <div
                        key={order.id}
                        className="bg-white/5 backdrop-blur-sm rounded-[20px] border border-white/10 p-5 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[16px] font-bold text-white">
                                {order.code || `Đơn #${order.id}`}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold border border-white/20">
                                {orderTypeLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[12px] text-slate-300">
                              <span>
                                <span className="text-slate-400">Ngày đặt:</span>{" "}
                                <span className="font-medium">{formatDateVN(order.receive) || "—"}</span>
                              </span>
                              <span className="text-slate-500">•</span>
                              <span>
                                <span className="text-slate-400">Ngày hẹn:</span>{" "}
                                <span className="font-medium">{formatDateVN(order.due || order.appointmentDate) || "—"}</span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[14px] font-bold text-amber-300 mb-1">
                              {formatCurrency(order.total)}
                            </p>
                            {order.depositAmount > 0 && (
                              <p className="text-[11px] text-slate-400">
                                Đã cọc: {formatCurrency(order.depositAmount)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${progressStep >= 1 ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-400"
                                }`}>
                                1
                              </div>
                              <span className={`text-[11px] font-medium ${progressStep >= 1 ? "text-white" : "text-slate-400"
                                }`}>
                                Đã tiếp nhận
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${progressStep >= 2 ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-400"
                                }`}>
                                2
                              </div>
                              <span className={`text-[11px] font-medium ${progressStep >= 2 ? "text-white" : "text-slate-400"
                                }`}>
                                Đang may
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${progressStep >= 3 ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-400"
                                }`}>
                                3
                              </div>
                              <span className={`text-[11px] font-medium ${progressStep >= 3 ? "text-white" : "text-slate-400"
                                }`}>
                                Hoàn thành
                              </span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (progressStep / 3) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">Trạng thái hiện tại:</p>
                            <p className="text-[13px] font-semibold text-white">{order.status}</p>
                          </div>
                          <button
                            onClick={() => navigate(`/customer/orders/${order.id}`)}
                            className="px-4 py-2 rounded-full bg-amber-400 text-slate-900 text-[12px] font-semibold hover:bg-amber-300 transition-all"
                          >
                            Xem chi tiết →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => navigate("/customer/order")}
                    className="w-full px-5 py-3 rounded-full bg-amber-400 text-slate-900 text-[13px] font-semibold hover:bg-amber-300 transition-all flex items-center justify-center gap-2"
                  >
                    <span>+</span>
                    <span>Đặt may bộ đồ mới</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="bg-white/80 rounded-3xl shadow-sm border border-slate-200">
            <div className="px-6 pt-4 border-b border-slate-100 flex gap-2">
              {['orders', 'appointments', 'profile', 'history'].map(tab => (
                <TabPill
                  key={tab}
                  active={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'orders' ? 'Đơn hàng' :
                    tab === 'appointments' ? 'Lịch hẹn' :
                      tab === 'profile' ? 'Thông tin' : 'Lịch sử'}
                </TabPill>
              ))}
            </div>
            <div className="p-6">
              {activeTab === 'orders' && (
                <OrdersTab
                  orders={orders}
                  formatCurrency={formatCurrency}
                  navigate={navigate}
                  loadingOrders={loadingOrders}
                />
              )}
              {activeTab === 'appointments' && (
                <AppointmentsTab appointments={upcomingAppointments} />
              )}
              {activeTab === 'profile' && (
                <ProfileTab user={user} />
              )}
              {activeTab === 'history' && (
                <CustomerHistory customerId={user?.username || user?.phone} />
              )}
            </div>
          </section>
        </main>
      </div>

      {showBooking && (
        <BookingModal
          onClose={() => setShowBooking(false)}
          step={bookingStep}
          setStep={setBookingStep}
          bookingType={bookingType}
          setBookingType={setBookingType}
          secondaryTypes={secondaryTypes}
          setSecondaryTypes={setSecondaryTypes}
          bookingDate={bookingDate}
          setBookingDate={setBookingDate}
          bookingSlotId={bookingSlotId}
          setBookingSlotId={setBookingSlotId}
          bookingTime={bookingTime}
          setBookingTime={setBookingTime}
          availableSlots={availableSlots}
          next14Days={next14Days}
          bookingTypeLabel={bookingTypeLabel}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
}


export default CustomerDashboardPage;
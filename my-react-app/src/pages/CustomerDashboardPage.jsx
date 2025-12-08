import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders, updateOrder } from "../utils/orderStorage";
import { getCurrentUser, getUsersByRole, ROLES } from "../utils/authStorage";
import { saveCustomerMeasurements } from "../utils/customerMeasurementsStorage";
import {
  getLoyaltyProfile,
  saveLoyaltyProfile,
} from "../utils/loyaltyStorage.js";
import { getOrCreateReferralProfile } from "../utils/referralStorage.js";
import {
  getWorkingSlots,
  updateWorkingSlot,
} from "../utils/workingSlotStorage.js";
import { addAppointment } from "../utils/appointmentStorage.js";
import { getAppointments } from "../utils/appointmentStorage.js";
import StatusBadge from "../components/StatusBadge";
import Header from "../components/Header.jsx";
import CustomerHistory from "../components/CustomerHistory.jsx";
import usePageMeta from "../hooks/usePageMeta";

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("orders"); // orders | appointments | profile
  const [showBooking, setShowBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: type, 2: date, 3: time
  const [bookingType, setBookingType] = useState("consult");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [customerAppointments, setCustomerAppointments] = useState([]);
  const [slotMap, setSlotMap] = useState({});
  const [tailors, setTailors] = useState([]);

  usePageMeta({
    title: "Dashboard khách hàng My Hiền Tailor | Theo dõi đơn may đo",
    description:
      "Quản lý hành trình may đo, lịch hẹn thử đồ, thông tin cá nhân và ưu đãi dành riêng cho khách hàng My Hiền Tailor.",
    ogImage:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&auto=format&fit=crop&q=80",
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const allOrders = getOrders() || [];
      const customerOrders = allOrders.filter(
        (order) =>
          order.phone === currentUser.phone || 
          order.name === currentUser.name ||
          order.customerId === currentUser.username
      );
      setOrders(customerOrders);

      // Auto-save measurements from orders
      customerOrders.forEach((order) => {
        if (order.measurements && Object.keys(order.measurements).length > 0) {
          const customerId = currentUser.username || currentUser.phone;
          // Normalize measurement keys
          const normalizedMeasurements = {
            ...order.measurements,
            // Map alternative keys to standard keys
            hip: order.measurements.hip || order.measurements.hips,
            sleeveLength: order.measurements.sleeveLength || order.measurements.sleeve,
            orderId: order.id,
          };
          // Remove undefined values
          Object.keys(normalizedMeasurements).forEach(key => {
            if (normalizedMeasurements[key] === undefined || normalizedMeasurements[key] === null) {
              delete normalizedMeasurements[key];
            }
          });
          saveCustomerMeasurements(customerId, normalizedMeasurements);
        }
      });
    }

    // load tailors for displaying
    const tailorUsers = getUsersByRole(ROLES.TAILOR);
    setTailors(tailorUsers);
  }, []);

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    if (typeof amount === "string" && amount.includes("đ")) return amount;
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

const parseAmount = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const numeric = Number(
    value.toString().replace(/[^\d.-]/g, "")
  );
  return Number.isNaN(numeric) ? 0 : numeric;
};

  const formatDateVN = (value) => {
    if (!value) return "—";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString("vi-VN");
    } catch {
      return value;
    }
  };

  // Build customer-facing appointment list with slot info (needed above)
  const customerAppointmentsDisplay = useMemo(() => {
    return customerAppointments
      .map((a) => {
        const slot = slotMap[a.slotId];
        if (!slot) return null;
        const tailor =
          tailors.find(
            (t) => t.username === slot.tailorId || t.id === slot.tailorId
          ) || {};
        return {
          id: a.id,
          type: a.type,
          status: a.status,
          date: slot.date,
          time: `${slot.startTime}–${slot.endTime}`,
          tailorName: tailor.name || "Thợ may",
          location: "123 Nguyễn Thị Minh Khai, Q.1, TP.HCM",
        };
      })
      .filter(Boolean);
  }, [customerAppointments, slotMap, tailors]);

  // Lịch hẹn sắp tới
  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return customerAppointmentsDisplay
      .filter((a) => {
        if (a.status === "done" || a.status === "cancelled") return false;
        const d = new Date(a.date + "T00:00:00");
        return d >= today;
      })
      .sort((a, b) => {
        const ta = new Date(a.date + "T" + a.time.split("–")[0]);
        const tb = new Date(b.date + "T" + b.time.split("–")[0]);
        return ta - tb;
      })
      .slice(0, 5);
  }, [customerAppointmentsDisplay]);

  // Đơn mới nhất (để hiển thị hành trình)
  const latestOrder = useMemo(() => {
    if (!orders.length) return null;
    // Nếu có receive thì sort theo receive, không thì sort theo id
    const sorted = [...orders].sort((a, b) => {
      if (a.receive && b.receive) return b.receive.localeCompare(a.receive);
      return (b.id || "").localeCompare(a.id || "");
    });
    return sorted[0];
  }, [orders]);

  // Thống kê
  const stats = {
    totalOrders: orders.length,
    inProgress: orders.filter((o) => o.status === "Đang may").length,
    completed: orders.filter((o) => o.status === "Hoàn thành").length,
    upcoming: upcomingAppointments.length,
  };

  const loyaltyTiers = [
    {
      id: "silver",
      name: "Silver",
      min: 0,
      benefits: [
        "Tích 1 điểm cho mỗi 10.000₫ chi tiêu",
        "Ưu tiên chỉnh sửa trong 72h",
      ],
      color: "from-gray-200 to-gray-100",
      textColor: "text-gray-700",
    },
    {
      id: "gold",
      name: "Gold",
      min: 15000000,
      benefits: [
        "Tặng kèm dịch vụ là hơi & bảo quản 6 tháng",
        "Ưu tiên lịch thử đồ cuối tuần",
      ],
      color: "from-amber-200 to-amber-100",
      textColor: "text-amber-800",
    },
    {
      id: "platinum",
      name: "Platinum",
      min: 30000000,
      benefits: [
        "Stylist riêng từng mùa sự kiện",
        "Giảm thêm 10% cho kho vải premium",
      ],
      color: "from-slate-200 to-slate-100",
      textColor: "text-slate-800",
    },
  ];

  const loyaltyInfo = useMemo(() => {
    const totalSpent = orders.reduce(
      (sum, order) => sum + parseAmount(order.total),
      0
    );

    const points = Math.floor(totalSpent / 10000); // 1 điểm / 10.000đ
    const sortedTiers = [...loyaltyTiers].sort((a, b) => a.min - b.min);
    let currentTier = sortedTiers[0];

    sortedTiers.forEach((tier) => {
      if (totalSpent >= tier.min) {
        currentTier = tier;
      }
    });

    const nextTier =
      sortedTiers.find((tier) => tier.min > currentTier.min) || null;
    const progressToNext = nextTier
      ? Math.min(
          100,
          Math.round(
            ((totalSpent - currentTier.min) /
              (nextTier.min - currentTier.min)) *
              100
          )
        )
      : 100;

    return {
      totalSpent,
      points,
      currentTier,
      nextTier,
      progressToNext,
    };
  }, [orders]);

  const customerId = user?.username || user?.phone;
  const storedLoyalty = useMemo(
    () => (customerId ? getLoyaltyProfile(customerId) : null),
    [customerId]
  );
  const [referralProfile, setReferralProfile] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  const displayName = user?.name || user?.username || "Khách hàng";

  // Map status -> bước trong hành trình
  const getProgressStep = (status) => {
    switch (status) {
      case "Mới":
        return 1;
      case "Đang may":
        return 2;
      case "Hoàn thành":
        return 3;
      case "Hủy":
        return 0;
      default:
        return 1;
    }
  };

  const latestStep = latestOrder ? getProgressStep(latestOrder.status) : 0;
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    if (!customerId) return;
    saveLoyaltyProfile(customerId, {
      points: loyaltyInfo.points,
      totalSpent: loyaltyInfo.totalSpent,
      tier: loyaltyInfo.currentTier.id,
    });
  }, [customerId, loyaltyInfo]);

  // Load appointments + slots for customer view
  useEffect(() => {
    if (!customerId) return;
    const apps = getAppointments().filter(
      (a) => a.customerId === customerId && a.status !== "cancelled"
    );
    const slots = getWorkingSlots();
    const map = Object.fromEntries(slots.map((s) => [s.id, s]));
    setSlotMap(map);
    setCustomerAppointments(apps);
    setAvailableSlots(slots); // keep slots for booking modal reuse
  }, [customerId]);

  const openBooking = () => {
    setShowBooking(true);
    setBookingStep(1);
    setBookingType("consult");
    setBookingDate("");
    setBookingSlotId(null);
    const slots = getWorkingSlots();
    setAvailableSlots(slots);
  };

  const bookingTypeLabel = (type) => {
    switch (type) {
      case "consult":
        return "Tư vấn / chọn mẫu";
      case "measure":
        return "Đo số đo";
      case "fitting":
        return "Thử đồ";
      case "pickup":
        return "Nhận đồ";
      default:
        return type;
    }
  };

  const handleConfirmBooking = () => {
    if (!bookingSlotId || !user) return;
    const slot = availableSlots.find((s) => s.id === bookingSlotId);
    if (!slot || slot.status !== "available") return;

    const newAppointment = addAppointment({
      customerId,
      slotId: slot.id,
      orderId: null,
      type: bookingType,
      status: "pending",
    });

    const nextBooked = (slot.bookedCount || 0) + 1;
    updateWorkingSlot(slot.id, {
      bookedCount: nextBooked,
      status: nextBooked >= (slot.capacity || 1) ? "booked" : "available",
    });

    // Reload appointments và slots sau khi đặt lịch thành công
    if (customerId) {
      const apps = getAppointments().filter(
        (a) => a.customerId === customerId && a.status !== "cancelled"
      );
      const slots = getWorkingSlots();
      const map = Object.fromEntries(slots.map((s) => [s.id, s]));
      setSlotMap(map);
      setCustomerAppointments(apps);
      setAvailableSlots(slots);
    }

    // Nếu có đơn mới nhất đang "Mới" / "Đang may" thì gắn ngày hẹn vào để dashboard cũ vẫn hiển thị
    if (latestOrder && !latestOrder.appointmentDate) {
      const appointmentDate = slot.date;
      const appointmentTime = `${slot.startTime}–${slot.endTime}`;
      const updated = updateOrder(latestOrder.id, {
        appointmentDate,
        appointmentTime,
        appointmentType: bookingType === "pickup" ? "pickup" : "fitting",
      });
      if (updated) {
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o))
        );
      }
    }

    alert(
      `Đã đặt lịch ${bookingTypeLabel(
        bookingType
      )} vào ${slot.date} ${slot.startTime}–${slot.endTime}.`
    );
    setShowBooking(false);
  };

  const next14Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }).map((_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() + idx);
      return d;
    });
  }, []);

  useEffect(() => {
    if (!customerId) return;
    const profile = getOrCreateReferralProfile(customerId, displayName);
    setReferralProfile(profile);
  }, [customerId, displayName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-slate-50 text-[#1F2933] body-font antialiased">
      <Header currentPage="/customer/dashboard" />

      <div className="pt-[170px] md:pt-[190px] pb-16">
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* HERO + HÀNH TRÌNH ĐƠN */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Hero text */}
          <div className="bg-white/80 rounded-3xl p-6 md:p-8 shadow-sm border border-amber-100">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-600">
                Customer Dashboard
              </p>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-full border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
            <h1 className="mt-3 text-2xl md:text-3xl font-semibold text-slate-900 leading-tight">
              Chào {displayName},<br />
              cùng My Hiền Tailor theo dõi từng bộ may đo của bạn.
            </h1>
            <p className="mt-3 text-sm text-slate-600 max-w-md">
              Xem trạng thái đơn, lịch hẹn thử đồ và cập nhật thông tin cá
              nhân tại một nơi – để mỗi lần đến tiệm là một trải nghiệm dễ
              chịu.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs">
              <Tag>May theo số đo</Tag>
              <Tag>Giữ số đo an toàn</Tag>
              <Tag>Lịch hẹn rõ ràng</Tag>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <button
                onClick={openBooking}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700 text-white font-semibold shadow hover:bg-emerald-800"
              >
                <span>📅</span>
                <span>Đặt lịch tư vấn / đo / thử đồ</span>
              </button>
            </div>
          </div>

          {/* Hành trình đơn mới nhất hoặc Lịch hẹn sắp tới */}
          {upcomingAppointments.length > 0 ? (
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-3xl p-6 md:p-7 shadow-lg relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-100">
                  Lịch hẹn sắp tới
                </p>
                {upcomingAppointments[0] && (
                  <>
                    <p className="mt-3 text-lg font-semibold">
                      {upcomingAppointments[0].type === "consult"
                        ? "Tư vấn / chọn mẫu"
                        : upcomingAppointments[0].type === "measure"
                        ? "Đo số đo"
                        : upcomingAppointments[0].type === "fitting"
                        ? "Thử đồ"
                        : "Nhận đồ"}
                    </p>
                    <p className="mt-2 text-sm text-emerald-50">
                      {upcomingAppointments[0].date
                        ? new Date(upcomingAppointments[0].date).toLocaleDateString("vi-VN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                    {upcomingAppointments[0].time && (
                      <p className="mt-1 text-sm text-emerald-100">
                        ⏰ {upcomingAppointments[0].time}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-emerald-100">
                      📍 {upcomingAppointments[0].location || "123 Nguyễn Thị Minh Khai, Q.1, TP.HCM"}
                    </p>
                    <p className="mt-1 text-xs text-emerald-100">
                      🧵 Thợ: {upcomingAppointments[0].tailorName}
                    </p>
                    {upcomingAppointments.length > 1 && (
                      <p className="mt-3 text-xs text-emerald-100">
                        + {upcomingAppointments.length - 1} lịch hẹn khác
                      </p>
                    )}
                  </>
                )}
                <button
                  onClick={() => setActiveTab("appointments")}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Xem tất cả lịch hẹn
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5h8v8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
          <div className="bg-slate-900 text-slate-50 rounded-3xl p-6 md:p-7 shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-gradient-to-tr from-amber-400/40 to-rose-300/30" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-200">
                Hành trình đơn gần đây
              </p>

              {latestOrder ? (
                <>
                  <p className="mt-3 text-sm text-slate-100">
                    Đơn <span className="font-semibold">{latestOrder.id}</span>{" "}
                    • {latestOrder.styleName || latestOrder.style || "Đặt may"}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                      Ngày đặt: {formatDateVN(latestOrder.receive)} · Ngày hẹn:{" "}
                      {formatDateVN(latestOrder.due)}
                  </p>

                  {/* Progress */}
                  <div className="mt-4">
                    <ProgressSteps currentStep={latestStep} />
                  </div>

                  <p className="mt-4 text-xs text-amber-100">
                    Trạng thái hiện tại:{" "}
                    <span className="font-semibold">
                      {latestOrder.status || "—"}
                    </span>
                  </p>
                </>
              ) : (
                <div className="mt-4 text-sm text-slate-200">
                  Bạn chưa có đơn hàng. Hãy bắt đầu bằng việc đặt may một bộ
                  đồ mới.
              </div>
              )}

              <button
                onClick={() => navigate("/customer/order")}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-amber-300"
              >
                + Đặt may bộ đồ mới
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5h8v8"
                  />
                </svg>
              </button>
            </div>
          </div>
          )}
        </section>

        {/* STAT CARDS */}
        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Tổng đơn hàng"
            value={stats.totalOrders}
            subtitle="Từ trước đến nay"
            color="from-slate-900/90 to-slate-800"
            textColor="text-slate-50"
          />
          <StatCard
            label="Đang may"
            value={stats.inProgress}
            subtitle="Đang được chăm chút"
            color="from-amber-500 to-amber-600"
            textColor="text-amber-50"
          />
          <StatCard
            label="Hoàn thành"
            value={stats.completed}
            subtitle="Sẵn sàng hoặc đã giao"
            color="from-emerald-500 to-emerald-600"
            textColor="text-emerald-50"
          />
          <StatCard
            label="Lịch hẹn sắp tới"
            value={stats.upcoming}
            subtitle="Thử đồ / nhận đồ"
            color="from-rose-400 to-rose-500"
            textColor="text-rose-50"
          />
        </section>

        {/* LOYALTY */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-amber-600">
                  Hội viên thân thiết
                </p>
                <h2 className="heading-font text-[24px] text-slate-900">
                  Bạn đang ở cấp {loyaltyInfo.currentTier.name}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-slate-500">Điểm tích luỹ</p>
                <p className="text-2xl font-semibold text-amber-700">
                  {loyaltyInfo.points.toLocaleString("vi-VN")} pts
                </p>
              </div>
            </div>

            <div className="text-[13px] text-slate-600">
              Tổng chi tiêu:{" "}
              <span className="font-semibold text-slate-900">
                {formatCurrency(loyaltyInfo.totalSpent)}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-[12px] text-slate-500 mb-1">
                <span>{loyaltyInfo.currentTier.name}</span>
                <span>
                  {loyaltyInfo.nextTier
                    ? `${loyaltyInfo.progressToNext}% tới ${loyaltyInfo.nextTier.name}`
                    : "Bạn đang ở hạng cao nhất"}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                  style={{ width: `${loyaltyInfo.progressToNext}%` }}
                />
              </div>
              {loyaltyInfo.nextTier && (
                <p className="text-[12px] text-slate-500 mt-1">
                  Cần chi thêm{" "}
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(
                      Math.max(
                        loyaltyInfo.nextTier.min - loyaltyInfo.totalSpent,
                        0
                      )
                    )}
                  </span>{" "}
                  để đạt hạng {loyaltyInfo.nextTier.name}.
                </p>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[13px] text-amber-900">
              <p className="font-semibold mb-1">Quyền lợi chính:</p>
              <ul className="list-disc pl-4 space-y-1">
                {loyaltyInfo.currentTier.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              {storedLoyalty?.lastUpdated && (
                <p className="text-[11px] text-amber-700 mt-2">
                  Cập nhật:{" "}
                  {new Date(storedLoyalty.lastUpdated).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-slate-50 rounded-3xl p-6 space-y-4">
            <h3 className="text-[18px] font-semibold">Lộ trình thăng hạng</h3>
            <p className="text-[13px] text-slate-300">
              Chi tiêu càng nhiều, quyền lợi càng tăng. Điểm được giữ trong 12
              tháng và dùng để nhận voucher hoặc đổi dịch vụ chăm sóc đồ.
            </p>
            <div className="space-y-3">
              {loyaltyTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-2xl border border-white/10 p-3 bg-gradient-to-r ${tier.color} ${tier.textColor}`}
                >
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{tier.name}</span>
                    <span>
                      Từ {formatCurrency(tier.min)}
                    </span>
                  </div>
                  <ul className="mt-2 text-xs space-y-1 text-slate-700">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REFERRAL */}
        {referralProfile && (
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280]">
                    Giới thiệu bạn bè
                  </p>
                  <h2 className="heading-font text-[22px] text-[#111827]">
                    Mời bạn bè may đo tại My Hiền Tailor
                  </h2>
                  <p className="text-[13px] text-[#6B7280]">
                    Bạn và người được giới thiệu đều nhận ưu đãi giảm 10% cho đơn
                    tiếp theo khi đơn mới hoàn tất.
                  </p>
                </div>
                <div className="text-right text-[12px] text-[#6B7280]">
                  <p>Mã tạo lúc: {new Date(referralProfile.createdAt).toLocaleDateString("vi-VN")}</p>
                  {referralProfile.lastUpdated && (
                    <p>Cập nhật: {new Date(referralProfile.lastUpdated).toLocaleDateString("vi-VN")}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#6B7280]">
                    Mã giới thiệu
                  </p>
                  <p className="text-2xl font-semibold text-[#111827]">
                    {referralProfile.code}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(referralProfile.code);
                      setCopyMessage("Đã sao chép mã!");
                      setTimeout(() => setCopyMessage(""), 2000);
                    }
                  }}
                  className="ml-auto px-4 py-2 rounded-full bg-[#111827] text-white text-[12px] font-medium hover:bg-black"
                >
                  Sao chép
                </button>
                {copyMessage && (
                  <span className="text-[12px] text-emerald-600">{copyMessage}</span>
                )}
              </div>

              <div className="text-[13px] text-[#374151] bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <p className="font-semibold">Link chia sẻ nhanh:</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-sm text-[#6B7280] break-all">
                    https://my-hien-tailor.vn/register?ref={referralProfile.code}
                  </span>
                  <button
                    onClick={() => {
                      const link = `https://my-hien-tailor.vn/register?ref=${referralProfile.code}`;
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(link);
                        setCopyMessage("Đã sao chép link!");
                        setTimeout(() => setCopyMessage(""), 2000);
                      }
                    }}
                    className="px-3 py-1.5 text-[12px] rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Sao chép link
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1B4332] to-[#0B281B] text-white rounded-2xl p-5 space-y-3">
              <h3 className="text-[16px] font-semibold">Cách hoạt động</h3>
              <ol className="list-decimal pl-5 space-y-2 text-[13px] text-white/90">
                <li>Gửi mã hoặc link cho bạn bè khi họ đặt may lần đầu.</li>
                <li>Đơn được đánh dấu giới thiệu khi ghi chú mã trong form đặt may.</li>
                <li>Sau khi đơn hoàn thành, bạn nhận voucher 10% cho lần tiếp theo.</li>
              </ol>
              <div className="mt-4 text-[12px] text-white/80">
                <p>Tổng lượt giới thiệu: {referralProfile.totalReferrals}</p>
                <p>Đã nhận ưu đãi: {referralProfile.successfulReferrals}</p>
              </div>
            </div>
          </section>
        )}

        {/* TABS */}
        <section className="bg-white/80 rounded-3xl shadow-sm border border-slate-200">
          <div className="px-6 pt-4 border-b border-slate-100">
            <div className="inline-flex rounded-full bg-slate-100 p-1 gap-1 text-xs font-medium">
              <TabPill
                active={activeTab === "orders"}
                onClick={() => setActiveTab("orders")}
              >
                Đơn hàng
              </TabPill>
              <TabPill
                active={activeTab === "appointments"}
                onClick={() => setActiveTab("appointments")}
              >
                Lịch hẹn
              </TabPill>
              <TabPill
                active={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
              >
                Thông tin cá nhân
              </TabPill>
              <TabPill
                active={activeTab === "history"}
                onClick={() => setActiveTab("history")}
              >
                Lịch sử
              </TabPill>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "orders" && (
              <OrdersTab
                orders={orders}
                formatCurrency={formatCurrency}
                navigate={navigate}
              />
            )}

            {activeTab === "appointments" && (
              <AppointmentsTab appointments={upcomingAppointments} />
            )}

            {activeTab === "profile" && <ProfileTab user={user} />}

            {activeTab === "history" && (
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
          bookingDate={bookingDate}
          setBookingDate={setBookingDate}
          bookingSlotId={bookingSlotId}
          setBookingSlotId={setBookingSlotId}
          availableSlots={availableSlots}
          next14Days={next14Days}
          bookingTypeLabel={bookingTypeLabel}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
}

/* ====== SUB COMPONENTS ====== */

function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50/60 px-3 py-1 text-[11px] font-medium text-amber-800">
      {children}
    </span>
  );
}

function ProgressSteps({ currentStep }) {
  const steps = [
    { id: 1, label: "Đã tiếp nhận" },
    { id: 2, label: "Đang may" },
    { id: 3, label: "Hoàn thành" },
  ];

  return (
    <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
        {steps.map((step) => {
          const active = currentStep >= step.id;
          return (
            <div key={step.id} className="flex-1 flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold 
                  ${
                    active ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-300"
                  }`}
              >
                {step.id}
              </div>
              {step.id !== steps.length && (
                <div className="flex-1 h-px mx-1 bg-slate-600" />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-slate-200">
        {steps.map((step) => (
          <span key={step.id}>{step.label}</span>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle, color, textColor }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
      <div
        className={`bg-gradient-to-br ${color} ${textColor} px-4 py-4`}
      >
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-80">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-[11px] opacity-90">{subtitle}</p>
          </div>
        </div>
  );
}

function TabPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full transition ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function OrdersTab({ orders, formatCurrency, navigate }) {
  const [orderType, setOrderType] = useState("tailoring"); // "tailoring" | "fabric"
  
  // Tách đơn hàng thành 2 loại
  const tailoringOrders = orders.filter(order => !order.isFabricOrder);
  const fabricOrders = orders.filter(order => order.isFabricOrder === true);
  
  const currentOrders = orderType === "tailoring" ? tailoringOrders : fabricOrders;

  const renderOrderCard = (order) => {
          // Lấy hình ảnh sản phẩm
          let productImage = null;
          if (order.sampleImages && Array.isArray(order.sampleImages) && order.sampleImages.length > 0) {
            productImage = order.sampleImages[0];
          } else if (order.isFabricOrder && order.items && Array.isArray(order.items) && order.items.length > 0) {
            productImage = order.items[0]?.image;
          }

    const productName = order.styleName || order.style || order.productName || (order.isFabricOrder ? "Đơn mua vải" : "Sản phẩm may đo");
    const productCategory = order.productType || order.style || (order.isFabricOrder ? "Vải" : "—");

    return (
            <div
              key={order.id}
              className={`bg-white rounded-lg shadow-md border-2 overflow-hidden hover:shadow-xl transition-all duration-300 ${
                order.isFabricOrder
                  ? "border-indigo-200 hover:border-indigo-300"
                  : "border-teal-200 hover:border-teal-300"
              }`}
            >
              {/* Shop Header - Shopee Style với màu chuyên nghiệp */}
              <div className={`px-4 py-3 border-b ${
                order.isFabricOrder 
                  ? "bg-gradient-to-r from-indigo-50 to-slate-50 border-indigo-200" 
                  : "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 bg-red-500 text-white text-xs rounded font-medium">
                      Yêu thích+
                    </button>
                    <span className="font-medium text-gray-900">My Hiền Fashion Design Studio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-orange-500 text-white text-xs rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Chat
                    </button>
                    <button className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Xem Shop
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Status - Shopee Style với màu chuyên nghiệp */}
              <div className={`px-4 py-3 border-b flex items-center justify-between ${
                order.status === "Hoàn thành" 
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
                  : order.status === "Đang may"
                  ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
                  : "bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-2">
                  {order.status === "Hoàn thành" ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">Giao hàng thành công</span>
                    </>
                  ) : order.status === "Đang may" ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-amber-700">Đang được may</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Đã tiếp nhận</span>
                    </>
                  )}
                </div>
                <StatusBadge luxury status={order.status} />
              </div>

              {/* Product Info - Shopee Style với màu chuyên nghiệp */}
              <div className={`p-4 ${
                order.isFabricOrder 
                  ? "bg-gradient-to-br from-indigo-50/40 to-slate-50/40" 
                  : "bg-gradient-to-br from-teal-50/40 to-cyan-50/40"
              }`}>
                <div className="flex gap-4">
                  {/* Product Image với border màu chuyên nghiệp */}
                  <div 
                    className={`w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer relative shadow-md hover:shadow-lg transition-all duration-300 ${
                      order.isFabricOrder 
                        ? "border-indigo-300 bg-gradient-to-br from-indigo-100 to-slate-100 hover:border-indigo-400" 
                        : "border-teal-300 bg-gradient-to-br from-teal-100 to-cyan-100 hover:border-teal-400"
                    }`}
                    onClick={() => navigate(`/customer/orders/${order.id}`)}
                  >
                    {productImage && productImage.trim() !== "" ? (
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = e.target.nextElementSibling;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full flex items-center justify-center text-gray-400 absolute inset-0 ${productImage ? 'hidden' : ''}`}
                    >
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-medium text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-[#1B4332]"
                      onClick={() => navigate(`/customer/orders/${order.id}`)}
                    >
                      {productName}
                    </h4>
                    {productCategory && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="text-gray-500">Phân loại hàng:</span> {productCategory}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mb-2">x1</p>
                    
                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-red-600">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Info với màu chuyên nghiệp */}
                <div className={`mt-4 pt-4 border-t-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs rounded-lg p-3 ${
                  order.isFabricOrder 
                    ? "bg-indigo-50/60 border-indigo-200" 
                    : "bg-teal-50/60 border-teal-200"
                }`}>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] mb-1">Mã đơn:</span>
                    <span className={`font-bold ${
                      order.isFabricOrder ? "text-indigo-700" : "text-teal-700"
                    }`}>{order.id}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] mb-1">Ngày đặt:</span>
                    <span className="font-medium text-gray-900">
                      {order.receive ? new Date(order.receive).toLocaleDateString("vi-VN") : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] mb-1">Ngày hẹn:</span>
                    <span className="font-medium text-gray-900">
                      {order.due ? new Date(order.due).toLocaleDateString("vi-VN") : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] mb-1">Tổng tiền:</span>
                    <span className="font-bold text-lg text-red-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Shopee Style với màu chuyên nghiệp */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/customer/orders/${order.id}`)}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md ${
                      order.isFabricOrder
                        ? "bg-gradient-to-r from-indigo-600 to-slate-600 text-white hover:from-indigo-700 hover:to-slate-700"
                        : "bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700"
                    }`}
                  >
                    Xem chi tiết
                  </button>
                  {order.status === "Hoàn thành" && (
                    <>
                      <button 
                        onClick={() => navigate(`/customer/orders/${order.id}/review`)}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-sm hover:shadow-md text-sm font-semibold"
                      >
                        Đánh giá
                      </button>
                      <button 
                        onClick={() => navigate(order.isFabricOrder ? "/fabrics" : "/customer/order")}
                        className={`flex-1 px-4 py-2.5 border-2 rounded-lg hover:shadow-md transition-all duration-300 text-sm font-semibold ${
                          order.isFabricOrder
                            ? "border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            : "border-teal-300 text-teal-700 hover:bg-teal-50"
                        }`}
                      >
                        Mua lại
                      </button>
                    </>
                  )}
                  {order.status !== "Hoàn thành" && (
                    <button 
                      onClick={() => {
                        alert("Tính năng chat đang được phát triển");
                      }}
                      className="flex-1 px-4 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:shadow-md transition-all duration-300 text-sm font-semibold"
                    >
                      Liên hệ shop
                    </button>
                  )}
                </div>
              </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs cho loại đơn hàng - Màu chuyên nghiệp */}
      <div className="flex gap-3 border-b-2 border-slate-200 pb-3 mb-4">
        <button
          onClick={() => setOrderType("tailoring")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            orderType === "tailoring"
              ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md scale-105"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Đơn đặt may ({tailoringOrders.length})
        </button>
        <button
          onClick={() => setOrderType("fabric")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            orderType === "fabric"
              ? "bg-gradient-to-r from-indigo-600 to-slate-600 text-white shadow-md scale-105"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Đơn mua vải ({fabricOrders.length})
        </button>
      </div>

      {/* Empty state */}
      {currentOrders.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <p className="text-gray-500 mb-2">
            {orderType === "tailoring" 
              ? "Bạn chưa có đơn đặt may nào" 
              : "Bạn chưa có đơn mua vải nào"}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {orderType === "tailoring"
              ? "Hãy bắt đầu bằng việc đặt may một bộ đồ mới"
              : "Hãy xem danh sách vải và thêm vào giỏ hàng"}
          </p>
          <button
            onClick={() => navigate(orderType === "tailoring" ? "/customer/order" : "/fabrics")}
            className="px-4 py-2 bg-[#1B4332] text-white rounded text-sm font-medium hover:bg-[#14532d] transition-colors"
          >
            {orderType === "tailoring" ? "Đặt may ngay" : "Xem danh sách vải"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {orderType === "tailoring"
              ? `Đây là tất cả đơn đặt may của bạn tại CAM Tailor Studio. (${tailoringOrders.length} đơn)`
              : `Đây là tất cả đơn mua vải của bạn. (${fabricOrders.length} đơn)`}
          </p>
          
          <div className="space-y-4">
            {currentOrders.map((order) => renderOrderCard(order))}
          </div>
        </>
      )}
    </div>
  );
}

function AppointmentsTab({ appointments }) {
  if (!appointments.length) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        Bạn chưa có lịch hẹn nào. Khi có lịch tư vấn / đo / thử / nhận đồ, chúng
        sẽ xuất hiện tại đây.
              </div>
    );
  }

  const primaryAppointment = appointments[0];
  const otherAppointments = appointments.slice(1);

  const typeLabel = (type) => {
    switch (type) {
      case "consult":
        return "Lịch tư vấn / chọn mẫu";
      case "measure":
        return "Lịch đo số đo";
      case "fitting":
        return "Lịch thử đồ";
      case "pickup":
        return "Lịch nhận đồ";
      default:
        return "Lịch hẹn";
    }
  };

  return (
    <div className="space-y-6 text-sm">
      {/* Lịch hẹn sắp tới – card lớn, rõ ràng */}
      <section className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-5 md:p-6 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.22em] text-amber-700 mb-3">
          Lịch hẹn sắp tới của bạn
        </p>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
          {/* Cột ngày giờ nổi bật */}
          <div className="w-full md:w-40 rounded-2xl bg-amber-100/70 px-4 py-4 flex flex-col items-center justify-center text-center shadow-xs">
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-700">
              {typeLabel(primaryAppointment.type)}
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {primaryAppointment.date
                ? new Date(primaryAppointment.date).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-700">
              {primaryAppointment.date
                ? new Date(primaryAppointment.date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                  })
                : ""}
            </p>
            {primaryAppointment.time && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-900 shadow-sm">
                ⏰ {primaryAppointment.time}
              </p>
            )}
          </div>

          {/* Thông tin chi tiết + hành động */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  {typeLabel(primaryAppointment.type)}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  Địa điểm: Atelier My Hiền – 123 Nguyễn Thị Minh Khai, Q.1,
                  TP.HCM
                </p>
              </div>
              <StatusBadge luxury status={primaryAppointment.status} />
            </div>

            <div className="grid gap-3 md:grid-cols-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span>📍</span>
                <span>
                  Atelier My Hiền – 123 Nguyễn Thị Minh Khai, Q.1, TP.HCM
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span>🧵</span>
                <span>Thợ chính: {primaryAppointment.tailorName}</span>
              </div>
              <div className="flex items-start gap-2">
                <span>⏱</span>
                <span>Dự kiến 30–45 phút, bạn nên đến sớm 5–10 phút.</span>
              </div>
            </div>

            <p className="text-xs text-amber-800 bg-amber-50/80 border border-amber-100 rounded-2xl px-3 py-2 inline-flex items-start gap-2">
              <span>💡</span>
              <span>
                Nếu bạn thay đổi được thời gian, hãy gọi hotline 0901 134 256
                hoặc nhắn trước cho tiệm để được sắp xếp lại lịch.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Các lịch hẹn khác (nếu có) */}
      {otherAppointments.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs text-slate-500">
            Các lịch hẹn khác trong thời gian tới.
      </p>
      <div className="space-y-3">
            {otherAppointments.map((app) => (
                  <div
                key={app.id}
                className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 hover:bg-slate-50 transition-colors"
                  >
                      <div>
              <p className="font-semibold text-slate-900">
                    {typeLabel(app.type)}
              </p>
              <p className="mt-1 text-slate-600">
                Ngày:{" "}
                    {app.date
                      ? new Date(app.date).toLocaleDateString("vi-VN")
                  : "—"}
                        </p>
                  {app.time && <p className="text-slate-600">Giờ: {app.time}</p>}
                <p className="text-slate-600">
                    Thợ phụ trách: <span className="font-medium">{app.tailorName}</span>
                  </p>
                </div>
                <StatusBadge luxury status={app.status} />
              </div>
            ))}
          </div>
        </section>
                        )}
                      </div>
  );
}

function BookingModal({
  onClose,
  step,
  setStep,
  bookingType,
  setBookingType,
  bookingDate,
  setBookingDate,
  bookingSlotId,
  setBookingSlotId,
  availableSlots,
  next14Days,
  bookingTypeLabel,
  onConfirm,
}) {
  const typeOptions = [
    { value: "consult", label: "Tư vấn / chọn mẫu" },
    { value: "measure", label: "Đo số đo" },
    { value: "fitting", label: "Thử đồ" },
    { value: "pickup", label: "Nhận đồ" },
  ];

  const selectedDateStr = bookingDate;

  const usableSlots = useMemo(
    () =>
      availableSlots.filter((slot) => {
        if (slot.type !== bookingType) return false;
        if (slot.status !== "available") return false;
        if (selectedDateStr && slot.date !== selectedDateStr) return false;
        const capacity = slot.capacity || 1;
        const booked = slot.bookedCount || 0;
        if (booked >= capacity) return false;
        return true;
      }),
    [availableSlots, bookingType, selectedDateStr]
  );

  const daysWithSlot = new Set(
    availableSlots
      .filter((slot) => slot.type === bookingType && slot.status === "available")
      .map((slot) => slot.date)
  );

  const formatDateLabel = (d) =>
    d.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Đặt lịch tư vấn / đo / thử đồ
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
                  </div>

        <div className="px-4 py-4 space-y-4 text-sm">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                step >= 1 ? "bg-emerald-600 text-white" : "bg-slate-200"
              }`}
            >
              1
            </span>
            <span>Chọn loại lịch</span>
            <span className="h-px flex-1 bg-slate-200 mx-1" />
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                step >= 2 ? "bg-emerald-600 text-white" : "bg-slate-200"
              }`}
            >
              2
            </span>
            <span>Chọn ngày & giờ</span>
          </div>

          {/* Step 1: type */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Bạn muốn đặt lịch cho mục đích nào?
              </p>
              <div className="grid grid-cols-1 gap-2">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setBookingType(opt.value);
                      setStep(2);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                      bookingType === opt.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
          </div>
          )}

          {/* Step 2: date + time */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-800 mb-1">
                  Loại lịch: {bookingTypeLabel(bookingType)}
                </p>
                <p className="text-xs text-slate-500">
                  Chọn một ngày trong 14 ngày tới mà tiệm có ca rảnh phù hợp.
                </p>
              </div>

              {/* Date grid */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                {next14Days.map((d) => {
                  const dateStr = d.toISOString().split("T")[0];
                  const hasSlot = daysWithSlot.has(dateStr);
                  const isSelected = bookingDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={!hasSlot}
                      onClick={() => setBookingDate(dateStr)}
                      className={`px-2 py-2 rounded-lg border ${
                        !hasSlot
                          ? "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"
                          : isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {formatDateLabel(d)}
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-800">
                  Giờ rảnh trong ngày
                </p>
                {bookingDate ? (
                  usableSlots.length ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {usableSlots
                        .slice()
                        .sort((a, b) =>
                          a.startTime.localeCompare(b.startTime)
                        )
                        .map((slot) => {
                          const isSelected = bookingSlotId === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setBookingSlotId(slot.id)}
                              className={`px-2 py-2 rounded-lg border ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="font-semibold">
                                {slot.startTime}–{slot.endTime}
                              </span>
                              <span className="block text-[10px] text-slate-500">
                                Tối đa {slot.capacity || 1} KH
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Ngày này hiện chưa có ca rảnh phù hợp. Vui lòng chọn ngày
                      khác.
                    </p>
                  )
                ) : (
                  <p className="text-xs text-slate-500">
                    Hãy chọn ngày trước rồi chọn giờ.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            {step === 1 ? "Đóng" : "Quay lại"}
          </button>
          <button
            type="button"
            disabled={step === 2 && !bookingSlotId}
            onClick={() => {
              if (step === 1) {
                setStep(2);
              } else if (step === 2) {
                onConfirm();
              }
            }}
            className={`px-4 py-1.5 rounded-full text-white font-semibold ${
              step === 2 && !bookingSlotId
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {step === 1 ? "Tiếp tục" : "Xác nhận lịch"}
          </button>
        </div>
              </div>
          </div>
  );
}

function ProfileTab({ user }) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-500">
        Thông tin cá nhân dùng để liên hệ và ghi trên đơn may của bạn.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileField label="Tên khách hàng" value={user?.name} />
        <ProfileField label="Số điện thoại" value={user?.phone} />
        <ProfileField label="Email" value={user?.email} />
        <ProfileField label="Tên đăng nhập" value={user?.username} />
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-900">{value || "—"}</p>
    </div>
  );
}

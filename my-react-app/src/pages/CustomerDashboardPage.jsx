import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders } from "../utils/orderStorage";
import { getCurrentUser } from "../utils/authStorage";
import StatusBadge from "../components/StatusBadge";
import Header from "../components/Header.jsx";

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("orders"); // orders | appointments | profile

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
    }
  }, []);

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    if (typeof amount === "string" && amount.includes("đ")) return amount;
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

  // Lịch hẹn sắp tới
  const upcomingAppointments = useMemo(() => {
    return orders
      .filter((order) => {
    if (!order.appointmentDate) return false;
    const appointmentDate = new Date(order.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today;
      })
      .sort((a, b) => {
    if (!a.appointmentDate || !b.appointmentDate) return 0;
    return a.appointmentDate.localeCompare(b.appointmentDate);
      })
      .slice(0, 5);
  }, [orders]);

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
              đây là hành trình những bộ đồ may đo của bạn.
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
          </div>

          {/* Hành trình đơn mới nhất */}
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
                    Ngày đặt: {latestOrder.receive || "—"} · Ngày hẹn:{" "}
                    {latestOrder.due || "—"}
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
              <AppointmentsTab upcomingAppointments={upcomingAppointments} />
            )}

            {activeTab === "profile" && <ProfileTab user={user} />}
          </div>
        </section>
      </main>
      </div>
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
  if (!orders.length) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        Bạn chưa có đơn hàng nào. Hãy bắt đầu bằng việc đặt may một bộ đồ
        mới.
              </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-500">
        Đây là tất cả đơn may của bạn tại CAM Tailor Studio.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
                  <thead>
            <tr className="bg-slate-50 text-slate-600 border-b">
                      <th className="p-3 text-left">Mã đơn</th>
                      <th className="p-3 text-left">Ngày đặt</th>
                      <th className="p-3 text-left">Ngày hẹn</th>
                      <th className="p-3 text-left">Trạng thái</th>
                      <th className="p-3 text-left">Tổng tiền</th>
                      <th className="p-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b last:border-0 hover:bg-slate-50/80"
              >
                <td className="p-3 font-medium text-slate-800">
                  {order.id}
                </td>
                <td className="p-3">{order.receive || "—"}</td>
                <td className="p-3">{order.due || "—"}</td>
                        <td className="p-3">
                          <StatusBadge luxury status={order.status} />
                        </td>
                <td className="p-3 font-semibold">
                  {formatCurrency(order.total)}
                </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Xem chi tiết
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
  );
}

function AppointmentsTab({ upcomingAppointments }) {
  if (!upcomingAppointments.length) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        Bạn chưa có lịch hẹn nào. Khi có lịch thử đồ hoặc nhận đồ, chúng
        sẽ xuất hiện tại đây.
              </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-500">
        Các lịch hẹn thử đồ / nhận đồ sắp tới của bạn.
      </p>
      <div className="space-y-3">
                {upcomingAppointments.map((order) => (
                  <div
                    key={order.id}
            className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 hover:bg-slate-50"
                  >
                      <div>
              <p className="font-semibold text-slate-900">
                Đơn {order.id}
              </p>
              <p className="mt-1 text-slate-600">
                {order.appointmentType === "fitting"
                  ? "Lịch hẹn thử đồ"
                  : "Lịch hẹn nhận đồ"}
                        </p>
              <p className="mt-2 text-slate-600">
                Ngày:{" "}
                {order.appointmentDate
                  ? new Date(
                      order.appointmentDate
                    ).toLocaleDateString("vi-VN")
                  : "—"}
                        </p>
                        {order.appointmentTime && (
                <p className="text-slate-600">
                  Giờ: {order.appointmentTime}
                </p>
                        )}
                      </div>
                      <StatusBadge luxury status={order.status} />
                  </div>
                ))}
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

import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import LogoutButton from "../auth/LogoutButton.jsx";
import invoiceService from "../../services/invoiceService";
import orderService from "../../services/orderService";

const menuGroups = [
  {
    title: null,
    items: [
      { label: "Dashboard", path: "/dashboard", icon: "📊" },
    ],
  },
  {
    title: "QUẢN LÝ ĐƠN",
    items: [
      { label: "Đơn đặt may", path: "/orders", icon: "📦", badgeKey: "pendingOrders" },
      { label: "Kanban", path: "/order-kanban", icon: "📌" },
      { label: "Lịch hẹn", path: "/schedule", icon: "📅", badgeKey: "todayAppointments" },
      { label: "Đồ đã may", path: "/tailors/completed", icon: "✅" },
    ],
  },
  {
    title: "KHÁCH HÀNG",
    items: [
      { label: "Khách hàng", path: "/customers", icon: "👥" },
      { label: "Công nợ", path: "/unpaid-customers", icon: "💰", badgeKey: "unpaidCustomers" },
    ],
  },
  {
    title: "TÀI CHÍNH",
    items: [
      { label: "Hóa đơn", path: "/invoice", icon: "🧾" },
      { label: "Giao dịch", path: "/transactions", icon: "💳" },
    ],
  },
  {
    title: "KHUYẾN MÃI",
    items: [
      { label: "Mã giảm giá", path: "/admin/promotions", icon: "🎟️" },
      { label: "Flash Sale", path: "/admin/flash-sales", icon: "⚡" },
      { label: "Thử thách", path: "/admin/challenges", icon: "🎯" },
    ],
  },
  {
    title: "SẢN PHẨM & VẬT LIỆU",
    items: [
      { label: "Mẫu thiết kế", path: "/styles", icon: "🎨" },
      { label: "Quản lý ảnh", path: "/images", icon: "🖼" },
      { label: "Kho vải", path: "/fabric-inventory", icon: "🧵" },
      { label: "Vải / Booking", path: "/fabric-requests", icon: "📋" },
    ],
  },
  {
    title: null,
    items: [
      { label: "Thợ may", path: "/tailors", icon: "✂️" },
      { label: "Tài khoản", path: "/profile", icon: "👤" },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  const [badges, setBadges] = useState({});

  useEffect(() => {
    loadBadges();
    const interval = setInterval(loadBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadBadges = async () => {
    try {
      const [unpaidRes, ordersRes] = await Promise.allSettled([
        invoiceService.getUnpaidCustomers(),
        orderService.list({ status: "pending" }, { page: 0, size: 1 }),
      ]);

      const newBadges = {};

      if (unpaidRes.status === "fulfilled") {
        const data = unpaidRes.value?.responseData || unpaidRes.value?.data || unpaidRes.value || [];
        const count = Array.isArray(data) ? data.length : 0;
        if (count > 0) newBadges.unpaidCustomers = count;
      }

      if (ordersRes.status === "fulfilled") {
        const data = ordersRes.value?.responseData || ordersRes.value?.data || ordersRes.value || {};
        const total = data?.totalElements || data?.content?.length || 0;
        if (total > 0) newBadges.pendingOrders = total > 99 ? "99+" : total;
      }

      setBadges(newBadges);
    } catch {
      /* silent */
    }
  };

  return (
    <div
      style={{
        width: 260,
        background: "linear-gradient(180deg, #14532d 0%, #1a3a2a 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Logo / Brand */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -0.3,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            fontSize: 16,
          }}>
            ✂️
          </span>
          Tiệm May Admin
        </h1>
      </div>

      {/* Menu Groups */}
      <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {menuGroups.map((group, gi) => (
          <div key={gi} style={{ marginTop: group.title ? 12 : 0 }}>
            {group.title && (
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  padding: "4px 12px 6px",
                  margin: 0,
                }}
              >
                {group.title}
              </p>
            )}
            {group.items.map((m, i) => (
              <NavLink
                key={i}
                to={m.path}
                onClick={() => onNavigate && onNavigate()}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "white" : "rgba(255,255,255,0.75)",
                  background: isActive
                    ? "rgba(34, 197, 94, 0.25)"
                    : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  position: "relative",
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains("active"))
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains("active"))
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>
                  {m.icon}
                </span>
                <span style={{ flex: 1 }}>{m.label}</span>
                {m.badgeKey && badges[m.badgeKey] != null && (
                  <span
                    style={{
                      minWidth: 20,
                      height: 20,
                      padding: "0 6px",
                      borderRadius: 10,
                      background: m.badgeKey === "unpaidCustomers"
                        ? "#ef4444"
                        : "#f59e0b",
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {badges[m.badgeKey]}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <LogoutButton />
      </div>
    </div>
  );
}

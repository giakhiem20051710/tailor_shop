import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import orderService from "../services/orderService";
import invoiceService from "../services/invoiceService";
import appointmentService from "../services/appointmentService";
import userService from "../services/userService";
import { exportAllData, exportOrdersToCSV } from "../utils/dataExport.js";
import { showSuccess, showError } from "../components/NotificationToast.jsx";
import useAutoRefresh from "../hooks/useAutoRefresh.js";

const formatCurrency = (n) => (Number(n) || 0).toLocaleString("vi-VN") + " đ";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, inProgressOrders: 0,
    completedOrders: 0, totalInvoices: 0, unpaidCustomers: 0,
    totalDebt: 0, todayAppointments: 0, totalCustomers: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  // Auto-refresh every 30 seconds
  useAutoRefresh(useCallback(() => {
    loadDashboard(true);
    setLastRefresh(new Date());
  }, []), 30000, autoRefreshEnabled);

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    const newAlerts = [];
    try {
      const [ordersRes, invoicesRes, unpaidRes, customersRes, appointmentsRes] =
        await Promise.allSettled([
          orderService.list({}, { page: 0, size: 10, sort: "createdAt,desc" }),
          invoiceService.list({}, { page: 0, size: 100 }),
          invoiceService.getUnpaidCustomers(),
          userService.listCustomers({ page: 0, size: 1 }),
          appointmentService.list({}, { page: 0, size: 100 }),
        ]);

      let totalOrders = 0, pendingOrders = 0, inProgressOrders = 0, completedOrders = 0;
      let recent = [];
      if (ordersRes.status === "fulfilled") {
        const data = ordersRes.value?.responseData || ordersRes.value?.data || ordersRes.value || {};
        const orders = data?.content || [];
        totalOrders = data?.totalElements || orders.length;
        recent = orders.slice(0, 5);
        pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "PENDING").length;
        inProgressOrders = orders.filter((o) => ["in_progress", "IN_PROGRESS", "cutting", "CUTTING", "sewing", "SEWING"].includes(o.status)).length;
        completedOrders = orders.filter((o) => o.status === "completed" || o.status === "COMPLETED").length;
        if (pendingOrders > 0) newAlerts.push({ type: "warning", icon: "📦", title: `${pendingOrders} đơn hàng đang chờ xử lý`, action: () => navigate("/orders"), actionLabel: "Xem đơn" });
      }

      let totalInvoices = 0;
      if (invoicesRes.status === "fulfilled") {
        const data = invoicesRes.value?.responseData || invoicesRes.value?.data || invoicesRes.value || {};
        totalInvoices = data?.totalElements || (data?.content || []).length;
        const overdue = (data?.content || []).filter((inv) => inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== "paid" && inv.status !== "voided");
        if (overdue.length > 0) newAlerts.push({ type: "danger", icon: "⚠️", title: `${overdue.length} hóa đơn đã quá hạn`, action: () => navigate("/invoice"), actionLabel: "Xem hóa đơn" });
      }

      let unpaidCustomers = 0, totalDebt = 0;
      if (unpaidRes.status === "fulfilled") {
        const arr = Array.isArray(unpaidRes.value?.responseData || unpaidRes.value?.data || unpaidRes.value) ? (unpaidRes.value?.responseData || unpaidRes.value?.data || unpaidRes.value) : [];
        unpaidCustomers = arr.length;
        totalDebt = arr.reduce((s, c) => s + (Number(c.totalDue) || 0), 0);
        if (unpaidCustomers > 0) newAlerts.push({ type: "danger", icon: "💰", title: `${unpaidCustomers} khách hàng nợ tổng ${formatCurrency(totalDebt)}`, action: () => navigate("/unpaid-customers"), actionLabel: "Xem công nợ" });
      }

      let totalCustomers = 0;
      if (customersRes.status === "fulfilled") { totalCustomers = (customersRes.value?.responseData || customersRes.value?.data || customersRes.value || {})?.totalElements || 0; }

      let todayAppointments = 0;
      if (appointmentsRes.status === "fulfilled") {
        const appts = (appointmentsRes.value?.responseData || appointmentsRes.value?.data || appointmentsRes.value)?.content || appointmentsRes.value?.responseData || [];
        const today = new Date().toISOString().split("T")[0];
        if (Array.isArray(appts)) {
          todayAppointments = appts.filter((a) => (a.date || a.appointmentDate || "").includes(today)).length;
          if (todayAppointments > 0) newAlerts.push({ type: "info", icon: "📅", title: `${todayAppointments} lịch hẹn hôm nay`, action: () => navigate("/schedule"), actionLabel: "Xem lịch" });
        }
      }

      setStats({ totalOrders, pendingOrders, inProgressOrders, completedOrders, totalInvoices, unpaidCustomers, totalDebt, todayAppointments, totalCustomers });
      setRecentOrders(recent);
      setAlerts(newAlerts);
    } catch (err) { console.error("Dashboard load error:", err); }
    finally { setLoading(false); }
  };

  const alertColors = {
    danger: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", btn: "#dc2626" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", btn: "#f59e0b" },
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", btn: "#3b82f6" },
  };

  const quickActions = [
    { label: "Tạo đơn mới", icon: "📦", path: "/orders/new", color: "#16a34a", bg: "#f0fdf4" },
    { label: "Tạo hóa đơn", icon: "🧾", path: "/invoice", color: "#2563eb", bg: "#eff6ff" },
    { label: "Thêm lịch hẹn", icon: "📅", path: "/schedule", color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Xem công nợ", icon: "💰", path: "/unpaid-customers", color: "#dc2626", bg: "#fef2f2" },
    { label: "Quản lý vải", icon: "🧵", path: "/fabric-inventory", color: "#b45309", bg: "#fffbeb" },
    { label: "Khuyến mãi", icon: "🎟️", path: "/admin/promotions", color: "#0891b2", bg: "#ecfeff" },
  ];

  const statCards = [
    { label: "Tổng đơn hàng", value: stats.totalOrders, icon: "📦", gradient: "linear-gradient(135deg, #22c55e, #16a34a)", sub: `${stats.pendingOrders} chờ xử lý` },
    { label: "Đang may", value: stats.inProgressOrders, icon: "✂️", gradient: "linear-gradient(135deg, #f59e0b, #d97706)", sub: "Đơn đang thực hiện" },
    { label: "Công nợ", value: formatCurrency(stats.totalDebt), icon: "💰", gradient: "linear-gradient(135deg, #ef4444, #dc2626)", sub: `${stats.unpaidCustomers} KH nợ`, isText: true },
    { label: "Khách hàng", value: stats.totalCustomers, icon: "👥", gradient: "linear-gradient(135deg, #3b82f6, #2563eb)", sub: "Tổng số khách" },
  ];

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
        <div style={{ width: 44, height: 44, border: "3px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p>Đang tải dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const statusColors = {
    pending: { bg: "#fef3c7", text: "#92400e", label: "Chờ xử lý" },
    PENDING: { bg: "#fef3c7", text: "#92400e", label: "Chờ xử lý" },
    in_progress: { bg: "#dbeafe", text: "#1e40af", label: "Đang may" },
    IN_PROGRESS: { bg: "#dbeafe", text: "#1e40af", label: "Đang may" },
    completed: { bg: "#dcfce7", text: "#166534", label: "Hoàn thành" },
    COMPLETED: { bg: "#dcfce7", text: "#166534", label: "Hoàn thành" },
    cancelled: { bg: "#fee2e2", text: "#991b1b", label: "Đã hủy" },
    CANCELLED: { bg: "#fee2e2", text: "#991b1b", label: "Đã hủy" },
  };

  return (
    <>
      <style>{`
        .dash-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
        .dash-header-btns { display:flex; gap:8px; }
        .dash-alerts { display:flex; flex-direction:column; gap:8px; margin-bottom:24px; }
        .dash-alert { display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:12px; flex-wrap:wrap; }
        .dash-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .dash-quick-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
        .dash-quick-btn { display:flex; flex-direction:column; align-items:center; gap:6px; padding:16px 8px; border-radius:14px; border:1px solid #f3f4f6; background:white; cursor:pointer; transition:all 0.15s; }
        .dash-recent-grid { display:grid; grid-template-columns:80px 1.5fr 1fr 100px; padding:12px 20px; align-items:center; cursor:pointer; transition:background 0.1s; }
        .dash-recent-grid:hover { background:#f9fafb; }
        @media (max-width: 640px) {
          .dash-stat-grid { grid-template-columns:repeat(2,1fr); gap:10px; }
          .dash-quick-grid { grid-template-columns:repeat(3,1fr); gap:8px; }
          .dash-quick-btn { padding:12px 4px; }
          .dash-recent-grid { grid-template-columns:60px 1fr 80px; }
          .dash-recent-date { display:none; }
          .dash-header-btns { width:100%; }
          .dash-header-btns button { flex:1; font-size:11px; padding:6px 8px; }
          .dash-alert-btn { font-size:11px; padding:4px 10px; }
        }
        @media (min-width:641px) and (max-width:1024px) {
          .dash-stat-grid { grid-template-columns:repeat(2,1fr); }
          .dash-quick-grid { grid-template-columns:repeat(3,1fr); }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a2e1a", margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>Tổng quan hoạt động tiệm may</p>
          </div>
          <div className="dash-header-btns">
            <button onClick={() => { try { exportOrdersToCSV(); showSuccess("Xuất thành công!"); } catch { showError("Lỗi"); } }}
              style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
              📊 Xuất CSV
            </button>
            <button onClick={() => { try { exportAllData(); showSuccess("Backup OK!"); } catch { showError("Lỗi"); } }}
              style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#16a34a,#15803d)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "white" }}>
              💾 Backup
            </button>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 11, color: "#9ca3af" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: autoRefreshEnabled ? "#22c55e" : "#d1d5db", animation: autoRefreshEnabled ? "pulse 2s infinite" : "none" }} />
          <span>Cập nhật lúc {lastRefresh.toLocaleTimeString("vi-VN")}</span>
          <button onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            style={{ border: "none", background: "transparent", color: autoRefreshEnabled ? "#16a34a" : "#9ca3af", fontSize: 11, cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}>
            {autoRefreshEnabled ? "Tạm dừng" : "Bật lại"}
          </button>
          <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="dash-alerts">
            {alerts.map((alert, i) => {
              const c = alertColors[alert.type] || alertColors.info;
              return (
                <div key={i} className="dash-alert" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: 20 }}>{alert.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c.text }}>{alert.title}</span>
                  <button className="dash-alert-btn" onClick={alert.action}
                    style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: c.btn, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {alert.actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Stat Cards */}
        <div className="dash-stat-grid">
          {statCards.map((card, i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: card.gradient }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>{card.label}</p>
                  <p style={{ fontSize: card.isText ? 18 : 30, fontWeight: 800, color: "#1f2937", margin: "8px 0 4px", wordBreak: "break-all" }}>{card.value}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{card.sub}</p>
                </div>
                <span style={{ fontSize: 28, opacity: 0.15, position: "absolute", right: 16, top: 16 }}>{card.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 }}>⚡ Thao tác nhanh</h3>
          <div className="dash-quick-grid">
            {quickActions.map((action, i) => (
              <button key={i} className="dash-quick-btn" onClick={() => navigate(action.path)}
                onMouseEnter={(e) => { e.currentTarget.style.background = action.bg; e.currentTarget.style.borderColor = action.color + "40"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#f3f4f6"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <span style={{ fontSize: 24 }}>{action.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: action.color, textAlign: "center" }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>📋 Đơn hàng gần đây</h3>
              <button onClick={() => navigate("/orders")} style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", border: "none", background: "transparent", cursor: "pointer" }}>
                Xem tất cả →
              </button>
            </div>
            <div>
              {recentOrders.map((order, i) => {
                const sc = statusColors[order.status] || { bg: "#f3f4f6", text: "#6b7280", label: order.status };
                return (
                  <div key={order.id || i} className="dash-recent-grid" onClick={() => navigate(`/orders/${order.id}`)}
                    style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid #f9fafb" : "none" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>#{order.id}</span>
                    <span style={{ fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.customerName || order.styleName || "—"}
                    </span>
                    <span className="dash-recent-date" style={{ fontSize: 13, color: "#6b7280" }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </span>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.text, textAlign: "center" }}>
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

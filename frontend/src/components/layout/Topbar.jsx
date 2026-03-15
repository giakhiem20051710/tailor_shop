import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../../services/userService";
import orderService from "../../services/orderService";
import invoiceService from "../../services/invoiceService";
import useNotifications from "../../hooks/useNotifications";

export default function Topbar({ onToggleSidebar }) {
  const user = JSON.parse(localStorage.getItem("userData") || "null");
  const role = localStorage.getItem("userRole");
  const username =
    user?.name || user?.username || localStorage.getItem("username") || "Người dùng";

  const roleLabels = {
    admin: "Quản trị viên",
    staff: "Nhân viên",
    tailor: "Thợ may",
    customer: "Khách hàng",
  };
  const roleBgColors = { admin: "#dcfce7", staff: "#dbeafe", tailor: "#fef3c7", customer: "#f3e8ff" };
  const roleTextColors = { admin: "#166534", staff: "#1e40af", tailor: "#92400e", customer: "#6b21a8" };

  // Global Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  // Notification Bell State (real-time via WebSocket)
  const { notifications: wsNotifications, unreadCount: wsUnreadCount, markAsRead, markAllAsRead, connected: wsConnected } = useNotifications();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Merge WebSocket notifications with static ones
  const [staticNotifs, setStaticNotifs] = useState([]);

  // Load static/computed notifications (pending orders, unpaid, etc.)
  useEffect(() => {
    loadStaticNotifications();
    const interval = setInterval(loadStaticNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadStaticNotifications = async () => {
    const notifs = [];
    try {
      const [ordersRes, unpaidRes, invoicesRes] = await Promise.allSettled([
        orderService.list({ status: "pending" }, { page: 0, size: 5 }),
        invoiceService.getUnpaidCustomers(),
        invoiceService.list({}, { page: 0, size: 50 }),
      ]);

      if (ordersRes.status === "fulfilled") {
        const data = ordersRes.value?.responseData || ordersRes.value?.data || ordersRes.value || {};
        const total = data?.totalElements || (data?.content || []).length || 0;
        if (total > 0) {
          notifs.push({
            id: "pending-orders",
            icon: "📦",
            title: `${total} đơn hàng đang chờ xử lý`,
            message: "Cần xác nhận và phân công",
            type: "warning",
            link: "/orders",
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (unpaidRes.status === "fulfilled") {
        const data = unpaidRes.value?.responseData || unpaidRes.value?.data || unpaidRes.value || [];
        const arr = Array.isArray(data) ? data : [];
        if (arr.length > 0) {
          const totalDebt = arr.reduce((s, c) => s + (Number(c.totalDue) || 0), 0);
          notifs.push({
            id: "unpaid",
            icon: "💰",
            title: `${arr.length} khách hàng chưa thanh toán`,
            message: `Tổng nợ: ${totalDebt.toLocaleString("vi-VN")} đ`,
            type: "danger",
            link: "/unpaid-customers",
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (invoicesRes.status === "fulfilled") {
        const data = invoicesRes.value?.responseData || invoicesRes.value?.data || invoicesRes.value || {};
        const invoices = data?.content || [];
        const overdue = invoices.filter((inv) => {
          if (!inv.dueDate) return false;
          return new Date(inv.dueDate) < new Date() && inv.status !== "paid" && inv.status !== "voided";
        });
        if (overdue.length > 0) {
          notifs.push({
            id: "overdue",
            icon: "⚠️",
            title: `${overdue.length} hóa đơn quá hạn`,
            message: "Cần nhắc khách thanh toán",
            type: "danger",
            link: "/invoice",
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch { /* silent */ }
    setStaticNotifs(notifs);
  };

  // Combine real-time + static notifications
  const allNotifications = [...wsNotifications, ...staticNotifs];
  const unreadCount = wsUnreadCount + staticNotifs.filter((n) => n.type === "danger" || n.type === "warning").length;

  // Close bell on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    if (bellOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setQuery(""); setResults([]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) { setSearchOpen(false); setQuery(""); setResults([]); }
    };
    if (searchOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const allResults = [];
    try {
      const [customersRes, ordersRes, invoicesRes] = await Promise.allSettled([
        userService.listCustomers({ page: 0, size: 5 }),
        orderService.list({}, { page: 0, size: 10 }),
        invoiceService.list({}, { page: 0, size: 10 }),
      ]);
      if (customersRes.status === "fulfilled") {
        const data = customersRes.value?.responseData?.content || customersRes.value?.data?.content || customersRes.value?.content || [];
        data.filter((c) => (c.name || "").toLowerCase().includes(q.toLowerCase()) || (c.phone || "").toLowerCase().includes(q.toLowerCase()) || (c.username || "").toLowerCase().includes(q.toLowerCase()))
          .slice(0, 3).forEach((c) => allResults.push({ type: "customer", icon: "👤", label: c.name || c.username, sub: c.phone || c.email || "", path: "/customers" }));
      }
      if (ordersRes.status === "fulfilled") {
        const data = ordersRes.value?.responseData?.content || ordersRes.value?.data?.content || ordersRes.value?.content || [];
        data.filter((o) => String(o.id).includes(q) || (o.customerName || "").toLowerCase().includes(q.toLowerCase()))
          .slice(0, 3).forEach((o) => allResults.push({ type: "order", icon: "📦", label: `Đơn #${o.id}`, sub: o.customerName || "", path: `/orders/${o.id}` }));
      }
      if (invoicesRes.status === "fulfilled") {
        const data = invoicesRes.value?.responseData?.content || invoicesRes.value?.data?.content || invoicesRes.value?.content || [];
        data.filter((inv) => (inv.code || "").toLowerCase().includes(q.toLowerCase()) || (inv.customer?.name || "").toLowerCase().includes(q.toLowerCase()))
          .slice(0, 3).forEach((inv) => allResults.push({ type: "invoice", icon: "🧾", label: inv.code, sub: inv.customer?.name || "", path: `/invoice` }));
      }
    } catch { /* silent */ }

    const quickNav = [
      { label: "Dashboard", path: "/dashboard", icon: "📊" }, { label: "Đơn đặt may", path: "/orders", icon: "📦" },
      { label: "Lịch hẹn", path: "/schedule", icon: "📅" }, { label: "Hóa đơn", path: "/invoice", icon: "🧾" },
      { label: "Công nợ", path: "/unpaid-customers", icon: "💰" }, { label: "Khách hàng", path: "/customers", icon: "👥" },
      { label: "Kho vải", path: "/fabric-inventory", icon: "🧵" }, { label: "Mã giảm giá", path: "/admin/promotions", icon: "🎟️" },
      { label: "Flash Sale", path: "/admin/flash-sales", icon: "⚡" }, { label: "Thợ may", path: "/tailors", icon: "✂️" },
    ];
    quickNav.filter((n) => n.label.toLowerCase().includes(q.toLowerCase()))
      .forEach((n) => allResults.push({ type: "page", icon: n.icon, label: n.label, sub: "Đi đến trang", path: n.path }));

    setResults(allResults);
    setSearching(false);
  }, []);

  const handleQueryChange = (val) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (result) => {
    navigate(result.path);
    setSearchOpen(false); setQuery(""); setResults([]);
  };

  const notifTypeColors = {
    danger: { dot: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
    warning: { dot: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    info: { dot: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  };

  return (
    <>
      <style>{`
        .topbar { height:60px; background:white; display:flex; align-items:center; justify-content:space-between; padding:0 20px; border-bottom:1px solid #e5e7eb; position:sticky; top:0; z-index:30; }
        .topbar-left { display:flex; align-items:center; gap:12px; }
        .topbar-hamburger { display:none; align-items:center; justify-content:center; border-radius:6px; padding:6px; color:#6b7280; border:none; background:transparent; cursor:pointer; }
        .topbar-title { font-size:18px; font-weight:600; color:#374151; margin:0; }
        .topbar-search-btn { display:flex; align-items:center; gap:8px; padding:7px 14px; border-radius:10px; border:1px solid #e5e7eb; background:#f9fafb; color:#9ca3af; font-size:13px; cursor:pointer; min-width:260px; transition:all 0.15s; }
        .topbar-search-btn:hover { border-color:#16a34a; background:white; }
        .topbar-right { display:flex; align-items:center; gap:10px; }
        .topbar-role { font-size:11px; font-weight:600; padding:4px 10px; border-radius:20px; }
        .topbar-user { font-size:13px; color:#6b7280; }
        .topbar-user strong { color:#374151; }
        .topbar-search-kbd { padding:2px 6px; border-radius:4px; background:white; border:1px solid #d1d5db; font-size:10px; font-weight:600; color:#6b7280; font-family:inherit; }
        @media (max-width: 768px) {
          .topbar { padding:0 10px; height:50px; }
          .topbar-hamburger { display:inline-flex !important; width:42px; height:42px; }
          .topbar-title { display:none; }
          .topbar-search-btn { min-width:auto; padding:8px 12px; height:40px; border-radius:12px; }
          .topbar-search-btn .search-text, .topbar-search-btn .search-kbd { display:none; }
          .topbar-role { display:none; }
          .topbar-user { display:none; }
          .topbar-notif-dropdown { position:fixed !important; top:54px !important; left:8px !important; right:8px !important; width:auto !important; max-width:none !important; border-radius:16px !important; }
        }
        @media (min-width:769px) and (max-width:1024px) {
          .topbar-search-btn { min-width:200px; }
          .topbar-user { font-size:12px; }
        }
      `}</style>
      <style>{`
        @media (max-width: 768px) {
          .topbar-search-overlay { padding-top:0 !important; }
          .topbar-search-modal { margin:0 !important; max-width:none !important; border-radius:0 !important; min-height:50vh; }
        }
      `}</style>

      <div className="topbar">
        {/* Left */}
        <div className="topbar-left">
          <button type="button" className="topbar-hamburger" onClick={onToggleSidebar}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5M3.75 12h16.5M3.75 18.75h16.5" />
            </svg>
          </button>
          <h2 className="topbar-title">Quản lý tiệm may</h2>
        </div>

        {/* Center: Search */}
        <button className="topbar-search-btn" onClick={() => setSearchOpen(true)}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="search-text" style={{ flex: 1, textAlign: "left" }}>Tìm kiếm nhanh...</span>
          <kbd className="search-kbd topbar-search-kbd">Ctrl+K</kbd>
        </button>

        {/* Right */}
        <div className="topbar-right">
          {/* 🔔 Notification Bell */}
          <div ref={bellRef} style={{ position: "relative" }}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              style={{
                position: "relative", width: 38, height: 38, borderRadius: 10,
                border: "1px solid #e5e7eb", background: bellOpen ? "#f0fdf4" : "white",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#16a34a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = bellOpen ? "#16a34a" : "#e5e7eb"; }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={unreadCount > 0 ? "#f59e0b" : "#6b7280"} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  minWidth: 18, height: 18, borderRadius: 9,
                  background: "#ef4444", color: "white", fontSize: 10,
                  fontWeight: 700, display: "flex", alignItems: "center",
                  justifyContent: "center", padding: "0 4px",
                  border: "2px solid white",
                  animation: "bellPulse 2s ease-in-out infinite",
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {bellOpen && (
              <div className="topbar-notif-dropdown" style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 360, maxWidth: "90vw",
                background: "white", borderRadius: 16, border: "1px solid #e5e7eb",
                boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                animation: "slideDown 0.15s ease-out", overflow: "hidden", zIndex: 50,
              }}>
                <div style={{
                  padding: "14px 18px", borderBottom: "1px solid #f3f4f6",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1f2937" }}>
                      🔔 Thông báo
                    </h4>
                    {wsConnected && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} title="Real-time connected" />
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                        style={{
                          fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 8,
                          background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
                          cursor: "pointer",
                        }}
                      >
                        Đọc tất cả
                      </button>
                    )}
                    {unreadCount > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                        background: "#fef2f2", color: "#dc2626",
                      }}>
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {allNotifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      Không có thông báo mới
                    </div>
                  ) : (
                    allNotifications.map((n, idx) => {
                      const nType = n.type || "info";
                      const c = notifTypeColors[nType] || notifTypeColors.info;
                      const timeStr = n.createdAt
                        ? new Date(n.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                        : "";
                      return (
                        <button
                          key={n.id || idx}
                          onClick={() => {
                            if (n.id && typeof n.id === "number") markAsRead(n.id);
                            navigate(n.link || "/dashboard");
                            setBellOpen(false);
                          }}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            width: "100%", padding: "12px 18px",
                            border: "none", borderBottom: "1px solid #f9fafb",
                            background: n.isRead === false ? "#fefce8" : "transparent",
                            cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = c.bg)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = n.isRead === false ? "#fefce8" : "transparent")}
                        >
                          <span style={{
                            fontSize: 20, width: 36, height: 36, borderRadius: 10,
                            background: c.bg, border: `1px solid ${c.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            {n.icon}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: n.isRead === false ? 700 : 500, color: "#1f2937" }}>{n.title}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{n.message || n.sub}</div>
                          </div>
                          {timeStr && (
                            <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{timeStr}</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
                <button
                  onClick={() => { navigate("/dashboard"); setBellOpen(false); }}
                  style={{
                    display: "block", width: "100%", padding: "12px 18px",
                    borderTop: "1px solid #f3f4f6", border: "none",
                    background: "#f9fafb", color: "#16a34a", fontSize: 12,
                    fontWeight: 600, cursor: "pointer", textAlign: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#f9fafb")}
                >
                  Xem tất cả trên Dashboard →
                </button>
              </div>
            )}
          </div>

          {role && (
            <span className="topbar-role" style={{ background: roleBgColors[role] || "#f3f4f6", color: roleTextColors[role] || "#6b7280" }}>
              {roleLabels[role] || role}
            </span>
          )}
          <span className="topbar-user">
            Xin chào, <strong>{username}</strong>
          </span>
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="topbar-search-overlay" style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          paddingTop: "12vh",
        }}>
          <div ref={searchRef} className="topbar-search-modal" style={{
            width: "100%", maxWidth: 560, margin: "0 16px",
            background: "white", borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
            animation: "slideDown 0.15s ease-out",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input ref={inputRef} type="text" placeholder="Tìm khách hàng, đơn hàng, hóa đơn, trang..."
                value={query} onChange={(e) => handleQueryChange(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#1f2937", background: "transparent" }}
              />
              <kbd onClick={() => { setSearchOpen(false); setQuery(""); setResults([]); }}
                style={{ padding: "3px 8px", borderRadius: 4, background: "#f3f4f6", border: "1px solid #d1d5db", fontSize: 10, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
                ESC
              </kbd>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {searching && <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>Đang tìm kiếm...</div>}
              {!searching && query.length >= 2 && results.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>Không tìm thấy kết quả cho "{query}"</div>
              )}
              {!searching && results.length > 0 && (
                <div style={{ padding: "8px 0" }}>
                  {results.map((r, i) => (
                    <button key={i} onClick={() => handleSelect(r)}
                      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 20px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 14, transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{r.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                        {r.sub && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>{r.sub}</div>}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 12, textTransform: "uppercase", letterSpacing: 0.5,
                        background: r.type === "customer" ? "#dbeafe" : r.type === "order" ? "#fef3c7" : r.type === "invoice" ? "#f3e8ff" : "#ecfdf5",
                        color: r.type === "customer" ? "#1e40af" : r.type === "order" ? "#92400e" : r.type === "invoice" ? "#6b21a8" : "#166534",
                      }}>
                        {r.type === "customer" ? "KH" : r.type === "order" ? "Đơn" : r.type === "invoice" ? "HĐ" : "Trang"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {!searching && query.length < 2 && (
                <div style={{ padding: "20px 24px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Đi nhanh đến</p>
                  {[
                    { label: "Đơn đặt may", path: "/orders", icon: "📦" },
                    { label: "Hóa đơn", path: "/invoice", icon: "🧾" },
                    { label: "Công nợ", path: "/unpaid-customers", icon: "💰" },
                    { label: "Lịch hẹn", path: "/schedule", icon: "📅" },
                    { label: "Khách hàng", path: "/customers", icon: "👥" },
                  ].map((item, i) => (
                    <button key={i} onClick={() => handleSelect(item)}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 13, borderRadius: 8, color: "#374151", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>{item.icon}</span><span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bellPulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.15) } }
      `}</style>
    </>
  );
}

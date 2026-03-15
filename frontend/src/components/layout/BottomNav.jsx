import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const navItems = [
    { label: "Trang chủ", path: "/dashboard", icon: "🏠", activeIcon: "🏡" },
    { label: "Đơn hàng", path: "/orders", icon: "📦", activeIcon: "📦" },
    { label: "Kanban", path: "/order-kanban", icon: "📌", activeIcon: "📌" },
    { label: "Công nợ", path: "/unpaid-customers", icon: "💰", activeIcon: "💰" },
    { label: "Thêm", path: null, icon: "☰", activeIcon: "☰", isMenu: true },
];

const moreMenuItems = [
    { label: "Lịch hẹn", path: "/schedule", icon: "📅" },
    { label: "Hóa đơn", path: "/invoice", icon: "🧾" },
    { label: "Khách hàng", path: "/customers", icon: "👥" },
    { label: "Thợ may", path: "/tailors", icon: "✂️" },
    { label: "Kho vải", path: "/fabric-inventory", icon: "🧵" },
    { label: "Mã giảm giá", path: "/admin/promotions", icon: "🎟️" },
    { label: "Flash Sale", path: "/admin/flash-sales", icon: "⚡" },
    { label: "Giao dịch", path: "/transactions", icon: "💳" },
    { label: "Tài khoản", path: "/profile", icon: "👤" },
];

export default function BottomNav() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleItemClick = (item) => {
        if (item.isMenu) {
            setMenuOpen(!menuOpen);
        } else {
            navigate(item.path);
            setMenuOpen(false);
        }
    };

    const isActive = (path) => {
        if (!path) return false;
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    return (
        <>
            <style>{`
        .bottom-nav { display:none; }
        @media (max-width: 768px) {
          .bottom-nav {
            display:flex; position:fixed; bottom:0; left:0; right:0; z-index:50;
            background:white; border-top:1px solid #e5e7eb;
            padding:4px 0 calc(4px + env(safe-area-inset-bottom, 0px));
            box-shadow:0 -2px 16px rgba(0,0,0,0.06);
          }
        }
      `}</style>

            {/* More Menu Overlay */}
            {menuOpen && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 49,
                        background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
                    }}
                    onClick={() => setMenuOpen(false)}
                >
                    <div
                        style={{
                            position: "absolute", bottom: 66, left: 8, right: 8,
                            background: "white", borderRadius: 20,
                            boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
                            padding: "16px 8px", maxHeight: "60vh", overflowY: "auto",
                            animation: "slideUp 0.2s ease-out",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p style={{
                            fontSize: 11, fontWeight: 700, color: "#9ca3af",
                            textTransform: "uppercase", letterSpacing: 1.5,
                            padding: "0 12px", marginBottom: 8,
                        }}>
                            Menu
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                            {moreMenuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => { navigate(item.path); setMenuOpen(false); }}
                                    style={{
                                        display: "flex", flexDirection: "column", alignItems: "center",
                                        gap: 4, padding: "12px 4px", borderRadius: 14,
                                        border: "none", cursor: "pointer",
                                        background: isActive(item.path) ? "#f0fdf4" : "transparent",
                                        transition: "background 0.1s",
                                    }}
                                >
                                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                                    <span style={{
                                        fontSize: 10, fontWeight: 600,
                                        color: isActive(item.path) ? "#16a34a" : "#6b7280",
                                    }}>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Nav Bar */}
            <nav className="bottom-nav">
                {navItems.map((item) => {
                    const active = item.isMenu ? menuOpen : isActive(item.path);
                    return (
                        <button
                            key={item.label}
                            onClick={() => handleItemClick(item)}
                            style={{
                                flex: 1, display: "flex", flexDirection: "column",
                                alignItems: "center", gap: 2, padding: "6px 0",
                                border: "none", cursor: "pointer",
                                background: "transparent",
                                transition: "all 0.15s",
                            }}
                        >
                            <span style={{
                                fontSize: 20,
                                transform: active ? "scale(1.15)" : "scale(1)",
                                transition: "transform 0.15s",
                            }}>
                                {active ? item.activeIcon : item.icon}
                            </span>
                            <span style={{
                                fontSize: 9, fontWeight: 700,
                                color: active ? "#16a34a" : "#9ca3af",
                                letterSpacing: 0.3,
                            }}>
                                {item.label}
                            </span>
                            {active && !item.isMenu && (
                                <div style={{
                                    width: 4, height: 4, borderRadius: 2,
                                    background: "#16a34a", marginTop: -1,
                                }} />
                            )}
                        </button>
                    );
                })}
            </nav>

            <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
        </>
    );
}

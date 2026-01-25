import { NavLink } from "react-router-dom";
import LogoutButton from "../auth/LogoutButton.jsx";

export default function Sidebar({ onNavigate }) {
  const menu = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Đơn đặt may", path: "/orders" },
    { label: "📅 Lịch hẹn", path: "/schedule" },
    { label: "✅ Đồ đã may", path: "/tailors/completed" },
    { label: "Khách hàng", path: "/customers" },
    { label: "Thợ may", path: "/tailors" },
    { label: "Mẫu thiết kế", path: "/styles" },
    { label: "🖼 Quản lý ảnh", path: "/images" },
    { label: "Hóa đơn", path: "/invoice" },
    { label: "🎟️ Mã giảm giá", path: "/admin/promotions" },
    { label: "⚡ Flash Sale", path: "/admin/flash-sales" },
    { label: "🎯 Thử thách", path: "/admin/challenges" },
    { label: "Giao dịch", path: "/transactions" },
    { label: "Kho vải", path: "/fabric-inventory" },
    { label: "Vải / Booking", path: "/fabric-requests" },
    { label: "Tài khoản", path: "/profile" },
  ];

  return (
    <div className="w-64 bg-green-900 text-white p-5 flex flex-col h-screen">
      <h1 className="text-2xl font-bold mb-6">Tiệm May Admin</h1>

      <nav className="flex flex-col gap-1 flex-1">
        {menu.map((m, i) => (
          <NavLink
            key={i}
            to={m.path}
            onClick={() => {
              if (onNavigate) onNavigate();
            }}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg transition ${isActive ? "bg-green-700 font-semibold" : "hover:bg-green-800"
              }`
            }
          >
            {m.label}
          </NavLink>
        ))}
      </nav>

      <LogoutButton />
    </div>
  );
}


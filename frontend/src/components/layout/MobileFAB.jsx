import { useState } from "react";
import { useNavigate } from "react-router-dom";

const actions = [
    { label: "Tạo đơn mới", path: "/orders/new", icon: "📦", color: "#16a34a" },
    { label: "Tạo hóa đơn", path: "/invoice", icon: "🧾", color: "#2563eb" },
    { label: "Thêm lịch hẹn", path: "/schedule", icon: "📅", color: "#7c3aed" },
    { label: "Xem công nợ", path: "/unpaid-customers", icon: "💰", color: "#dc2626" },
];

export default function MobileFAB() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const handleAction = (path) => {
        navigate(path);
        setOpen(false);
    };

    return (
        <>
            <style>{`
        .mobile-fab-wrapper { display:none; }
        @media (max-width: 768px) {
          .mobile-fab-wrapper { display:block; position:fixed; bottom:72px; right:16px; z-index:48; }
        }
      `}</style>

            <div className="mobile-fab-wrapper">
                {/* Action buttons */}
                {open && (
                    <>
                        {/* Backdrop */}
                        <div
                            style={{ position: "fixed", inset: 0, zIndex: 47 }}
                            onClick={() => setOpen(false)}
                        />

                        {/* Action items */}
                        <div style={{
                            position: "absolute", bottom: 60, right: 0,
                            display: "flex", flexDirection: "column", gap: 10,
                            alignItems: "flex-end", zIndex: 48,
                        }}>
                            {actions.map((action, i) => (
                                <button
                                    key={action.path}
                                    onClick={() => handleAction(action.path)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "10px 16px", borderRadius: 28,
                                        border: "none", background: "white",
                                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                                        cursor: "pointer",
                                        animation: `fabItemIn 0.2s ease-out ${i * 0.05}s both`,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                                        {action.label}
                                    </span>
                                    <span style={{
                                        width: 36, height: 36, borderRadius: 18,
                                        background: action.color, color: "white",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 16,
                                    }}>
                                        {action.icon}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Main FAB */}
                <button
                    onClick={() => setOpen(!open)}
                    style={{
                        width: 52, height: 52, borderRadius: 26,
                        border: "none", cursor: "pointer",
                        background: open
                            ? "linear-gradient(135deg, #ef4444, #dc2626)"
                            : "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "white",
                        boxShadow: "0 6px 20px rgba(22,163,74,0.35)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                        transform: open ? "rotate(45deg)" : "rotate(0)",
                        position: "relative", zIndex: 48,
                    }}
                >
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>
            </div>

            <style>{`
        @keyframes fabItemIn {
          from { opacity:0; transform:translateY(10px) scale(0.9); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>
        </>
    );
}

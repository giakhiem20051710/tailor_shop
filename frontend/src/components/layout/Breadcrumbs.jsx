import { useLocation, Link } from "react-router-dom";

const routeLabels = {
    dashboard: "Dashboard",
    orders: "Đơn đặt may",
    "orders/new": "Tạo đơn mới",
    schedule: "Lịch hẹn",
    customers: "Khách hàng",
    tailors: "Thợ may",
    "tailors/completed": "Đồ đã may",
    styles: "Mẫu thiết kế",
    images: "Quản lý ảnh",
    invoice: "Hóa đơn",
    "unpaid-customers": "Công nợ",
    transactions: "Giao dịch",
    "admin/promotions": "Mã giảm giá",
    "admin/flash-sales": "Flash Sale",
    "admin/challenges": "Thử thách",
    "fabric-inventory": "Kho vải",
    "fabric-requests": "Vải / Booking",
    profile: "Tài khoản",
    "order-kanban": "Kanban đơn hàng",
};

export default function Breadcrumbs() {
    const location = useLocation();
    const pathParts = location.pathname.split("/").filter(Boolean);

    if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === "dashboard")) {
        return null; // Don't show on dashboard
    }

    const crumbs = [];
    crumbs.push({ label: "Dashboard", path: "/dashboard" });

    let currentPath = "";
    for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        currentPath += (currentPath ? "/" : "") + part;

        // Check multi-level keys first (e.g., "admin/promotions")
        const twoLevel = i > 0 ? pathParts[i - 1] + "/" + part : null;
        const label = (twoLevel && routeLabels[twoLevel]) || routeLabels[currentPath] || routeLabels[part];

        if (label) {
            // Skip if parent was already added as part of two-level
            if (twoLevel && routeLabels[twoLevel] && crumbs.length > 0 && crumbs[crumbs.length - 1].label === routeLabels[pathParts[i - 1]]) {
                crumbs[crumbs.length - 1] = { label, path: "/" + currentPath };
            } else {
                crumbs.push({ label, path: "/" + currentPath });
            }
        } else if (/^\d+$/.test(part)) {
            // Numeric ID — add as detail
            crumbs.push({ label: `#${part}`, path: "/" + currentPath });
        }
    }

    if (crumbs.length <= 1) return null;

    return (
        <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {i > 0 && (
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        )}
                        {isLast ? (
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{crumb.label}</span>
                        ) : (
                            <Link
                                to={crumb.path}
                                style={{
                                    fontSize: 13, color: "#6b7280", textDecoration: "none",
                                    transition: "color 0.15s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#16a34a")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}

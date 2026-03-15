import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import orderService from "../services/orderService";
import useAutoRefresh from "../hooks/useAutoRefresh.js";

const COLUMNS = [
    { key: "pending", label: "Chờ xử lý", icon: "📋", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    { key: "in_progress", label: "Đang thực hiện", icon: "✂️", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    { key: "cutting", label: "Đang cắt", icon: "📐", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
    { key: "sewing", label: "Đang may", icon: "🧵", color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
    { key: "completed", label: "Hoàn thành", icon: "✅", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
];

const STATUS_MATCHES = {
    pending: ["pending", "PENDING"],
    in_progress: ["in_progress", "IN_PROGRESS"],
    cutting: ["cutting", "CUTTING"],
    sewing: ["sewing", "SEWING"],
    completed: ["completed", "COMPLETED"],
};

export default function OrderKanbanPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [dragging, setDragging] = useState(null);
    const [dragOver, setDragOver] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const touchStart = useRef(null);

    useEffect(() => { loadOrders(); }, []);

    // Auto-refresh every 30s
    useAutoRefresh(useCallback(() => {
        loadOrders(true);
        setLastRefresh(new Date());
    }, []), 30000);

    const loadOrders = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await orderService.list({}, { page: 0, size: 200, sort: "createdAt,desc" });
            const data = res?.responseData || res?.data || res || {};
            const list = data?.content || [];
            // Filter active orders only
            setOrders(list.filter((o) => o.status !== "cancelled" && o.status !== "CANCELLED"));
        } catch (err) {
            console.error("Failed to load orders:", err);
        } finally { setLoading(false); }
    };

    const getOrdersByStatus = (statusKey) => {
        const matches = STATUS_MATCHES[statusKey] || [statusKey];
        return orders.filter((o) => matches.includes(o.status));
    };

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdating(orderId);
        try {
            await orderService.updateStatus(orderId, { status: newStatus });
            // Optimistic update
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
            );
        } catch (err) {
            console.error("Failed to update status:", err);
            // Revert on error
            await loadOrders(true);
        } finally {
            setUpdating(null);
            setDragging(null);
            setDragOver(null);
        }
    };

    // Drag & Drop handlers
    const handleDragStart = (e, order) => {
        setDragging(order.id);
        e.dataTransfer.setData("orderId", String(order.id));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, colKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(colKey);
    };

    const handleDragLeave = () => setDragOver(null);

    const handleDrop = (e, colKey) => {
        e.preventDefault();
        const orderId = Number(e.dataTransfer.getData("orderId"));
        if (orderId && colKey) {
            const order = orders.find((o) => o.id === orderId);
            const currentMatches = STATUS_MATCHES[colKey] || [];
            if (order && !currentMatches.includes(order.status)) {
                handleStatusChange(orderId, colKey);
            }
        }
        setDragOver(null);
        setDragging(null);
    };

    // Touch drag handlers for mobile
    const handleTouchStart = (order) => {
        touchStart.current = { orderId: order.id, time: Date.now() };
    };

    if (loading) {
        return (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
                <div style={{ width: 44, height: 44, border: "3px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                <p>Đang tải Kanban...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    return (
        <>
            <style>{`
        .kanban-wrapper { max-width:100%; overflow-x:auto; padding-bottom:16px; }
        .kanban-board { display:flex; gap:12px; min-height:calc(100vh - 200px); }
        .kanban-col { min-width:240px; flex:1; max-width:320px; display:flex; flex-direction:column; }
        .kanban-col-header { padding:12px 14px; border-radius:14px 14px 0 0; display:flex; align-items:center; justify-content:space-between; }
        .kanban-col-body { flex:1; padding:8px; border:2px dashed transparent; border-radius:0 0 14px 14px; background:white; min-height:200px; transition:all 0.2s; }
        .kanban-col-body.drag-over { border-color:#16a34a; background:#f0fdf4; }
        .kanban-card { padding:12px 14px; border-radius:12px; border:1px solid #e5e7eb; background:white; margin-bottom:8px; cursor:grab; transition:all 0.15s; position:relative; }
        .kanban-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); transform:translateY(-1px); }
        .kanban-card.is-dragging { opacity:0.5; transform:scale(0.95); }
        .kanban-card.is-updating { opacity:0.6; pointer-events:none; }
        @media (max-width: 768px) {
          .kanban-board { flex-direction:column; }
          .kanban-col { min-width:auto; max-width:none; }
          .kanban-col-body { min-height:auto; }
          .kanban-card { cursor:pointer; }
          .kanban-mobile-actions { display:flex !important; }
        }
        @media (min-width: 769px) {
          .kanban-mobile-actions { display:none !important; }
        }
      `}</style>

            <div style={{ maxWidth: 1600, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2e1a", margin: 0 }}>📌 Kanban Đơn hàng</h1>
                        <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>
                            Kéo thả đơn hàng qua các cột trạng thái · Cập nhật {lastRefresh.toLocaleTimeString("vi-VN")}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => navigate("/orders")}
                            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                            📋 Danh sách
                        </button>
                        <button onClick={() => loadOrders()}
                            style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#16a34a,#15803d)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "white" }}>
                            🔄 Làm mới
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="kanban-wrapper">
                    <div className="kanban-board">
                        {COLUMNS.map((col) => {
                            const colOrders = getOrdersByStatus(col.key);
                            const isOver = dragOver === col.key;
                            return (
                                <div key={col.key} className="kanban-col">
                                    {/* Column Header */}
                                    <div className="kanban-col-header" style={{ background: col.bg, borderBottom: `2px solid ${col.border}` }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 18 }}>{col.icon}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</span>
                                        </div>
                                        <span style={{
                                            minWidth: 24, height: 24, borderRadius: 12,
                                            background: col.color, color: "white", fontSize: 11,
                                            fontWeight: 700, display: "flex", alignItems: "center",
                                            justifyContent: "center", padding: "0 6px",
                                        }}>
                                            {colOrders.length}
                                        </span>
                                    </div>

                                    {/* Column Body - Drop Zone */}
                                    <div
                                        className={`kanban-col-body ${isOver ? "drag-over" : ""}`}
                                        onDragOver={(e) => handleDragOver(e, col.key)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, col.key)}
                                        style={{ borderColor: isOver ? col.color : "transparent" }}
                                    >
                                        {colOrders.length === 0 && (
                                            <div style={{ padding: "20px 12px", textAlign: "center", color: "#d1d5db", fontSize: 12 }}>
                                                {isOver ? "Thả đơn hàng vào đây" : "Chưa có đơn"}
                                            </div>
                                        )}

                                        {colOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                className={`kanban-card ${dragging === order.id ? "is-dragging" : ""} ${updating === order.id ? "is-updating" : ""}`}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, order)}
                                                onDragEnd={() => { setDragging(null); setDragOver(null); }}
                                                onTouchStart={() => handleTouchStart(order)}
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                            >
                                                {/* Updating overlay */}
                                                {updating === order.id && (
                                                    <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                                                        <div style={{ width: 20, height: 20, border: "2px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                                                    </div>
                                                )}

                                                {/* Card content */}
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>#{order.id}</span>
                                                    <span style={{ fontSize: 10, color: "#9ca3af" }}>
                                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : ""}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {order.customerName || order.styleName || "Đơn hàng"}
                                                </div>
                                                {order.styleName && (
                                                    <div style={{ fontSize: 11, color: "#9ca3af" }}>🎨 {order.styleName}</div>
                                                )}
                                                {order.tailorName && (
                                                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>✂️ {order.tailorName}</div>
                                                )}

                                                {/* Mobile: quick status buttons */}
                                                <div className="kanban-mobile-actions" style={{ marginTop: 8, gap: 4, flexWrap: "wrap" }}>
                                                    {COLUMNS.filter((c) => c.key !== col.key).map((target) => (
                                                        <button
                                                            key={target.key}
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, target.key); }}
                                                            style={{
                                                                padding: "3px 8px", borderRadius: 6, border: `1px solid ${target.border}`,
                                                                background: target.bg, color: target.color, fontSize: 10,
                                                                fontWeight: 600, cursor: "pointer",
                                                            }}
                                                        >
                                                            {target.icon} {target.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import invoiceService from "../services/invoiceService";

const formatCurrency = (amount) => (Number(amount) || 0).toLocaleString("vi-VN") + " đ";
const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "—";

const STATUS_BADGE = {
    issued: { label: "Chưa thanh toán", bg: "linear-gradient(135deg,#fee2e2,#fecaca)", color: "#991b1b", border: "#fca5a5" },
    partial_paid: { label: "Thanh toán 1 phần", bg: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#92400e", border: "#fcd34d" },
};

export default function UnpaidCustomersPage() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedCustomer, setExpandedCustomer] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true); setError(null);
            const response = await invoiceService.getUnpaidCustomers();
            const data = response?.responseData || response?.data || response || [];
            setCustomers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading unpaid customers:", err);
            setError("Không thể tải danh sách công nợ. Vui lòng thử lại.");
        } finally { setLoading(false); }
    };

    const filtered = customers.filter((c) => {
        const term = searchTerm.toLowerCase();
        return (c.customerName || "").toLowerCase().includes(term) || (c.customerPhone || "").toLowerCase().includes(term);
    });

    const totalCustomers = filtered.length;
    const totalDebt = filtered.reduce((sum, c) => sum + (Number(c.totalDue) || 0), 0);
    const totalInvoices = filtered.reduce((sum, c) => sum + (c.totalInvoices || 0), 0);

    const toggleExpand = (customerId) => setExpandedCustomer(expandedCustomer === customerId ? null : customerId);

    return (
        <>
            <style>{`
        .unpaid-page { padding:32px 40px; min-height:100vh; background:linear-gradient(145deg,#f0fdf4 0%,#ecfdf5 30%,#f0f9ff 100%); }
        .unpaid-summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:28px; }
        .unpaid-search { width:100%; max-width:420px; padding:12px 18px; border-radius:12px; border:1px solid #d1d5db; font-size:14px; outline:none; background:white; transition:border-color 0.2s; box-sizing:border-box; }
        .unpaid-search:focus { border-color:#16a34a; }
        .unpaid-table-header { display:grid; grid-template-columns:2fr 1.2fr 0.8fr 1.2fr 1.2fr 1.5fr 60px; padding:14px 24px; background:#f9fafb; border-bottom:1px solid #e5e7eb; font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:1px; }
        .unpaid-row { display:grid; grid-template-columns:2fr 1.2fr 0.8fr 1.2fr 1.2fr 1.5fr 60px; padding:16px 24px; border-bottom:1px solid #f3f4f6; cursor:pointer; transition:background 0.15s; align-items:center; }
        .unpaid-row:hover { background:#fafafa; }
        .unpaid-inv-row { display:grid; grid-template-columns:1.8fr 1fr 1fr 1fr 1fr 80px; padding:12px 16px; background:white; border-radius:10px; border:1px solid #e5e7eb; cursor:pointer; align-items:center; transition:box-shadow 0.15s,border-color 0.15s; }
        .unpaid-inv-row:hover { box-shadow:0 2px 8px rgba(0,0,0,0.08); border-color:#16a34a; }

        /* Mobile card view */
        @media (max-width: 768px) {
          .unpaid-page { padding:16px; }
          .unpaid-summary-grid { grid-template-columns:1fr; gap:12px; }
          .unpaid-search { max-width:100%; }
          .unpaid-table-header { display:none; }
          .unpaid-row {
            grid-template-columns:1fr;
            gap:8px;
            padding:16px;
            border:1px solid #e5e7eb;
            border-radius:12px;
            margin-bottom:8px;
            background:white;
          }
          .unpaid-row-phone { display:block !important; }
          .unpaid-row-hide-mobile { display:none !important; }
          .unpaid-expanded { padding:12px 16px 16px !important; }
          .unpaid-inv-row {
            grid-template-columns:1fr 1fr;
            gap:8px;
          }
          .unpaid-inv-hide-mobile { display:none !important; }
        }
        @media (min-width:769px) and (max-width:1024px) {
          .unpaid-page { padding:20px 24px; }
          .unpaid-summary-grid { grid-template-columns:repeat(3,1fr); gap:12px; }
          .unpaid-table-header { grid-template-columns:1.5fr 1fr 0.6fr 1fr 1fr 1.2fr 50px; font-size:10px; padding:12px 16px; }
          .unpaid-row { grid-template-columns:1.5fr 1fr 0.6fr 1fr 1fr 1.2fr 50px; padding:14px 16px; font-size:12px; }
        }
      `}</style>

            <div className="unpaid-page">
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, color: "#16a34a", textTransform: "uppercase", marginBottom: 4 }}>QUẢN LÝ CÔNG NỢ</p>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2e1a", margin: 0 }}>Khách hàng chưa thanh toán</h1>
                    <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Theo dõi và quản lý các khoản nợ chưa thu từ khách hàng</p>
                </div>

                {/* Summary Cards */}
                <div className="unpaid-summary-grid">
                    {[
                        { label: "Số khách hàng nợ", value: totalCustomers, sub: "Khách hàng", color: "#1e40af", grad: "linear-gradient(90deg,#3b82f6,#60a5fa)" },
                        { label: "Số hóa đơn nợ", value: totalInvoices, sub: "Hóa đơn", color: "#b45309", grad: "linear-gradient(90deg,#f59e0b,#fbbf24)" },
                        { label: "Tổng công nợ", value: formatCurrency(totalDebt), sub: "Chưa thanh toán", color: "#dc2626", grad: "linear-gradient(90deg,#ef4444,#f87171)" },
                    ].map((card, i) => (
                        <div key={i} style={{ background: "white", borderRadius: 16, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: card.grad }} />
                            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: "#6b7280", textTransform: "uppercase", margin: 0 }}>{card.label}</p>
                            <p style={{ fontSize: 28, fontWeight: 800, color: card.color, margin: "8px 0 0", wordBreak: "break-all" }}>{card.value}</p>
                            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div style={{ marginBottom: 20 }}>
                    <input className="unpaid-search" type="text" placeholder="🔍 Tìm theo tên hoặc số điện thoại..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
                        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                        <p>Đang tải danh sách công nợ...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "1px solid #fecaca", color: "#dc2626" }}>
                        <p style={{ fontSize: 18, fontWeight: 600 }}>⚠️ Lỗi</p>
                        <p>{error}</p>
                        <button onClick={loadData} style={{ marginTop: 12, padding: "10px 24px", background: "#16a34a", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Thử lại</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "1px solid #e5e7eb" }}>
                        <p style={{ fontSize: 48, margin: 0 }}>🎉</p>
                        <p style={{ fontSize: 18, fontWeight: 600, color: "#1a2e1a", marginTop: 12 }}>{searchTerm ? "Không tìm thấy kết quả" : "Không có công nợ!"}</p>
                        <p style={{ color: "#6b7280", fontSize: 14 }}>{searchTerm ? "Thử thay đổi từ khóa tìm kiếm" : "Tất cả khách hàng đã thanh toán đầy đủ"}</p>
                    </div>
                ) : (
                    <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
                        {/* Desktop Header */}
                        <div className="unpaid-table-header">
                            <span>Khách hàng</span><span>Số điện thoại</span><span style={{ textAlign: "center" }}>HĐ</span>
                            <span style={{ textAlign: "right" }}>Tổng tiền</span><span style={{ textAlign: "right" }}>Đã trả</span>
                            <span style={{ textAlign: "right" }}>Còn nợ</span><span />
                        </div>

                        {filtered.map((customer) => (
                            <div key={customer.customerId}>
                                <div className="unpaid-row" onClick={() => toggleExpand(customer.customerId)}
                                    style={{ background: expandedCustomer === customer.customerId ? "#f0fdf4" : "white" }}>
                                    {/* Name - always visible */}
                                    <span style={{ fontWeight: 600, color: "#1f2937", fontSize: 14 }}>{customer.customerName || "Không tên"}</span>
                                    {/* Phone - hidden on mobile via different display */}
                                    <span className="unpaid-row-hide-mobile" style={{ color: "#6b7280", fontSize: 13 }}>{customer.customerPhone || "—"}</span>
                                    {/* Invoice count */}
                                    <span className="unpaid-row-hide-mobile" style={{ textAlign: "center", fontWeight: 600, color: "#1e40af", fontSize: 14 }}>{customer.totalInvoices}</span>
                                    {/* Total */}
                                    <span className="unpaid-row-hide-mobile" style={{ textAlign: "right", fontSize: 13, color: "#374151" }}>{formatCurrency(customer.totalAmount)}</span>
                                    {/* Paid */}
                                    <span className="unpaid-row-hide-mobile" style={{ textAlign: "right", fontSize: 13, color: "#16a34a" }}>{formatCurrency(customer.totalPaid)}</span>
                                    {/* Due - always visible */}
                                    <span style={{ textAlign: "right", fontWeight: 700, fontSize: 15, color: "#dc2626" }}>{formatCurrency(customer.totalDue)}</span>
                                    {/* Arrow */}
                                    <span style={{ textAlign: "center", fontSize: 16, color: "#9ca3af", transition: "transform 0.2s", transform: expandedCustomer === customer.customerId ? "rotate(90deg)" : "rotate(0)" }}>▶</span>
                                </div>

                                {/* Expanded Invoices */}
                                {expandedCustomer === customer.customerId && customer.invoices && (
                                    <div className="unpaid-expanded" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "16px 24px 16px 48px" }}>
                                        {/* Mobile: show phone here */}
                                        <div style={{ display: "none" }} className="unpaid-row-phone">
                                            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>📞 {customer.customerPhone || "—"} · {customer.totalInvoices} hóa đơn</p>
                                        </div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Chi tiết hóa đơn</p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            {customer.invoices.map((inv) => {
                                                const badge = STATUS_BADGE[inv.status] || STATUS_BADGE.issued;
                                                return (
                                                    <div key={inv.id} className="unpaid-inv-row"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/invoice`); }}>
                                                        <div>
                                                            <span style={{ fontWeight: 600, fontSize: 13, color: "#1f2937" }}>{inv.code}</span>
                                                            <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8 }}>{formatDate(inv.createdAt)}</span>
                                                        </div>
                                                        <div className="unpaid-inv-hide-mobile">
                                                            <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>{badge.label}</span>
                                                        </div>
                                                        <span className="unpaid-inv-hide-mobile" style={{ fontSize: 13, color: "#374151", textAlign: "right" }}>{formatCurrency(inv.total)}</span>
                                                        <span className="unpaid-inv-hide-mobile" style={{ fontSize: 13, color: "#16a34a", textAlign: "right" }}>{formatCurrency(inv.paidAmount)}</span>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", textAlign: "right" }}>{formatCurrency(inv.dueAmount)}</span>
                                                        <span style={{ textAlign: "center", fontSize: 12, color: "#16a34a", fontWeight: 600 }}>Xem →</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

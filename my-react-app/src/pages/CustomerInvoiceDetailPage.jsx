import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";
import invoiceService from "../services/invoiceService";
import { showError, showSuccess } from "../components/NotificationToast.jsx";

const bankConfig = {
  bankName: "Vietcombank",
  bankCode: "VCB",
  accountNumber: "0123456789",
  accountName: "CTY TNHH MY HIEN FASHION",
};

const momoConfig = {
  phone: "0901234567",
  owner: "MY HIEN FASHION",
};

const mapBackendStatus = (status) => {
  const statusMap = {
    draft: "pending",
    issued: "pending",
    partial_paid: "processing",
    paid: "paid",
    voided: "cancelled",
    refunded: "refunded",
  };
  return statusMap[status] || "pending";
};

const STATUS_META = {
  pending: {
    label: "Chưa thanh toán",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "⏳",
  },
  processing: {
    label: "Đang thanh toán",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "💳",
  },
  paid: {
    label: "Đã thanh toán",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "✅",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: "❌",
  },
  refunded: {
    label: "Đã hoàn tiền",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "↩️",
  },
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const buildVietQRUrl = (amount, transferContent) => {
  const base = `https://img.vietqr.io/image/${bankConfig.bankCode}-${bankConfig.accountNumber}-qr_only.png`;
  const params = new URLSearchParams({
    amount: Math.round(amount || 0),
    addInfo: transferContent,
    accountName: bankConfig.accountName,
  });
  return `${base}?${params.toString()}`;
};

const buildMomoQrUrl = (amount, transferContent) => {
  const deeplink = `https://momo.vn/pay?phone=${momoConfig.phone}&amount=${Math.round(
    amount || 0
  )}&extra=${encodeURIComponent(transferContent)}`;
  return `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(
    deeplink
  )}`;
};

export default function CustomerInvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("BANK");
  const [showPaymentQR, setShowPaymentQR] = useState(false);

  usePageMeta({
    title: invoice ? `Hóa đơn ${invoice.code} | My Hiền Tailor` : "Chi tiết hóa đơn | My Hiền Tailor",
    description: "Xem chi tiết hóa đơn và thông tin thanh toán của bạn",
  });

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) {
        setError("Không tìm thấy mã hóa đơn");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get invoice by code or ID
        let invoiceData = null;
        
        // First try: assume it's a backend ID (number)
        const numericId = parseInt(id);
        if (!isNaN(numericId)) {
          try {
            const response = await invoiceService.getDetail(numericId);
            invoiceData = response?.data ?? response?.responseData ?? response;
          } catch (err) {
            console.warn("Failed to load by numeric ID, trying to find by code...", err);
          }
        }

        // If not found, try to find in list by code
        if (!invoiceData) {
          const listResponse = await invoiceService.list({}, { page: 0, size: 100 });
          const invoicesData = listResponse?.responseData?.content || 
                              listResponse?.data?.content || 
                              listResponse?.content || 
                              listResponse?.data || 
                              [];
          const found = invoicesData.find(inv => 
            inv.code === id || 
            inv.id?.toString() === id ||
            `INV-${inv.id}` === id
          );
          if (found) {
            invoiceData = found;
          }
        }

        if (!invoiceData) {
          throw new Error("Không tìm thấy hóa đơn");
        }

        // Map to frontend format
        const mappedInvoice = {
          id: invoiceData.id,
          code: invoiceData.code || `INV-${invoiceData.id}`,
          customerName: invoiceData.customer?.name || "",
          customerPhone: invoiceData.customer?.phone || "",
          status: mapBackendStatus(invoiceData.status),
          total: invoiceData.total ? Number(invoiceData.total) : 0,
          subtotal: invoiceData.subtotal ? Number(invoiceData.subtotal) : 0,
          discountAmount: invoiceData.discountAmount ? Number(invoiceData.discountAmount) : 0,
          taxAmount: invoiceData.taxAmount ? Number(invoiceData.taxAmount) : 0,
          dueDate: invoiceData.dueDate || "",
          issuedAt: invoiceData.issuedAt || invoiceData.createdAt || "",
          notes: invoiceData.notes || "",
          items: (invoiceData.items || []).map(item => ({
            id: item.id,
            name: item.name || "",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
            lineTotal: item.lineTotal ? Number(item.lineTotal) : 0,
            description: item.description || "",
          })),
          transactions: (invoiceData.transactions || []).map(tx => ({
            id: tx.id,
            amount: tx.amount ? Number(tx.amount) : 0,
            provider: tx.provider || "",
            providerRef: tx.providerRef || "",
            paidAt: tx.paidAt || tx.createdAt || "",
            notes: tx.notes || "",
          })),
          orderId: invoiceData.orderId,
        };

        setInvoice(mappedInvoice);
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError(err.message || "Không thể tải thông tin hóa đơn");
        showError("Không thể tải thông tin hóa đơn");
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id]);

  const paidAmount = invoice
    ? invoice.transactions.reduce((sum, tx) => sum + tx.amount, 0)
    : 0;
  const remainingAmount = invoice
    ? Math.max(invoice.total - paidAmount, 0)
    : 0;

  const transferContent = invoice ? `MH_${invoice.code}` : "MH_INVOICE";
  const bankQr = invoice && remainingAmount > 0
    ? buildVietQRUrl(remainingAmount, transferContent)
    : "";
  const momoQr = invoice && remainingAmount > 0
    ? buildMomoQrUrl(remainingAmount, transferContent)
    : "";

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-slate-50">
        <Header currentPage="/customer/invoice" />
        <div className="pt-[170px] md:pt-[190px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-3 text-[#6B7280]">
                <div className="w-5 h-5 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[14px]">Đang tải thông tin hóa đơn...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-slate-50">
        <Header currentPage="/customer/invoice" />
        <div className="pt-[170px] md:pt-[190px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-16">
              <div className="inline-block p-6 rounded-[24px] bg-white border border-[#E4D8C3]">
                <p className="text-[48px] mb-3">📄</p>
                <p className="text-[16px] font-semibold text-[#1B4332] mb-1">
                  {error || "Không tìm thấy hóa đơn"}
                </p>
                <button
                  onClick={() => navigate("/customer/dashboard")}
                  className="mt-4 px-5 py-2.5 rounded-full bg-[#1B4332] text-white text-[13px] font-semibold hover:bg-[#133021] transition-all"
                >
                  Quay lại Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[invoice.status] || STATUS_META.pending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-slate-50">
      <Header currentPage="/customer/invoice" />
      <div className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/customer/dashboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[#E4D8C3] text-[#1B4332] text-[13px] font-semibold hover:bg-white transition-all"
            >
              <span>←</span>
              <span>Quay lại Dashboard</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-full bg-[#1B4332] text-white text-[13px] font-semibold hover:bg-[#133021] transition-all"
            >
              🖨️ In hóa đơn
            </button>
          </div>

          {/* Invoice Card */}
          <div className="bg-white rounded-[30px] border border-[#E4D8C3] shadow-[0_18px_40px_rgba(148,114,80,0.18)] overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#1B4332] to-[#133021] text-white p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200 mb-2">
                    Hóa đơn
                  </p>
                  <h1 className="heading-font text-[28px] md:text-[32px] font-bold">
                    {invoice.code}
                  </h1>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold border ${statusMeta.className.replace('bg-', 'bg-white/20 ').replace('text-', 'text-white ').replace('border-', 'border-white/30 ')}`}>
                    <span>{statusMeta.icon}</span>
                    <span>{statusMeta.label}</span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-emerald-100 mb-1">Ngày phát hành</p>
                  <p className="font-semibold">{formatDate(invoice.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-emerald-100 mb-1">Ngày đến hạn</p>
                  <p className="font-semibold">{formatDate(invoice.dueDate) || "—"}</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-6 md:p-8 border-b border-[#E4D8C3] bg-gradient-to-r from-[#FFF7E6] to-white">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#8C6B3F] mb-3">
                Thông tin khách hàng
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-[14px]">
                <div>
                  <p className="text-[#6B7280] mb-1">Tên khách hàng</p>
                  <p className="font-semibold text-[#1B4332]">{invoice.customerName || "—"}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] mb-1">Số điện thoại</p>
                  <p className="font-semibold text-[#1B4332]">{invoice.customerPhone || "—"}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="p-6 md:p-8">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#8C6B3F] mb-4">
                Chi tiết sản phẩm / dịch vụ
              </p>
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-start justify-between gap-4 p-4 rounded-[16px] bg-[#F8F4EC] border border-[#E4D8C3]"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-[#1B4332] text-[15px] mb-1">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-[13px] text-[#6B7280] mb-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-[12px] text-[#6B7280]">
                        <span>Số lượng: <span className="font-semibold">{item.quantity}</span></span>
                        <span>Đơn giá: <span className="font-semibold">{formatCurrency(item.unitPrice)}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[18px] font-bold text-[#1B4332]">
                        {formatCurrency(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 md:p-8 border-t border-[#E4D8C3] bg-gradient-to-br from-[#F8F4EC] to-white">
              <div className="max-w-md ml-auto space-y-3">
                {invoice.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-[#6B7280]">Tạm tính</span>
                    <span className="font-semibold text-[#1B4332]">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                )}
                {invoice.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-[#6B7280]">Giảm giá</span>
                    <span className="font-semibold text-emerald-600">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-[#6B7280]">Thuế VAT</span>
                    <span className="font-semibold text-[#1B4332]">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[16px] font-bold pt-3 border-t-2 border-[#1B4332]">
                  <span className="text-[#1B4332]">Tổng cộng</span>
                  <span className="text-[#1B4332] text-[20px]">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {invoice.status !== "paid" && remainingAmount > 0 && (
              <div className="p-6 md:p-8 border-t border-[#E4D8C3] bg-amber-50">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[13px] text-[#6B7280] mb-1">Đã thanh toán</p>
                    <p className="text-[18px] font-bold text-emerald-600">
                      {formatCurrency(paidAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] text-[#6B7280] mb-1">Còn phải thanh toán</p>
                    <p className="text-[18px] font-bold text-rose-600">
                      {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentQR(true)}
                  className="w-full px-5 py-3 rounded-full bg-[#1B4332] text-white text-[14px] font-semibold hover:bg-[#133021] transition-all"
                >
                  💳 Xem QR thanh toán
                </button>
              </div>
            )}

            {invoice.status === "paid" && (
              <div className="p-6 md:p-8 border-t border-[#E4D8C3] bg-emerald-50">
                <div className="flex items-center gap-3">
                  <span className="text-[24px]">✅</span>
                  <div>
                    <p className="text-[14px] font-semibold text-emerald-700">
                      Hóa đơn đã được thanh toán đầy đủ
                    </p>
                    <p className="text-[12px] text-emerald-600 mt-1">
                      Tổng số tiền: {formatCurrency(invoice.total)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions */}
            {invoice.transactions.length > 0 && (
              <div className="p-6 md:p-8 border-t border-[#E4D8C3]">
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#8C6B3F] mb-4">
                  Lịch sử thanh toán
                </p>
                <div className="space-y-3">
                  {invoice.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-[16px] bg-[#F8F4EC] border border-[#E4D8C3]"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-[#1B4332] text-[14px] mb-1">
                          {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-[12px] text-[#6B7280]">
                          {formatDateTime(tx.paidAt)}
                        </p>
                        {tx.providerRef && (
                          <p className="text-[11px] text-[#9CA3AF] mt-1">
                            Mã tham chiếu: {tx.providerRef}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                          {tx.provider === "vnpay" ? "Banking" : tx.provider === "momo" ? "MoMo" : tx.provider === "cash" ? "Tiền mặt" : tx.provider}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="p-6 md:p-8 border-t border-[#E4D8C3] bg-[#F8F4EC]">
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#8C6B3F] mb-2">
                  Ghi chú
                </p>
                <p className="text-[14px] text-[#4B5563]">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment QR Modal */}
      {showPaymentQR && remainingAmount > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[30px] shadow-2xl border border-[#E4D8C3] p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-semibold text-[#1B4332]">
                Thanh toán hóa đơn
              </h3>
              <button
                onClick={() => setShowPaymentQR(false)}
                className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setPaymentMethod("BANK")}
                className={`flex-1 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all ${
                  paymentMethod === "BANK"
                    ? "bg-[#1B4332] text-white"
                    : "bg-[#F8F4EC] text-[#1B4332] border border-[#E4D8C3]"
                }`}
              >
                Ngân hàng
              </button>
              <button
                onClick={() => setPaymentMethod("MOMO")}
                className={`flex-1 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all ${
                  paymentMethod === "MOMO"
                    ? "bg-[#1B4332] text-white"
                    : "bg-[#F8F4EC] text-[#1B4332] border border-[#E4D8C3]"
                }`}
              >
                MoMo
              </button>
            </div>

            {paymentMethod === "BANK" && bankQr && (
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-[14px] font-semibold text-[#1B4332] mb-1">
                    {bankConfig.bankName}
                  </p>
                  <p className="text-[12px] text-[#6B7280]">
                    {bankConfig.accountNumber} - {bankConfig.accountName}
                  </p>
                </div>
                <div className="aspect-square bg-white rounded-[20px] border-2 border-dashed border-[#E4D8C3] p-4 mb-4">
                  <img
                    src={bankQr}
                    alt="VietQR"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div className="space-y-2 text-[12px] text-[#4B5563] bg-[#F8F4EC] rounded-[16px] p-4">
                  <div className="flex justify-between">
                    <span>Số tiền:</span>
                    <span className="font-semibold text-[#1B4332]">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nội dung CK:</span>
                    <span className="font-semibold text-[#1B4332]">{transferContent}</span>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "MOMO" && momoQr && (
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-[14px] font-semibold text-[#1B4332] mb-1">
                    Ví MoMo
                  </p>
                  <p className="text-[12px] text-[#6B7280]">
                    {momoConfig.owner} · {momoConfig.phone}
                  </p>
                </div>
                <div className="aspect-square bg-white rounded-[20px] border-2 border-dashed border-[#E4D8C3] p-4 mb-4">
                  <img
                    src={momoQr}
                    alt="MoMo QR"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div className="space-y-2 text-[12px] text-[#4B5563] bg-[#F8F4EC] rounded-[16px] p-4">
                  <div className="flex justify-between">
                    <span>Số tiền:</span>
                    <span className="font-semibold text-[#1B4332]">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nội dung CK:</span>
                    <span className="font-semibold text-[#1B4332]">{transferContent}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-amber-50 rounded-[16px] border border-amber-200">
              <p className="text-[11px] text-amber-800 font-semibold mb-2">
                ⚠️ Lưu ý quan trọng
              </p>
              <ul className="text-[11px] text-amber-700 space-y-1 list-disc list-inside">
                <li>Vui lòng chuyển đúng số tiền: {formatCurrency(remainingAmount)}</li>
                <li>Nội dung chuyển khoản phải đúng: {transferContent}</li>
                <li>Sau khi thanh toán, hệ thống sẽ tự động cập nhật trạng thái</li>
                <li>Nếu có vấn đề, vui lòng liên hệ: 0901 134 256</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}


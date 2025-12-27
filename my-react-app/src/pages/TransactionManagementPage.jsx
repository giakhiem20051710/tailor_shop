import { useEffect, useMemo, useState } from "react";
import invoiceService from "../services/invoiceService";

const METHOD_LABELS = {
  BANK: "Ngân hàng",
  MOMO: "Ví MoMo",
  CASH: "Tiền mặt",
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

export default function TransactionManagementPage() {
  const [invoices, setInvoices] = useState([]);
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        console.log('[TransactionManagementPage] Loading invoices from API...');
        const response = await invoiceService.list({}, { page: 0, size: 100 });
        console.log('[TransactionManagementPage] Raw API response:', response);
        console.log('[TransactionManagementPage] Response keys:', Object.keys(response || {}));
        
        // Backend trả về CommonResponse<Page<InvoiceResponse>> với cấu trúc:
        // { 
        //   responseStatus: {...}, 
        //   responseData: { 
        //     content: [...],  // Array of InvoiceResponse
        //     totalElements: ...,
        //     totalPages: ...,
        //     ...
        //   } 
        // }
        let invoicesData = [];
        
        // Ưu tiên responseData.content (cấu trúc chuẩn từ CommonResponse)
        if (response?.responseData?.content && Array.isArray(response.responseData.content)) {
          invoicesData = response.responseData.content;
          console.log('[TransactionManagementPage] ✅ Found in responseData.content, count:', invoicesData.length);
        } 
        // Fallback: data.content
        else if (response?.data?.content && Array.isArray(response.data.content)) {
          invoicesData = response.data.content;
          console.log('[TransactionManagementPage] ✅ Found in data.content, count:', invoicesData.length);
        } 
        // Fallback: responseData là Page object trực tiếp
        else if (response?.responseData && Array.isArray(response.responseData)) {
          invoicesData = response.responseData;
          console.log('[TransactionManagementPage] ✅ Found in responseData (direct array), count:', invoicesData.length);
        }
        // Fallback: content trực tiếp
        else if (Array.isArray(response?.content)) {
          invoicesData = response.content;
          console.log('[TransactionManagementPage] ✅ Found in content (direct array), count:', invoicesData.length);
        } 
        // Fallback: data trực tiếp
        else if (Array.isArray(response?.data)) {
          invoicesData = response.data;
          console.log('[TransactionManagementPage] ✅ Found in data (direct array), count:', invoicesData.length);
        } 
        // Fallback: response là array trực tiếp
        else if (Array.isArray(response)) {
          invoicesData = response;
          console.log('[TransactionManagementPage] ✅ Response is direct array, count:', invoicesData.length);
        } 
        // Không tìm thấy
        else {
          console.warn('[TransactionManagementPage] ⚠️ Unknown response structure:', response);
          console.warn('[TransactionManagementPage] Response type:', typeof response);
          if (response && typeof response === 'object') {
            console.warn('[TransactionManagementPage] Response keys:', Object.keys(response));
            if (response.responseData) {
              console.warn('[TransactionManagementPage] responseData type:', typeof response.responseData);
              console.warn('[TransactionManagementPage] responseData keys:', Object.keys(response.responseData));
            }
          }
          invoicesData = [];
        }
        
        // Map backend invoices to frontend format
        // Backend InvoiceResponse structure:
        // { id, code, customer: {id, name, phone}, transactions: [{provider, amount, ...}], ... }
        const mappedInvoices = Array.isArray(invoicesData) 
          ? invoicesData.map(inv => {
              console.log('[TransactionManagementPage] Mapping invoice:', inv.code || inv.id);
              return {
                id: inv.code || `INV-${inv.id}`,
                customerName: inv.customer?.name || "",
                phone: inv.customer?.phone || "",
                transactions: (inv.transactions || []).map(tx => ({
                  id: tx.id,
                  amount: tx.amount ? Number(tx.amount) : 0,
                  method: tx.provider === "vnpay" ? "BANK" : 
                         tx.provider === "momo" ? "MOMO" : 
                         tx.provider === "cash" ? "CASH" : "BANK",
                  reference: tx.providerRef || "",
                  createdAt: tx.paidAt || tx.createdAt || "",
                })),
              };
            })
          : [];
        
        console.log('[TransactionManagementPage] Mapped invoices count:', mappedInvoices.length);
        if (mappedInvoices.length > 0) {
          console.log('[TransactionManagementPage] First mapped invoice:', mappedInvoices[0]);
        }
        
        setInvoices(mappedInvoices);
      } catch (error) {
        console.error("Error loading invoices:", error);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadInvoices();
  }, []);

  const allTransactions = useMemo(() => {
    return invoices
      .flatMap((inv) =>
        (inv.transactions || []).map((tx) => ({
          ...tx,
          invoiceId: inv.id,
          customerName: inv.customerName,
          phone: inv.phone,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
      );
  }, [invoices]);

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allTransactions.filter((tx) => {
      const methodMatch =
        methodFilter === "all" ? true : tx.method === methodFilter;
      const searchMatch = term
        ? tx.customerName.toLowerCase().includes(term) ||
          tx.phone.includes(term) ||
          (tx.reference || "").toLowerCase().includes(term) ||
          (tx.invoiceId || "").toLowerCase().includes(term)
        : true;
      return methodMatch && searchMatch;
    });
  }, [allTransactions, methodFilter, searchTerm]);

  const stats = useMemo(() => {
    const totalAmount = filteredTransactions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );
    const momoCount = filteredTransactions.filter((tx) => tx.method === "MOMO")
      .length;
    const bankCount = filteredTransactions.filter((tx) => tx.method === "BANK")
      .length;
    const lastPayment = filteredTransactions[0]?.createdAt || "—";
    return {
      totalTx: filteredTransactions.length,
      totalAmount,
      momoCount,
      bankCount,
      lastPayment,
    };
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] py-10 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332] mx-auto mb-4"></div>
          <p className="text-[#6B7280]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#AD7A2A]">
              Quản lý giao dịch
            </p>
            <h1 className="text-3xl font-semibold text-[#1F2A37]">
              Customer Transactions
            </h1>
            <p className="text-sm text-[#6B7280]">
              Theo dõi tất cả giao dịch thanh toán của khách hàng theo thời
              gian thực.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-4">
          <MiniStat label="Số giao dịch" value={stats.totalTx} />
          <MiniStat
            label="Tổng tiền"
            value={formatCurrency(stats.totalAmount)}
            accent="from-emerald-500 to-emerald-600"
          />
          <MiniStat
            label="Bank / MoMo"
            value={`${stats.bankCount} / ${stats.momoCount}`}
            accent="from-sky-500 to-blue-600"
          />
          <MiniStat label="Thanh toán mới nhất" value={stats.lastPayment} />
        </section>

        <section className="bg-white rounded-3xl border border-[#ECE7DD] p-6 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-[#6B7280]">Phương thức</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 rounded-full border border-[#E5E7EB] text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="BANK">Ngân hàng</option>
                <option value="MOMO">MoMo</option>
                <option value="CASH">Tiền mặt</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo khách hàng, SĐT, hóa đơn hoặc mã tham chiếu..."
                className="w-full px-4 py-2 rounded-full border border-[#E5E7EB] text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#111827] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Hóa đơn</th>
                  <th className="px-4 py-3 text-left">Phương thức</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-left">Mã tham chiếu</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length ? (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-[#E5E7EB] last:border-0"
                    >
                      <td className="px-4 py-3">{tx.createdAt}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#111827]">
                          {tx.customerName}
                        </p>
                        <p className="text-xs text-[#6B7280]">{tx.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#1F2A37]">
                        {tx.invoiceId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 rounded-full bg-[#F3F4F6] text-xs font-semibold text-[#111827]">
                          {METHOD_LABELS[tx.method] || tx.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#111827]">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3">{tx.reference || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-[#6B7280]"
                    >
                      Không có giao dịch nào phù hợp bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent = "from-slate-900 to-slate-800" }) {
  return (
    <div className="rounded-2xl border border-[#ECE7DD] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-[#9CA3AF]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-[#111827]">{value}</p>
      <div className={`mt-4 h-2 rounded-full bg-gradient-to-r ${accent}`} />
    </div>
  );
}

